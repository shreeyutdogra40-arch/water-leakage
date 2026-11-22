import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { Activity, Gauge, Wifi, Battery, Clock, Cpu, RefreshCw, Lock, Unlock } from 'lucide-react';
import { PipelineMap } from '../components/PipelineMap';
import { ValveModal } from '../components/ValveModal';
import { getSensors, getSensorReadings, getPipelines } from '../services/api';
import { SensorDetail, SensorReading, Pipeline } from '../types';
import { useTelemetry } from '../context/TelemetryContext';

export const LiveMonitoring: React.FC = () => {
  const { telemetry } = useTelemetry();
  const [sensors, setSensors] = useState<SensorDetail[]>([]);
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
  const [flowHistory, setFlowHistory] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const [snsRes, rdRes, pRes] = await Promise.all([
        getSensors(),
        getSensorReadings(30),
        getPipelines(),
      ]);
      setSensors(snsRes.data);
      setReadings(rdRes.data);
      setPipelines(pRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  // Accumulate live telemetry ticks into chart buffer
  useEffect(() => {
    if (telemetry) {
      const point = {
        time: new Date().toLocaleTimeString(),
        flow: telemetry.total_system_flow_lpm,
        pressure: telemetry.average_pressure_bar,
        reservoir: telemetry.main_reservoir_pct,
      };
      setFlowHistory((prev) => [...prev.slice(-19), point]);
    }
  }, [telemetry]);

  const activePipelines = telemetry?.pipelines || pipelines;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-xl font-black text-white flex items-center space-x-2">
            <Activity className="w-6 h-6 text-cyan-400" />
            <span>High-Frequency Live IoT Telemetry Monitoring</span>
          </h2>
          <p className="text-xs text-slate-400">
            Real-time telemetry stream from ESP32 nodes, Hall-effect turbine flow meters, and piezoresistive pressure sensors.
          </p>
        </div>

        <button
          onClick={fetchData}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-navy-800 border border-navy-700 text-xs font-mono text-cyan-400 hover:border-cyan-500 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Hardware States</span>
        </button>
      </div>

      {/* Live Recharts Real-Time Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Flow Rate Graph */}
        <div className="bg-navy-800/90 rounded-2xl border border-navy-700 p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
                <span>Active Total System Flow Rate</span>
              </h3>
              <p className="text-xs text-slate-400">Aggregated volumetric transfer (Litres / Minute)</p>
            </div>
            <span className="text-lg font-mono font-black text-cyan-300">
              {telemetry?.total_system_flow_lpm?.toFixed(1) || '138.5'} <span className="text-xs font-normal text-slate-400">LPM</span>
            </span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={flowHistory.length > 2 ? flowHistory : [
                { time: '10:00:00', flow: 135 }, { time: '10:00:02', flow: 138 },
                { time: '10:00:04', flow: 136 }, { time: '10:00:06', flow: 140 },
                { time: '10:00:08', flow: 139 }, { time: '10:00:10', flow: 137 }
              ]}>
                <defs>
                  <linearGradient id="flowGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00F0FF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00F0FF" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1C2541" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                <Tooltip contentStyle={{ backgroundColor: '#0B132B', borderColor: '#3A506B', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="flow" stroke="#00F0FF" strokeWidth={2.5} fillOpacity={1} fill="url(#flowGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pipeline Pressure Graph */}
        <div className="bg-navy-800/90 rounded-2xl border border-navy-700 p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Average Pipeline Pressure</span>
              </h3>
              <p className="text-xs text-slate-400">Piezoresistive sensor readings (Bar / PSI)</p>
            </div>
            <span className="text-lg font-mono font-black text-emerald-300">
              {telemetry?.average_pressure_bar?.toFixed(2) || '3.42'} <span className="text-xs font-normal text-slate-400">Bar</span>
            </span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={flowHistory.length > 2 ? flowHistory : [
                { time: '10:00:00', pressure: 3.45 }, { time: '10:00:02', pressure: 3.42 },
                { time: '10:00:04', pressure: 3.48 }, { time: '10:00:06', pressure: 3.40 },
                { time: '10:00:08', pressure: 3.43 }, { time: '10:00:10', pressure: 3.44 }
              ]}>
                <defs>
                  <linearGradient id="pressGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1C2541" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={[0, 6]} />
                <Tooltip contentStyle={{ backgroundColor: '#0B132B', borderColor: '#3A506B', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="pressure" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#pressGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Schematic Pipeline Network Grid */}
      <PipelineMap
        pipelines={activePipelines}
        onSelectPipeline={(p) => setSelectedPipeline(p)}
      />

      {/* Sensor Hardware Health & Connectivity Table */}
      <div className="bg-navy-800/90 rounded-2xl border border-navy-700 p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-navy-700">
          <div>
            <h3 className="font-bold text-sm text-white flex items-center space-x-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              <span>IoT Sensor Nodes Connectivity & Hardware Status</span>
            </h3>
            <p className="text-xs text-slate-400">Microcontroller heartbeats, battery levels, and firmware models</p>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30">
            {sensors.filter(s => s.is_online).length} / {sensors.length} Online
          </span>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] font-mono uppercase bg-navy-900 text-slate-400">
              <tr>
                <th className="py-2.5 px-3 rounded-l-lg">Sensor Code</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Hardware Node</th>
                <th className="py-2.5 px-3">Connectivity</th>
                <th className="py-2.5 px-3 rounded-r-lg">Battery</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-700/60 font-mono">
              {sensors.map((s) => (
                <tr key={s.id} className="hover:bg-navy-700/40 transition">
                  <td className="py-3 px-3 font-bold text-cyan-300">{s.sensor_code}</td>
                  <td className="py-3 px-3 text-white font-sans">{s.name}</td>
                  <td className="py-3 px-3 uppercase text-slate-300">{s.sensor_type}</td>
                  <td className="py-3 px-3 text-slate-400">{s.hardware_model}</td>
                  <td className="py-3 px-3">
                    <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] ${
                      s.is_online
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-950 text-rose-400 border border-rose-500/30'
                    }`}>
                      <Wifi className="w-3 h-3" />
                      <span>{s.is_online ? 'ONLINE' : 'OFFLINE'}</span>
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="flex items-center space-x-1 text-slate-300">
                      <Battery className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{s.battery_level}%</span>
                    </span>
                  </td>
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
