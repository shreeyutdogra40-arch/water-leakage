using Microsoft.EntityFrameworkCore;
using AquaFlow.Server.Models;

namespace AquaFlow.Server.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users => Set<User>();
        public DbSet<Community> Communities => Set<Community>();
        public DbSet<Building> Buildings => Set<Building>();
        public DbSet<Household> Households => Set<Household>();
        public DbSet<Pipeline> Pipelines => Set<Pipeline>();
        public DbSet<Sensor> Sensors => Set<Sensor>();
        public DbSet<SensorReading> SensorReadings => Set<SensorReading>();
        public DbSet<WaterTank> WaterTanks => Set<WaterTank>();
        public DbSet<WaterSupplyRecord> WaterSupplyRecords => Set<WaterSupplyRecord>();
        public DbSet<LeakageIncident> LeakageIncidents => Set<LeakageIncident>();
        public DbSet<Notification> Notifications => Set<Notification>();
        public DbSet<MaintenanceRecord> MaintenanceRecords => Set<MaintenanceRecord>();
        public DbSet<ValveAction> ValveActions => Set<ValveAction>();
        public DbSet<ConsumptionRecord> ConsumptionRecords => Set<ConsumptionRecord>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Indexes
            modelBuilder.Entity<User>().HasIndex(u => u.Username).IsUnique();
            modelBuilder.Entity<User>().HasIndex(u => u.Email).IsUnique();
            modelBuilder.Entity<Building>().HasIndex(b => b.BlockCode).IsUnique();
            modelBuilder.Entity<Household>().HasIndex(h => h.MeterId).IsUnique();
            modelBuilder.Entity<Pipeline>().HasIndex(p => p.Code).IsUnique();
            modelBuilder.Entity<Sensor>().HasIndex(s => s.SensorCode).IsUnique();
            modelBuilder.Entity<SensorReading>().HasIndex(r => new { r.SensorId, r.Timestamp });
            modelBuilder.Entity<LeakageIncident>().HasIndex(i => i.DetectedAt);
            modelBuilder.Entity<LeakageIncident>().HasIndex(i => i.Status);
            modelBuilder.Entity<Notification>().HasIndex(n => n.IsRead);
            modelBuilder.Entity<ConsumptionRecord>().HasIndex(c => c.RecordDate);
        }
    }
}
