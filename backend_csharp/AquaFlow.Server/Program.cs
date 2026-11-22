using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using AquaFlow.Server.Data;
using AquaFlow.Server.Models;
using AquaFlow.Server.Services;
using AppWebSocketManager = AquaFlow.Server.Services.WebSocketManager;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Configure URL / port (default port 8000 to match FastAPI & Vite dev proxy)
builder.WebHost.UseUrls(Environment.GetEnvironmentVariable("ASPNETCORE_URLS") ?? "http://0.0.0.0:8000");

// Add Controllers with snake_case JSON serialization
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower;
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.SnakeCaseLower));
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    });

// Configure SQLite DbContext
builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseSqlite("Data Source=water_system_csharp.db");
});

// Register Application Services
builder.Services.AddSingleton<AppWebSocketManager>();
builder.Services.AddSingleton<LeakageDetectionEngine>();
builder.Services.AddSingleton<AutomationService>();
builder.Services.AddSingleton<AnalyticsService>();

// Register IoT Simulator as singleton & hosted background service
builder.Services.AddSingleton<IoTSimulatorBackgroundService>();
builder.Services.AddHostedService(sp => sp.GetRequiredService<IoTSimulatorBackgroundService>());

// Configure JWT Authentication
var secretKey = builder.Configuration["Jwt:SecretKey"] ?? "aquaflow-super-secret-jwt-signing-key-for-smart-water-system";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey))
        };
    });

builder.Services.AddAuthorization();

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Enable Swagger
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "AquaFlow Smart Water API v2 (C#)");
});

app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

// Enable WebSockets
app.UseWebSockets();
app.Map("/ws", async (HttpContext context, AppWebSocketManager wsManager) =>
{
    if (context.WebSockets.IsWebSocketRequest)
    {
        using var webSocket = await context.WebSockets.AcceptWebSocketAsync();
        var socketId = Guid.NewGuid().ToString();
        wsManager.AddSocket(socketId, webSocket);

        var buffer = new byte[1024 * 4];
        try
        {
            while (webSocket.State == WebSocketState.Open)
            {
                var result = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);
                if (result.MessageType == WebSocketMessageType.Close)
                {
                    await wsManager.RemoveSocketAsync(socketId);
                    break;
                }
                else if (result.MessageType == WebSocketMessageType.Text)
                {
                    var msg = Encoding.UTF8.GetString(buffer, 0, result.Count);
                    if (msg == "ping")
                    {
                        var pong = Encoding.UTF8.GetBytes("{\"type\":\"pong\"}");
                        await webSocket.SendAsync(new ArraySegment<byte>(pong), WebSocketMessageType.Text, true, CancellationToken.None);
                    }
                }
            }
        }
        catch
        {
            await wsManager.RemoveSocketAsync(socketId);
        }
    }
    else
    {
        context.Response.StatusCode = StatusCodes.Status400BadRequest;
    }
});

// Map API Controllers
app.MapControllers();

// Root status endpoint
app.MapGet("/", (IoTSimulatorBackgroundService simulator) => Results.Ok(new
{
    system = "AquaFlow Smart Community Water System (.NET 8 C# Edition)",
    version = "2.0.0",
    status = "online",
    backend = "ASP.NET Core Web API (C#)",
    simulation_mode = simulator.IsRunning,
    active_scenario = simulator.ActiveScenario,
    docs_url = "/swagger"
}));

// Initialize database schema and seed data
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    DbInitializer.Initialize(db);
}

