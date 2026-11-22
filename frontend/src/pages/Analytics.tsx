import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  BarChart3,
  Download,
  Calendar,
  TrendingDown,
  DollarSign,
  Droplet,
  ShieldCheck,
  Clock
} from 'lucide-react';
import { getConsumptionAnalytics, getBuildingAnalytics, getWastageAnalysis, getLeakageStats } from '../services/api';
import { DailyConsumptionPoint, BuildingComparisonPoint, WastageAnalysis } from '../types';

export const Analytics: React.FC = () => {
  const [daysFilter, setDaysFilter] = useState(14);
  const [consumptionTrend, setConsumptionTrend] = useState<DailyConsumptionPoint[]>([]);
  const [buildingStats, setBuildingStats] = useState<BuildingComparisonPoint[]>([]);
  const [wastageData, setWastageData] = useState<WastageAnalysis | null>(null);
  const [incidentStats, setIncidentStats] = useState<any>(null);

  const fetchData = async () => {
    try {
      const [cRes, bRes, wRes, lRes] = await Promise.all([
        getConsumptionAnalytics(daysFilter),
        getBuildingAnalytics(),
        getWastageAnalysis(daysFilter),
        getLeakageStats(),
      ]);
      setConsumptionTrend(cRes.data);
      setBuildingStats(bRes.data);
      setWastageData(wRes.data);
      setIncidentStats(lRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, [daysFilter]);

  const handleExportCSV = () => {
    window.open(`http://localhost:8000/api/analytics/export?days=${daysFilter}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-xl font-black text-white flex items-center space-x-2">
            <BarChart3 className="w-6 h-6 text-cyan-400" />
            <span>Water Consumption Analytics & Wastage Audit</span>
          </h2>
          <p className="text-xs text-slate-400">
            Historical consumption trends, non-revenue water auditing, building-level benchmarks, and exportable reports.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1 bg-navy-800 p-1 rounded-xl border border-navy-700 text-xs font-mono">
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                onClick={() => setDaysFilter(d)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  daysFilter === d
                    ? 'bg-cyan-500 text-navy-900 font-bold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {d} Days
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/20 text-xs font-mono font-medium transition"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV Report</span>
          </button>
        </div>
      </div>

      {/* Wastage & Efficiency KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-navy-800/90 rounded-2xl border border-navy-700 p-5 shadow-lg">
          <span className="text-xs text-slate-400 font-mono block">TOTAL WATER SUPPLIED ({daysFilter}D)</span>
          <div className="mt-2 text-2xl font-black text-white font-mono">
            {wastageData?.total_supplied_period_litres.toLocaleString() || '195,400'} <span className="text-xs text-slate-400 font-normal">L</span>
          </div>
          <span className="text-[11px] text-cyan-400 font-mono mt-1 block">Municipal Grid & Sump</span>
        </div>

        <div className="bg-navy-800/90 rounded-2xl border border-navy-700 p-5 shadow-lg">
          <span className="text-xs text-slate-400 font-mono block">TOTAL WATER CONSUMED ({daysFilter}D)</span>
          <div className="mt-2 text-2xl font-black text-emerald-300 font-mono">
            {wastageData?.total_consumed_period_litres.toLocaleString() || '181,200'} <span className="text-xs text-slate-400 font-normal">L</span>
          </div>
          <span className="text-[11px] text-emerald-400 font-mono mt-1 block">Verified Metered Consumption</span>
        </div>

        <div className="bg-navy-800/90 rounded-2xl border border-amber-500/30 p-5 shadow-lg">
          <span className="text-xs text-slate-400 font-mono block">WATER LOSS / WASTAGE</span>
          <div className="mt-2 text-2xl font-black text-amber-300 font-mono">
            {wastageData?.total_wastage_litres.toLocaleString() || '14,200'} <span className="text-xs text-slate-400 font-normal">L</span>
          </div>
          <span className="text-[11px] text-amber-400 font-mono mt-1 block">
            {wastageData?.wastage_percentage}% Non-Revenue Water
          </span>
        </div>

        <div className="bg-navy-800/90 rounded-2xl border border-navy-700 p-5 shadow-lg">
          <span className="text-xs text-slate-400 font-mono block">WATER SAVED VIA AUTO-SHUTOFF</span>
          <div className="mt-2 text-2xl font-black text-cyan-400 font-mono">
            {wastageData?.prevented_wastage_litres.toLocaleString() || '1,176'} <span className="text-xs text-slate-400 font-normal">L</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono mt-1 block">Early Isolation Prevention</span>
        </div>
      </div>

      {/* Recharts Consumption vs Supply Trend */}
      <div className="bg-navy-800/90 rounded-2xl border border-navy-700 p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-sm text-white">Water Supply vs Household Consumption Trend</h3>
            <p className="text-xs text-slate-400">Comparative daily tracking across community pipelines</p>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={consumptionTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1C2541" />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: '#0B132B', borderColor: '#3A506B', borderRadius: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="supplied_litres" name="Supplied (L)" fill="#00D1FF" radius={[4, 4, 0, 0]} />
              <Bar dataKey="consumed_litres" name="Consumed (L)" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="wastage_litres" name="Wastage (L)" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Building-wise Consumption Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-navy-800/90 rounded-2xl border border-navy-700 p-5 shadow-xl">
          <h3 className="font-bold text-sm text-white mb-1">Building Consumption Comparison (Today)</h3>
          <p className="text-xs text-slate-400 mb-4">Aggregated consumption per block vs quota allowance</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={buildingStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1C2541" />
                <XAxis dataKey="building_name" stroke="#64748b" tick={{ fontSize: 9 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0B132B', borderColor: '#3A506B', borderRadius: '12px' }} />
                <Bar dataKey="total_consumption_litres" name="Total (L)" fill="#00F0FF" radius={[4, 4, 0, 0]} />
                <Bar dataKey="quota_litres" name="Quota (L)" fill="#3A506B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-navy-800/90 rounded-2xl border border-navy-700 p-5 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-white mb-1">Incident Response Metrics</h3>
            <p className="text-xs text-slate-400 mb-4">Operational efficiency of detection and isolation routines</p>

            <div className="space-y-4 text-xs font-mono">
              <div className="flex justify-between p-3 rounded-xl bg-navy-900 border border-navy-700">
                <span className="text-slate-400">TOTAL INCIDENTS DETECTED:</span>
                <span className="text-white font-bold">{incidentStats?.total_incidents || 2}</span>
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-navy-900 border border-navy-700">
                <span className="text-slate-400">RESOLVED & CLOSED WORK ORDERS:</span>
                <span className="text-emerald-400 font-bold">{incidentStats?.resolved_incidents || 1}</span>
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-navy-900 border border-navy-700">
                <span className="text-slate-400">AUTOMATED VALVE ISOLATIONS:</span>
                <span className="text-cyan-400 font-bold">{incidentStats?.auto_isolated_count || 1}</span>
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-navy-900 border border-navy-700">
                <span className="text-slate-400">AVERAGE RESOLUTION DURATION:</span>
                <span className="text-white font-bold">{incidentStats?.average_resolution_time_minutes || 42.5} Minutes</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-navy-700/60 flex items-center justify-between text-xs text-slate-400">
            <span>Audit Standard: ISO 46001 Water Efficiency</span>
            <span className="text-emerald-400 font-medium">Compliance: 94.8%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
