import React, { useState } from 'react';
import { Play, Pause, RotateCcw, AlertTriangle, Flame, Droplet, ArrowDown, Activity } from 'lucide-react';
import { injectSimulationAnomaly, resetSimulation, toggleSimulation } from '../services/api';
import { useTelemetry } from '../context/TelemetryContext';

export const SimulationController: React.FC = () => {
  const { telemetry, refreshSnapshot } = useTelemetry();
  const [loading, setLoading] = useState(false);
  const [selectedPipeId, setSelectedPipeId] = useState<number | undefined>(undefined);

  const handleInject = async (scenario: string) => {
    setLoading(true);
    try {
      await injectSimulationAnomaly(scenario, selectedPipeId);
      await refreshSnapshot();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    try {
      await resetSimulation();
      await refreshSnapshot();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    setLoading(true);
    try {
      await toggleSimulation();
      await refreshSnapshot();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-navy-800/90 rounded-2xl border border-cyan-500/30 p-5 shadow-2xl backdrop-blur-md">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-navy-700">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
            <h3 className="font-extrabold text-sm text-white uppercase tracking-wider">
              IoT Hardware & Hydraulic Simulator Control Panel
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Demonstrate real-time intelligent leakage detection and automated valve shutoffs without requiring physical test rigs.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {telemetry?.pipelines && (
            <select
              value={selectedPipeId || ''}
              onChange={(e) => setSelectedPipeId(e.target.value ? Number(e.target.value) : undefined)}
              className="bg-navy-900 border border-navy-700 rounded-lg text-xs text-slate-200 px-3 py-1.5 focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value="">Target: All / Auto-Select</option>
              {telemetry.pipelines.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} - {p.name}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={handleToggle}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-navy-900 border border-navy-700 hover:border-cyan-500 text-xs text-slate-300 font-mono transition"
          >
            <Play className="w-3.5 h-3.5 text-cyan-400" />
            <span>Cycle</span>
          </button>

          <button
            onClick={handleReset}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30 text-xs font-mono font-medium transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Normal</span>
          </button>
        </div>
      </div>

      {/* Scenario Buttons Grid */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => handleInject('pipe_burst')}
          disabled={loading}
          className="p-3 rounded-xl bg-gradient-to-br from-rose-950/60 to-rose-900/30 border border-rose-500/40 hover:border-rose-400 text-left transition hover:scale-[1.02]"
        >
          <div className="flex items-center justify-between text-rose-400 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase">Critical Leak</span>
            <Flame className="w-4 h-4" />
          </div>
          <div className="font-bold text-xs text-white">Pipe Burst</div>
          <p className="text-[10px] text-slate-400 mt-1 leading-tight">
            Surging flow + collapsed pressure. Triggers Auto-Isolation!
          </p>
        </button>

        <button
          onClick={() => handleInject('micro_leak')}
          disabled={loading}
          className="p-3 rounded-xl bg-gradient-to-br from-amber-950/60 to-amber-900/30 border border-amber-500/40 hover:border-amber-400 text-left transition hover:scale-[1.02]"
        >
          <div className="flex items-center justify-between text-amber-400 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase">Medium Leak</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="font-bold text-xs text-white">Micro-Fissure</div>
          <p className="text-[10px] text-slate-400 mt-1 leading-tight">
            Mass-balance discrepancy between supply & household meters.
          </p>
        </button>

        <button
          onClick={() => handleInject('pressure_drop')}
          disabled={loading}
          className="p-3 rounded-xl bg-gradient-to-br from-blue-950/60 to-blue-900/30 border border-blue-500/40 hover:border-blue-400 text-left transition hover:scale-[1.02]"
        >
          <div className="flex items-center justify-between text-blue-400 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase">Hydraulic Anomaly</span>
            <Activity className="w-4 h-4" />
          </div>
          <div className="font-bold text-xs text-white">Pressure Collapse</div>
          <p className="text-[10px] text-slate-400 mt-1 leading-tight">
            Drop in pressure without flow change (pump header failure).
          </p>
        </button>

        <button
          onClick={() => handleInject('tank_drain')}
          disabled={loading}
          className="p-3 rounded-xl bg-gradient-to-br from-indigo-950/60 to-indigo-900/30 border border-indigo-500/40 hover:border-indigo-400 text-left transition hover:scale-[1.02]"
        >
          <div className="flex items-center justify-between text-indigo-400 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase">Ultrasonic Alarm</span>
            <ArrowDown className="w-4 h-4" />
          </div>
          <div className="font-bold text-xs text-white">Tank Drain Event</div>
          <p className="text-[10px] text-slate-400 mt-1 leading-tight">
            Overhead tank plunges below 20% low threshold.
          </p>
        </button>
      </div>
    </div>
  );
};
