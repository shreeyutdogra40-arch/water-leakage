import React, { useState, useEffect } from 'react';
import { Droplet, Building2, Calendar, ShieldCheck, ArrowUpRight, TrendingUp } from 'lucide-react';
import { TankVisualizer } from '../components/TankVisualizer';
import { getTanks, getBuildings, getCommunityOverview } from '../services/api';
import { WaterTank, BuildingSummary } from '../types';
import { useTelemetry } from '../context/TelemetryContext';

export const CommunitySupply: React.FC = () => {
  const { telemetry } = useTelemetry();
  const [tanks, setTanks] = useState<WaterTank[]>([]);
  const [buildings, setBuildings] = useState<BuildingSummary[]>([]);
  const [community, setCommunity] = useState<any>(null);

  const fetchData = async () => {
    try {
      const [tRes, bRes, cRes] = await Promise.all([
        getTanks(),
        getBuildings(),
        getCommunityOverview(),
      ]);
      setTanks(tRes.data);
      setBuildings(bRes.data);
      setCommunity(cRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const activeTanks = telemetry?.tanks || tanks;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-xl font-black text-white flex items-center space-x-2">
            <Droplet className="w-6 h-6 text-cyan-400" />
            <span>Community Water Supply & Reservoir Infrastructure</span>
          </h2>
          <p className="text-xs text-slate-400">
            Automated water balancing between central underground reservoir and residential rooftop gravity tanks.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="bg-navy-800 border border-navy-700 px-3 py-1.5 rounded-xl">
            <span className="text-slate-400 block text-[10px]">TOTAL STORAGE</span>
            <span className="font-bold text-white">140,000 Litres</span>
          </div>
          <div className="bg-navy-800 border border-navy-700 px-3 py-1.5 rounded-xl">
            <span className="text-slate-400 block text-[10px]">DAILY BUDGET</span>
            <span className="font-bold text-cyan-400">24,000 Litres</span>
          </div>
        </div>
      </div>

      {/* Tanks Visualizer Grid */}
      <div>
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">
          Storage Reservoirs & Rooftop Overhead Tanks
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {activeTanks.map((tank) => (
            <TankVisualizer key={tank.id} tank={tank} />
          ))}
        </div>
      </div>

      {/* Building-Wise Consumption & Allocation */}
      <div className="bg-navy-800/90 rounded-2xl border border-navy-700 p-5 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-navy-700">
          <div>
            <h3 className="font-bold text-sm text-white flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-cyan-400" />
              <span>Building-Level Distribution & Daily Demand</span>
            </h3>
            <p className="text-xs text-slate-400">Comparison of water supplied and consumed per residential block</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {buildings.map((b) => {
            const hasLeak = b.active_leaks_count > 0;
            return (
              <div
                key={b.id}
                className={`p-4 rounded-xl border ${
                  hasLeak ? 'border-amber-500/50 bg-amber-950/20' : 'border-navy-700 bg-navy-900/60'
                } flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-navy-800 text-cyan-300 border border-navy-700">
                      {b.block_code}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      {b.total_households} Households
                    </span>
                  </div>

                  <h4 className="mt-2 font-bold text-sm text-white">{b.name}</h4>
                  <p className="text-xs text-slate-400 mt-1">Tank: {b.tank_name || 'Shared'}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-navy-700/60 space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">TODAY'S USAGE:</span>
                    <span className="text-white font-bold">{b.today_consumption_litres} L</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">ACTIVE FLOW:</span>
                    <span className="text-cyan-400 font-bold">{b.current_flow_lpm} LPM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">TANK LEVEL:</span>
                    <span className="text-emerald-400 font-bold">{b.tank_level_pct?.toFixed(0) || '80'}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Water Supply Schedule & Sources */}
      <div className="bg-navy-800/90 rounded-2xl border border-navy-700 p-5 shadow-xl">
        <h3 className="font-bold text-sm text-white flex items-center space-x-2 mb-3">
          <Calendar className="w-5 h-5 text-cyan-400" />
          <span>Supply Schedule & Sourcing Protocol</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-navy-900 border border-navy-700 space-y-2">
            <span className="font-bold text-white block">Morning Supply Cycle (05:00 - 09:00)</span>
            <p className="text-slate-400 leading-relaxed">
              Municipal grid transmission pumps 14,000 Litres into Central Reservoir. Overhead tanks automated top-up activated.
            </p>
            <span className="inline-block text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded">
              COMPLETED TODAY
            </span>
          </div>

          <div className="p-4 rounded-xl bg-navy-900 border border-navy-700 space-y-2">
            <span className="font-bold text-white block">Evening Peak Cycle (17:30 - 21:30)</span>
            <p className="text-slate-400 leading-relaxed">
              Gravity discharge from rooftop tanks to all towers. Secondary boost pump standby on automated pressure drop trigger.
            </p>
            <span className="inline-block text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded">
              READY / SCHEDULED
            </span>
          </div>

          <div className="p-4 rounded-xl bg-navy-900 border border-navy-700 space-y-2">
            <span className="font-bold text-white block">Zero-Hour Night Audit (01:00 - 05:00)</span>
            <p className="text-slate-400 leading-relaxed">
              Minimum night flow threshold audit. Any continuous consumption &gt; 8 LPM flagged automatically as suspected pipeline fracture.
            </p>
            <span className="inline-block text-[10px] font-mono text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded">
              ACTIVE GUARDIAN
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
