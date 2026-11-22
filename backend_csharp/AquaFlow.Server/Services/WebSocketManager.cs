using System;
using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;

namespace AquaFlow.Server.Services
{
    public class WebSocketManager
    {
        private readonly ConcurrentDictionary<string, WebSocket> _sockets = new();

        public void AddSocket(string id, WebSocket socket)
        {
            _sockets.TryAdd(id, socket);
        }

        public async Task RemoveSocketAsync(string id)
        {
            if (_sockets.TryRemove(id, out var socket))
            {
                if (socket.State == WebSocketState.Open)
                {
                    try
                    {
                        await socket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Closed by server", CancellationToken.None);
                    }
                    catch { }
                }
            }
        }

        public async Task BroadcastAsync(object payload)
        {
            var json = JsonSerializer.Serialize(payload, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
                Converters = { new JsonStringEnumConverter(JsonNamingPolicy.SnakeCaseLower) }
            });
            var buffer = Encoding.UTF8.GetBytes(json);
            var segment = new ArraySegment<byte>(buffer);

            foreach (var (id, socket) in _sockets)
            {
                if (socket.State == WebSocketState.Open)
                {
                    try
                    {
                        await socket.SendAsync(segment, WebSocketMessageType.Text, true, CancellationToken.None);
                    }
                    catch
                    {
                        _sockets.TryRemove(id, out _);
                    }
                }
                else
                {
                    _sockets.TryRemove(id, out _);
                }
            }
        }
    }
}
