import React, { useState, useEffect } from 'react';
import {
  SlidersHorizontal,
  Lock,
  Unlock,
  ShieldAlert,
  AlertTriangle,
  History,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import { getPipelines, getValveActionsLog } from '../services/api';
import { Pipeline, ValveActionRecord } from '../types';
import { ValveModal } from '../components/ValveModal';
import { useTelemetry } from '../context/TelemetryContext';

export const ValveControls: React.FC = () => {
  const { telemetry } = useTelemetry();
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [actionsLog, setActionsLog] = useState<ValveActionRecord[]>([]);
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);

  const fetchData = async () => {
    try {
      const [pRes, aRes] = await Promise.all([
        getPipelines(),
        getValveActionsLog(25),
      ]);
      setPipelines(pRes.data);
      setActionsLog(aRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  const activePipelines = telemetry?.pipelines || pipelines;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-xl font-black text-white flex items-center space-x-2">
            <SlidersHorizontal className="w-6 h-6 text-cyan-400" />
            <span>Solenoid Valve Actuation & Automated Isolation Controls</span>
          </h2>
          <p className="text-xs text-slate-400">
            Control motorized and solenoid valves across building risers. Automated isolation triggers on persistent critical leaks.
          </p>
        </div>
      </div>

      {/* Safety Policy Rule Box */}
      <div className="bg-navy-800/90 rounded-2xl border border-cyan-500/30 p-5 shadow-xl flex items-start space-x-4">
        <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 shrink-0">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div className="text-xs space-y-1">
          <h4 className="font-bold text-white text-sm">Automated Isolation Safety Guard & Interlock Policy</h4>
          <p className="text-slate-300 leading-relaxed">
            When a critical leak or burst pipe is confirmed across 3 consecutive telemetry readings, the system executes automatic isolation on the affected branch riser to eliminate flooding and structural damage.
          </p>
          <p className="text-amber-300 font-mono text-[11px] pt-1">
            ⚠️ Safety Rule 10: Central community arterial mains (TRUNK-MAIN-01) cannot be automatically closed by the background engine. Explicit administrator override is mandatory.
          </p>
        </div>
      </div>

      {/* Valves Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {activePipelines.map((pipe) => {
          const isClosed = pipe.valve_status === 'closed' || pipe.is_isolated;
          const isMain = !pipe.building_id && pipe.name.toLowerCase().includes('main');

          return (
            <div
              key={pipe.id}
              className={`p-5 rounded-2xl border ${
                isClosed
                  ? 'border-rose-500/60 bg-rose-950/20'
                  : 'border-navy-700 bg-navy-800/90 hover:border-cyan-500/40'
              } shadow-lg transition flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-navy-900 text-cyan-300 border border-navy-700">
                    {pipe.code}
                  </span>
                  <div className="flex items-center space-x-1 text-xs font-mono">
                    {isClosed ? (
                      <span className="text-rose-400 font-bold flex items-center space-x-1">
                        <Lock className="w-3.5 h-3.5" />
                        <span>ISOLATED</span>
                      </span>
                    ) : (
                      <span className="text-emerald-400 flex items-center space-x-1">
                        <Unlock className="w-3.5 h-3.5" />
                        <span>OPEN</span>
                      </span>
                    )}
                  </div>
                </div>

                <h4 className="mt-3 font-bold text-sm text-white">{pipe.name}</h4>
                <p className="text-xs text-slate-400 mt-1">{pipe.material}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-navy-700/60 space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">FLOW:</span>
                  <span className={`font-bold ${isClosed ? 'text-slate-500' : 'text-white'}`}>
                    {pipe.current_flow_lpm.toFixed(1)} LPM
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">PRESSURE:</span>
                  <span className={`font-bold ${isClosed ? 'text-slate-500' : 'text-cyan-400'}`}>
                    {pipe.current_pressure_bar.toFixed(2)} Bar
                  </span>
                </div>

                <button
                  onClick={() => setSelectedPipeline(pipe)}
                  className={`w-full mt-2 py-2 rounded-xl text-xs font-bold font-mono transition ${
                    isClosed
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
                      : 'bg-navy-900 border border-navy-700 hover:border-rose-500 text-slate-300 hover:text-white'
                  }`}
                >
                  {isClosed ? 'Open Valve' : 'Actuate / Shutoff'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Valve Actions Audit Trail */}
      <div className="bg-navy-800/90 rounded-2xl border border-navy-700 p-5 shadow-xl">
        <div className="flex items-center space-x-2 pb-3 border-b border-navy-700">
          <History className="w-5 h-5 text-cyan-400" />
          <h3 className="font-bold text-sm text-white">Valve Actuation Audit Trail & Isolation Log</h3>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="text-[11px] uppercase bg-navy-900 text-slate-400">
              <tr>
                <th className="py-2.5 px-3 rounded-l-lg">Timestamp</th>
                <th className="py-2.5 px-3">Pipeline</th>
                <th className="py-2.5 px-3">Action Type</th>
                <th className="py-2.5 px-3">Triggered By</th>
                <th className="py-2.5 px-3">Transition</th>
                <th className="py-2.5 px-3 rounded-r-lg">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-700/60">
              {actionsLog.map((a) => (
                <tr key={a.id} className="hover:bg-navy-700/40 transition">
                  <td className="py-3 px-3 text-slate-400">{new Date(a.timestamp).toLocaleString()}</td>
                  <td className="py-3 px-3 font-bold text-white font-sans">{a.pipeline_name || `Pipe #${a.pipeline_id}`}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      a.action_type === 'auto_isolation'
                        ? 'bg-rose-950 text-rose-400 border border-rose-500/30'
                        : 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                    }`}>
                      {a.action_type.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-cyan-400">{a.triggered_by_name || 'System Auto-Guard'}</td>
                  <td className="py-3 px-3 text-slate-300">
                    {a.previous_status} &rarr; <span className="font-bold text-white">{a.new_status}</span>
                  </td>
                  <td className="py-3 px-3 text-slate-300 font-sans">{a.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedPipeline && (
        <ValveModal
          pipeline={selectedPipeline}
          onClose={() => setSelectedPipeline(null)}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
};
