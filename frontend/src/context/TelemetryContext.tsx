import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Pipeline, WaterTank, NotificationItem } from '../types';
import { getLiveMonitoring } from '../services/api';

interface LiveTelemetryData {
  timestamp: string;
  total_system_flow_lpm: number;
  average_pressure_bar: number;
  main_reservoir_pct: number;
  main_reservoir_litres: number;
  overhead_tanks_avg_pct: number;
  active_scenario: string | null;
  pipelines: Pipeline[];
  tanks: WaterTank[];
}

interface TelemetryContextType {
  telemetry: LiveTelemetryData | null;
  isConnected: boolean;
  activeAlerts: NotificationItem[];
  dismissAlertToast: (id: number) => void;
  refreshSnapshot: () => Promise<void>;
}

const TelemetryContext = createContext<TelemetryContextType | undefined>(undefined);

export const TelemetryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [telemetry, setTelemetry] = useState<LiveTelemetryData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState<NotificationItem[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  const refreshSnapshot = async () => {
    try {
      const resp = await getLiveMonitoring();
      if (resp.data) {
        setTelemetry((prev) => ({
          timestamp: resp.data.timestamp,
          total_system_flow_lpm: resp.data.pipelines.reduce((sum: number, p: Pipeline) => sum + p.current_flow_lpm, 0),
          average_pressure_bar: resp.data.pipelines.length
            ? resp.data.pipelines.reduce((sum: number, p: Pipeline) => sum + p.current_pressure_bar, 0) / resp.data.pipelines.length
            : 3.5,
          main_reservoir_pct: resp.data.tanks[0]?.current_level_percentage || 80,
          main_reservoir_litres: resp.data.tanks[0]?.current_level_litres || 68000,
          overhead_tanks_avg_pct: 78.5,
          active_scenario: prev?.active_scenario || null,
          pipelines: resp.data.pipelines,
          tanks: resp.data.tanks,
        }));
      }
    } catch (err) {
      console.warn('Could not fetch snapshot', err);
    }
  };

  useEffect(() => {
    refreshSnapshot();

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    const connectWs = () => {
      try {
        const socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          setIsConnected(true);
          console.log('✅ Telemetry WebSocket connected.');
        };

        socket.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'TELEMETRY_TICK') {
              setTelemetry(msg.data);
            } else if (msg.type === 'NEW_ALERT') {
              setActiveAlerts((prev) => [msg.data, ...prev.slice(0, 4)]);
            }
          } catch (e) {
            console.error('Error parsing WS message', e);
          }
        };

        socket.onclose = () => {
          setIsConnected(false);
          // Try reconnect after 3 seconds
          setTimeout(connectWs, 3000);
        };

        socket.onerror = (err) => {
          console.warn('WS error, closing', err);
          socket.close();
        };
      } catch (err) {
        console.warn('WS init error', err);
        setTimeout(connectWs, 5000);
      }
    };

    connectWs();

    // Fallback polling every 4 seconds if WS is disconnected
    const pollInterval = setInterval(() => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        refreshSnapshot();
      }
    }, 4000);

    return () => {
      clearInterval(pollInterval);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const dismissAlertToast = (id: number) => {
    setActiveAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <TelemetryContext.Provider
      value={{
        telemetry,
        isConnected,
        activeAlerts,
        dismissAlertToast,
        refreshSnapshot,
      }}
    >
      {children}
    </TelemetryContext.Provider>
  );
};

export const useTelemetry = () => {
  const ctx = useContext(TelemetryContext);
  if (!ctx) throw new Error('useTelemetry must be used within TelemetryProvider');
  return ctx;
};