// Self-test verification mode
if (args.Contains("--verify"))
{
    Console.WriteLine("==================================================");
    Console.WriteLine("  AquaFlow C# (.NET 8) Comprehensive Self-Test    ");
    Console.WriteLine("==================================================");
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var leakageEngine = scope.ServiceProvider.GetRequiredService<LeakageDetectionEngine>();
        var automation = scope.ServiceProvider.GetRequiredService<AutomationService>();

        // 1. Verify DB Seeding
        Console.Write("[TEST 1/5] Checking Database Seeding & Admin User... ");
        var admin = db.Users.FirstOrDefault(u => u.Role == UserRole.Admin);
        if (admin == null || admin.FullName != "Shreeyut")
        {
            throw new Exception($"Admin user Shreeyut not found! Found: {admin?.FullName}");
        }
        Console.WriteLine($"PASSED (Admin: {admin.FullName}, Role: {admin.Role})");

        // 2. Verify Incidents Seeding
        Console.Write("[TEST 2/5] Checking Pre-Seeded Leakage Incidents... ");
        var incidentCount = db.LeakageIncidents.Count();
        if (incidentCount < 6)
        {
            throw new Exception($"Expected at least 6 incidents, found {incidentCount}");
        }
        Console.WriteLine($"PASSED ({incidentCount} incidents across Critical/High/Medium/Low)");

        // 3. Verify Pipe Burst Detection
        Console.Write("[TEST 3/5] Testing LeakageDetectionEngine Pipe Burst Rule... ");
        var pipeline = db.Pipelines.First(p => p.BuildingId.HasValue);
        LeakageIncident? burst = null;
        for (int i = 0; i < 3; i++)
        {
            burst = leakageEngine.EvaluatePipelineTelemetry(db, pipeline, currentFlow: 160.0, currentPressure: 1.2);
        }
        if (burst == null || burst.Severity != IncidentSeverity.Critical)
        {
            throw new Exception($"Pipe burst not flagged as critical! Result: {burst?.Severity}");
        }
        Console.WriteLine($"PASSED (Severity: {burst.Severity}, Reason: {burst.DetectionReason})");

        // 4. Verify Safety Rule 10: Trunk Main Protection
        Console.Write("[TEST 4/5] Testing Safety Rule 10 (TRUNK-MAIN-01 Auto-Isolation Block)... ");
        var mainTrunk = db.Pipelines.First(p => p.Name.Contains("Main"));
        var criticalTrunkIncident = new LeakageIncident
        {
            PipelineId = mainTrunk.Id,
            Severity = IncidentSeverity.Critical,
            DetectionReason = "Simulated Catastrophic Header Failure"
        };
        bool trunkIsolated = automation.HandleCriticalIncident(db, criticalTrunkIncident);
        if (trunkIsolated || mainTrunk.IsIsolated)
        {
            throw new Exception("Safety Violation! Primary community main transmission line was automatically closed!");
        }
        Console.WriteLine("PASSED (Safety Rule 10 Enforced: Trunk Main isolation blocked, admin alert raised)");

        // 5. Verify ML/Statistical Diurnal Curve Scoring
        Console.Write("[TEST 5/5] Testing 24h Diurnal Consumption ML Scoring... ");
        var normalCurve = new List<double> { 5, 4, 3, 4, 6, 15, 35, 40, 25, 20, 18, 22, 25, 20, 18, 19, 22, 38, 42, 30, 22, 15, 10, 6 };
        var anomalousCurve = new List<double> { 38, 40, 39, 41, 42, 45, 48, 50, 47, 49, 46, 48, 47, 49, 50, 48, 49, 51, 52, 48, 47, 45, 42, 40 };
        var (isNormAnomaly, _) = leakageEngine.ScoreHourlyConsumptionProfile(normalCurve);
        var (isAbnormAnomaly, conf) = leakageEngine.ScoreHourlyConsumptionProfile(anomalousCurve);
        if (isNormAnomaly || !isAbnormAnomaly)
        {
            throw new Exception($"ML profile scoring failed: normal={isNormAnomaly}, abnormal={isAbnormAnomaly}");
        }
        Console.WriteLine($"PASSED (Normal: Anomaly=False, Abnormal: Anomaly=True, Confidence={conf:F2})");

        Console.WriteLine("==================================================");
        Console.WriteLine("  ALL 5 C# BACKEND ENGINE TESTS PASSED (100%)!    ");
        Console.WriteLine("==================================================");
        return;
    }
}

app.Run();
