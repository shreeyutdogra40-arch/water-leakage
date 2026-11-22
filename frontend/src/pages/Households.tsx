import React, { useState, useEffect } from 'react';
import { Home, Search, AlertCircle, CheckCircle2, User, Phone, Gauge, ArrowUpRight } from 'lucide-react';
import { getHouseholds, getMyConsumption, getBuildings } from '../services/api';
import { HouseholdSummary, BuildingSummary } from '../types';
import { useAuth } from '../context/AuthContext';

export const Households: React.FC = () => {
  const { role } = useAuth();
  const [households, setHouseholds] = useState<HouseholdSummary[]>([]);
  const [buildings, setBuildings] = useState<BuildingSummary[]>([]);
  const [myConsumption, setMyConsumption] = useState<any>(null);
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    try {
      const [hRes, bRes, myRes] = await Promise.all([
        getHouseholds(selectedBuildingId),
        getBuildings(),
        getMyConsumption(),
      ]);
      setHouseholds(hRes.data);
      setBuildings(bRes.data);
      setMyConsumption(myRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedBuildingId]);

  const filtered = households.filter((h) => {
    const text = `${h.unit_number} ${h.resident_name} ${h.meter_id} ${h.building_name}`.toLowerCase();
    return text.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-xl font-black text-white flex items-center space-x-2">
            <Home className="w-6 h-6 text-cyan-400" />
            <span>Household Water Meters & Resident Consumption</span>
          </h2>
          <p className="text-xs text-slate-400">
            Smart sub-metering, daily quota tracking, and abnormal continuous consumption identification.
          </p>
        </div>
      </div>

      {/* Resident Personal View Banner (Highlighted if role === 'resident') */}
      {myConsumption && (
        <div className={`rounded-2xl border p-5 shadow-xl transition-all ${
          role === 'resident'
            ? 'bg-gradient-to-r from-cyan-950/60 to-navy-800 border-cyan-500/50 ring-2 ring-cyan-500/20'
            : 'bg-navy-800/80 border-navy-700'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-navy-700/60">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold">
                {myConsumption.unit_number || 'A-101'}
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold">
                  {role === 'resident' ? 'YOUR PERSONAL APARTMENT METER' : 'DEMO RESIDENT ACCOUNT'}
                </span>
                <h3 className="font-bold text-sm text-white">
                  {myConsumption.resident_name} — {myConsumption.unit_number} ({myConsumption.building_name})
                </h3>
              </div>
            </div>
            <span className="text-xs font-mono text-slate-400">Meter: {myConsumption.meter_id}</span>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            <div className="bg-navy-900/60 p-3.5 rounded-xl border border-navy-700">
              <span className="text-slate-400 text-[10px] block">TODAY'S USAGE</span>
              <span className="text-xl font-black text-white">{myConsumption.today_usage_litres} <span className="text-xs text-slate-400 font-normal">Litres</span></span>
            </div>

            <div className="bg-navy-900/60 p-3.5 rounded-xl border border-navy-700">
              <span className="text-slate-400 text-[10px] block">DAILY QUOTA ALLOCATION</span>
              <span className="text-xl font-black text-cyan-300">{myConsumption.daily_quota_litres} <span className="text-xs text-slate-400 font-normal">Litres</span></span>
            </div>

            <div className="bg-navy-900/60 p-3.5 rounded-xl border border-navy-700">
              <span className="text-slate-400 text-[10px] block">QUOTA CONSUMPTION</span>
              <div className="flex items-center space-x-2 mt-1">
                <div className="w-full bg-navy-800 rounded-full h-2.5 overflow-hidden border border-navy-700">
                  <div
                    className={`h-full rounded-full ${myConsumption.quota_percentage > 90 ? 'bg-rose-500' : 'bg-cyan-400'}`}
                    style={{ width: `${Math.min(100, myConsumption.quota_percentage)}%` }}
                  ></div>
                </div>
                <span className="text-white font-bold">{myConsumption.quota_percentage}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter & Search */}
      <div className="bg-navy-800/90 rounded-2xl border border-navy-700 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by unit number (e.g. A-101), resident name or meter..."
            className="w-full bg-navy-900 border border-navy-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <select
          value={selectedBuildingId || ''}
          onChange={(e) => setSelectedBuildingId(e.target.value ? Number(e.target.value) : undefined)}
          className="bg-navy-900 border border-navy-700 rounded-xl text-xs text-slate-200 px-3 py-2 font-mono focus:outline-none focus:border-cyan-500"
        >
          <option value="">All Towers & Blocks</option>
          {buildings.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name} ({b.block_code})
            </option>
          ))}
        </select>
      </div>

      {/* Households Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((hh) => {
          const isOver = hh.quota_usage_percentage > 100;
          return (
            <div
              key={hh.id}
              className={`p-4 rounded-2xl border ${
                hh.has_anomaly
                  ? 'border-rose-500/50 bg-rose-950/20'
                  : 'border-navy-700 bg-navy-800/90'
              } shadow-lg transition hover:border-cyan-500/40`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-navy-700/60">
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-sm text-white">{hh.unit_number}</span>
                  <span className="text-[10px] font-mono text-slate-400">({hh.building_name})</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-navy-900 text-cyan-300 border border-navy-700">
                  {hh.meter_id}
                </span>
              </div>

              <div className="mt-3 space-y-1.5 text-xs">
                <div className="flex items-center space-x-2 text-slate-200">
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-medium">{hh.resident_name}</span>
                </div>
                {hh.contact_phone && (
                  <div className="flex items-center space-x-2 text-slate-400 text-[11px]">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{hh.contact_phone}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-navy-700/60 space-y-2 text-xs font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">TODAY'S USAGE:</span>
                  <span className="text-white font-bold">{hh.current_day_usage_litres} L / {hh.daily_quota_litres} L</span>
                </div>

                {/* Quota Progress Bar */}
                <div className="w-full bg-navy-900 rounded-full h-2 overflow-hidden border border-navy-700">
                  <div
                    className={`h-full rounded-full ${isOver ? 'bg-rose-500' : 'bg-cyan-400'}`}
                    style={{ width: `${Math.min(100, hh.quota_usage_percentage)}%` }}
                  ></div>
                </div>

                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">{hh.quota_usage_percentage}% of quota</span>
                  {isOver && <span className="text-rose-400 font-bold">EXCEEDED</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
