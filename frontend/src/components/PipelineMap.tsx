import React from 'react';
import { Pipeline } from '../types';
import { Activity, Gauge, Lock, Unlock, AlertCircle } from 'lucide-react';

interface PipelineMapProps {
  pipelines: Pipeline[];
  onSelectPipeline?: (pipeline: Pipeline) => void;
}

export const PipelineMap: React.FC<PipelineMapProps> = ({ pipelines, onSelectPipeline }) => {
  return (
    <div className="bg-navy-800/90 rounded-2xl border border-navy-700/80 p-6 shadow-xl backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-navy-700 gap-2">
        <div>
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <span>Community Pipeline Schematic Network</span>
          </h3>
          <p className="text-xs text-slate-400">Live hydraulic telemetry across transmission headers and building risers</p>
        </div>
        <div className="flex items-center space-x-4 text-xs font-mono">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span className="text-slate-300">Normal</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span className="text-slate-300">Warning</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
            <span className="text-slate-300">Burst / Isolated</span>
          </div>
        </div>
      </div>

      {/* Network Grid Display */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pipelines.map((pipe) => {
          const isClosed = pipe.valve_status === 'closed' || pipe.is_isolated;
          const isCritical = !isClosed && (pipe.current_pressure_bar < 1.8 || pipe.current_flow_lpm > pipe.normal_flow_lpm * 1.5);
          const isWarning = !isClosed && !isCritical && (pipe.current_pressure_bar < 2.6);

          const statusColor = isClosed
            ? 'border-rose-500/60 bg-rose-950/20'
            : isCritical
            ? 'border-rose-500 bg-rose-950/40 animate-pulse'
            : isWarning
            ? 'border-amber-500/50 bg-amber-950/20'
            : 'border-navy-700 bg-navy-900/60 hover:border-cyan-500/40';

          return (
            <div
              key={pipe.id}
              onClick={() => onSelectPipeline && onSelectPipeline(pipe)}
              className={`p-4 rounded-xl border ${statusColor} cursor-pointer transition-all duration-200 hover:scale-[1.01] flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-navy-800 text-cyan-300 border border-navy-700">
                    {pipe.code}
                  </span>
                  <div className="flex items-center space-x-1 text-xs font-mono">
                    {isClosed ? (
                      <span className="flex items-center space-x-1 text-rose-400 font-bold">
                        <Lock className="w-3.5 h-3.5" />
                        <span>ISOLATED</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-1 text-emerald-400">
                        <Unlock className="w-3.5 h-3.5" />
                        <span>OPEN</span>
                      </span>
                    )}
                  </div>
                </div>

                <h4 className="mt-2 font-bold text-sm text-white truncate" title={pipe.name}>
                  {pipe.name}
                </h4>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  {pipe.material} | Ø {pipe.diameter_mm}mm
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-navy-700/60 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-mono">FLOW RATE</span>
                  <div className="flex items-baseline space-x-1">
                    <span className={`font-mono font-bold text-base ${isClosed ? 'text-slate-500' : 'text-white'}`}>
                      {pipe.current_flow_lpm.toFixed(1)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">LPM</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block font-mono">PRESSURE</span>
                  <div className="flex items-baseline space-x-1">
                    <span className={`font-mono font-bold text-base ${
                      isClosed ? 'text-slate-500' : isCritical ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-cyan-300'
                    }`}>
                      {pipe.current_pressure_bar.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Bar</span>
                  </div>
                </div>
              </div>

              {isCritical && (
                <div className="mt-2 text-[10px] font-mono text-rose-400 flex items-center space-x-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>Abnormal Hydraulic Anomaly</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
