import React, { useState, useEffect } from 'react';
import {
  Droplet,
  Activity,
  AlertTriangle,
  TrendingDown,
  Cpu,
  ShieldCheck,
  CheckCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { MetricCard } from '../components/MetricCard';
import { TankVisualizer } from '../components/TankVisualizer';
import { PipelineMap } from '../components/PipelineMap';
import { SimulationController } from '../components/SimulationController';
import { ValveModal } from '../components/ValveModal';
import { IncidentModal } from '../components/IncidentModal';
import { getDashboardOverview, getIncidents, getTanks, getPipelines } from '../services/api';
import { DashboardOverview, Pipeline, WaterTank, LeakageIncident } from '../types';
import { useTelemetry } from '../context/TelemetryContext';

interface DashboardProps {
  onNavigateTab: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigateTab }) => {
  const { telemetry } = useTelemetry();
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [tanks, setTanks] = useState<WaterTank[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [incidents, setIncidents] = useState<LeakageIncident[]>([]);
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<LeakageIncident | null>(null);

  const fetchData = async () => {
    try {
      const [ovRes, tRes, pRes, incRes] = await Promise.all([
        getDashboardOverview(),
        getTanks(),
        getPipelines(),
        getIncidents('detected'),
      ]);
      setOverview(ovRes.data);
      setTanks(tRes.data);
      setPipelines(pRes.data);
      setIncidents(incRes.data);
    } catch (err) {
      console.warn('Dashboard fetch error', err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  // Prefer live WebSocket telemetry values when available
  const activePipelines = telemetry?.pipelines || pipelines;
  const activeTanks = telemetry?.tanks || tanks;
  const currentTotalFlow = telemetry?.total_system_flow_lpm ?? overview?.current_total_flow_lpm ?? 138.5;
  const currentAvgPressure = telemetry?.average_pressure_bar ?? overview?.average_pipeline_pressure_bar ?? 3.42;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-navy-800 via-navy-800 to-navy-900 border border-navy-700/80 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
            <span className="text-xs font-mono font-bold uppercase text-cyan-400 tracking-wider">
              GreenHeights Eco-Smart Community
            </span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1">Smart Water Infrastructure Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Continuous hydraulic monitoring, AI/ML-driven anomaly detection, and automated isolation protecting 24 households across 4 residential towers.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => onNavigateTab('leakage')}
            className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-navy-900 font-bold text-xs shadow-lg shadow-cyan-500/20 transition flex items-center space-x-2"
          >
            <span>Leakage Engine</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Overview Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          title="Water Supplied"
          value={overview?.total_water_supplied_litres?.toLocaleString() || '13,850'}
          unit="Litres"
          icon={Droplet}
          color="cyan"
          subtitle="Today's Total Supply"
          trend="+4.2%"
          trendPositive={true}
        />
        <MetricCard
          title="Water Consumed"
          value={overview?.total_water_consumed_litres?.toLocaleString() || '12,680'}
          unit="Litres"
          icon={Activity}
          color="blue"
          subtitle="Community Consumption"
          trend="Within Quota"
          trendPositive={true}
        />
        <MetricCard
          title="System Flow Rate"
          value={currentTotalFlow.toFixed(1)}
          unit="LPM"
          icon={Activity}
          color="green"
          subtitle="Active Transmission"
        />
        <MetricCard
          title="Avg Pressure"
          value={currentAvgPressure.toFixed(2)}
          unit="Bar"
          icon={Activity}
          color={currentAvgPressure < 2.0 ? 'red' : 'green'}
          subtitle="Nominal: 3.5 Bar"
        />
        <MetricCard
          title="Active Leaks"
          value={overview?.active_leakage_incidents_count ?? incidents.length}
          unit="Incidents"
          icon={AlertTriangle}
          color={overview?.critical_incidents_count ? 'red' : incidents.length > 0 ? 'amber' : 'green'}
          subtitle={overview?.critical_incidents_count ? 'CRITICAL LEAK ACTIVE' : 'Status: Monitored'}
          trend={overview?.critical_incidents_count ? 'Action Req.' : 'Nominal'}
          trendPositive={overview?.critical_incidents_count === 0}
        />
        <MetricCard
          title="Water Wastage"
          value={overview?.estimated_water_wastage_litres?.toFixed(0) || '240'}
          unit="Litres"
          icon={TrendingDown}
          color="amber"
          subtitle="Est. Loss Prevented"
        />
      </div>

      {/* Interactive IoT Simulation Controller Widget */}
      <SimulationController />

      {/* Pipeline Schematic Map */}
      <PipelineMap
        pipelines={activePipelines}
        onSelectPipeline={(p) => setSelectedPipeline(p)}
      />

      {/* Water Storage & Rooftop Tanks Overview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Droplet className="w-5 h-5 text-cyan-400" />
              <span>Storage Reservoirs & Overhead Tanks</span>
            </h3>
            <p className="text-xs text-slate-400">Ultrasonic JSN-SR04T real-time water depth measurements</p>
          </div>
          <button
            onClick={() => onNavigateTab('supply')}
            className="text-xs text-cyan-400 hover:underline flex items-center space-x-1"
          >
            <span>View All Tanks</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {activeTanks.slice(0, 5).map((tank) => (
            <TankVisualizer key={tank.id} tank={tank} />
          ))}
        </div>
      </div>

      {/* Active Incidents Banner / Feed if any exist */}
      {incidents.length > 0 && (
        <div className="bg-navy-800/90 rounded-2xl border border-rose-500/40 p-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-navy-700">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-rose-400 animate-bounce" />
              <h3 className="font-bold text-sm text-white">Active Suspected Leakage Incidents ({incidents.length})</h3>
            </div>
            <button
              onClick={() => onNavigateTab('leakage')}
              className="text-xs text-cyan-400 hover:underline"
            >
              Open Incident Management
            </button>
          </div>

          <div className="mt-3 space-y-2">
            {incidents.map((inc) => (
              <div
                key={inc.id}
                onClick={() => setSelectedIncident(inc)}
                className="p-3 rounded-xl bg-navy-900 border border-navy-700 hover:border-cyan-500/50 cursor-pointer flex items-center justify-between transition"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white text-xs">Incident #{inc.id} - {inc.pipeline_name}</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                      inc.severity === 'critical'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {inc.severity}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1">{inc.detection_reason}</p>
                </div>

                <div className="text-right text-xs font-mono">
                  <span className="text-slate-400 block text-[10px]">FLOW / PRESSURE</span>
                  <span className="text-white font-bold">{inc.flow_rate} LPM / {inc.pressure_reading} Bar</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {selectedPipeline && (
        <ValveModal
          pipeline={selectedPipeline}
          onClose={() => setSelectedPipeline(null)}
          onSuccess={fetchData}
        />
      )}

      {selectedIncident && (
        <IncidentModal
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
};
