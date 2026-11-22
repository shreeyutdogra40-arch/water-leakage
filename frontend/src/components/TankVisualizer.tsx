import React from 'react';
import { WaterTank } from '../types';
import { Droplet, AlertTriangle, ArrowDown, ArrowUp } from 'lucide-react';

interface TankVisualizerProps {
  tank: WaterTank;
}

export const TankVisualizer: React.FC<TankVisualizerProps> = ({ tank }) => {
  const pct = Math.max(0, Math.min(100, tank.current_level_percentage));
  const isLow = pct <= tank.low_level_threshold_pct;
  const isMain = tank.tank_type === 'main_reservoir';

  return (
    <div className="bg-navy-800/90 rounded-2xl border border-navy-700/80 p-5 shadow-lg flex flex-col justify-between">
      <div className="flex items-center justify-between pb-3 border-b border-navy-700/50">
        <div>
          <h4 className="font-bold text-sm text-white flex items-center space-x-1.5">
            <Droplet className={`w-4 h-4 ${isMain ? 'text-cyan-400' : 'text-blue-400'}`} />
            <span>{tank.name}</span>
          </h4>
          <span className="text-[11px] font-mono text-slate-400 uppercase">
            {tank.tank_type.replace('_', ' ')}
          </span>
        </div>
        {tank.is_filling ? (
          <span className="flex items-center space-x-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30 animate-pulse">
            <ArrowUp className="w-3 h-3" />
            <span>FILLING</span>
          </span>
        ) : (
          <span className="flex items-center space-x-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-navy-900 text-slate-400 border border-navy-700">
            <ArrowDown className="w-3 h-3" />
            <span>ACTIVE DRAW</span>
          </span>
        )}
      </div>

      {/* Tank Tank Gauge Graphic */}
      <div className="my-5 flex items-center justify-center space-x-6">
        <div className="relative w-28 h-40 rounded-2xl border-2 border-navy-700 bg-navy-900/80 overflow-hidden shadow-inner flex flex-col justify-end">
          {/* Low Level Threshold Marker Line */}
          <div
            className="absolute w-full border-b border-dashed border-rose-500/70 z-20 flex items-center justify-end pr-1"
            style={{ bottom: `${tank.low_level_threshold_pct}%` }}
          >
            <span className="text-[8px] font-mono text-rose-400 font-bold bg-navy-900/80 px-1 rounded">
              LOW {tank.low_level_threshold_pct}%
            </span>
          </div>

          {/* Liquid Fill */}
          <div
            className={`w-full transition-all duration-700 ease-out relative ${
              isLow
                ? 'bg-gradient-to-t from-rose-600 to-rose-400'
                : 'bg-gradient-to-t from-blue-600 via-cyan-500 to-cyan-300'
            }`}
            style={{ height: `${pct}%` }}
          >
            {/* Wavy Surface Highlight */}
            <div className="w-full h-2 bg-white/30 rounded-t-full"></div>
          </div>

          {/* Center Percent Badge */}
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <div className="bg-navy-900/80 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-navy-700 text-center">
              <span className={`text-base font-black font-mono ${isLow ? 'text-rose-400' : 'text-white'}`}>
                {pct.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Numeric Details */}
        <div className="space-y-3 text-xs">
          <div>
            <span className="text-slate-400 text-[11px] block">Current Volume</span>
            <span className="font-mono font-bold text-white text-base">
              {tank.current_level_litres.toLocaleString()} <span className="text-xs text-slate-400 font-normal">L</span>
            </span>
          </div>

          <div>
            <span className="text-slate-400 text-[11px] block">Total Capacity</span>
            <span className="font-mono text-slate-300">
              {tank.capacity_litres.toLocaleString()} L
            </span>
          </div>

          <div>
            <span className="text-slate-400 text-[11px] block">Tank Height</span>
            <span className="font-mono text-slate-300">{tank.height_meters} Meters</span>
          </div>

          {isLow && (
            <div className="flex items-center space-x-1 text-rose-400 text-[11px] font-medium pt-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Below Threshold</span>
            </div>
          )}
        </div>
      </div>

      <div className="pt-2 border-t border-navy-700/50 flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <span>Height: {tank.height_meters}m</span>
        <span>Sensor: JSN-SR04T (Active)</span>
      </div>
    </div>
  );
};
