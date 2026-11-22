import React, { useState } from 'react';
import { Settings, Cpu, ShieldCheck, Wifi, Sliders, BellRing, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const SettingsPage: React.FC = () => {
  const { user, role } = useAuth();
  const [saved, setSaved] = useState(false);

  // Settings form states
  const [pressureDropThresh, setPressureDropThresh] = useState('0.85');
  const [flowDiscrepancyPct, setFlowDiscrepancyPct] = useState('12.0');
  const [persistenceTicks, setPersistenceTicks] = useState('3');
  const [autoIsolationEnabled, setAutoIsolationEnabled] = useState(true);
  const [mqttBroker, setMqttBroker] = useState('mqtt://broker.smartwater.net:1883');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="pb-2">
        <h2 className="text-xl font-black text-white flex items-center space-x-2">
          <Settings className="w-6 h-6 text-cyan-400" />
          <span>System Settings & IoT Node Calibration</span>
        </h2>
        <p className="text-xs text-slate-400">
          Configure detection persistence parameters, automated isolation thresholds, and hardware broker integration.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* User Profile Card */}
        <div className="bg-navy-800/90 rounded-2xl border border-navy-700 p-5 shadow-xl">
          <h3 className="font-bold text-sm text-white flex items-center space-x-2 mb-4">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <span>Active Session & Access Permissions</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            <div className="bg-navy-900 p-3.5 rounded-xl border border-navy-700">
              <span className="text-slate-400 block text-[10px]">LOGGED IN AS</span>
              <span className="font-bold text-white text-sm">{user?.full_name || 'Administrator'}</span>
            </div>
            <div className="bg-navy-900 p-3.5 rounded-xl border border-navy-700">
              <span className="text-slate-400 block text-[10px]">ROLE-BASED ACCESS</span>
              <span className="font-bold text-cyan-400 uppercase">{role || 'Admin'} Level</span>
            </div>
            <div className="bg-navy-900 p-3.5 rounded-xl border border-navy-700">
              <span className="text-slate-400 block text-[10px]">EMAIL / CONTACT</span>
              <span className="text-slate-300">{user?.email || 'admin@greenheights.smart'}</span>
            </div>
          </div>
        </div>

        {/* Leakage Detection Engine Configuration */}
        <div className="bg-navy-800/90 rounded-2xl border border-navy-700 p-5 shadow-xl space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <span>Intelligent Detection Engine Parameters</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-slate-300 block mb-1">Pressure Drop Threshold (Bar)</label>
              <input
                type="number"
                step="0.05"
                value={pressureDropThresh}
                onChange={(e) => setPressureDropThresh(e.target.value)}
                className="w-full bg-navy-900 border border-navy-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Default: 0.85 Bar drop vs nominal</span>
            </div>

            <div>
              <label className="text-slate-300 block mb-1">Mass-Balance Discrepancy (%)</label>
              <input
                type="number"
                step="0.5"
                value={flowDiscrepancyPct}
                onChange={(e) => setFlowDiscrepancyPct(e.target.value)}
                className="w-full bg-navy-900 border border-navy-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Trigger threshold for unaccounted flow</span>
            </div>

            <div>
              <label className="text-slate-300 block mb-1">Temporal Persistence (Ticks)</label>
              <input
                type="number"
                value={persistenceTicks}
                onChange={(e) => setPersistenceTicks(e.target.value)}
                className="w-full bg-navy-900 border border-navy-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Consecutive abnormal readings to confirm leak</span>
            </div>
          </div>

          <div className="pt-3 border-t border-navy-700 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">Automated Branch Valve Isolation</span>
              <p className="text-[11px] text-slate-400">
                Immediately isolates building riser pipelines when a Critical Pipe Burst incident is confirmed.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoIsolationEnabled}
                onChange={(e) => setAutoIsolationEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-navy-900 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
            </label>
          </div>
        </div>

        {/* IoT Gateway & MQTT Settings */}
        <div className="bg-navy-800/90 rounded-2xl border border-navy-700 p-5 shadow-xl space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center space-x-2">
            <Wifi className="w-5 h-5 text-cyan-400" />
            <span>IoT Gateway & Telemetry Transport</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-300 block mb-1">MQTT / HTTP Telemetry Ingest URI</label>
              <input
                type="text"
                value={mqttBroker}
                onChange={(e) => setMqttBroker(e.target.value)}
                className="w-full bg-navy-900 border border-navy-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1">YF-S201 Flow Sensor Calibration Constant ($K$)</label>
              <input
                type="text"
                defaultValue="7.5 Hz per LPM (450 Pulses/Liter)"
                disabled
                className="w-full bg-navy-900 border border-navy-700 rounded-xl px-3 py-2 text-slate-400 font-mono"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          {saved && (
            <span className="text-xs text-emerald-400 font-bold font-mono">
              ✓ Settings successfully saved to system state!
            </span>
          )}
          <div className="ml-auto">
            <button
              type="submit"
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-navy-900 font-bold text-xs shadow-lg shadow-cyan-500/20 transition"
            >
              <Save className="w-4 h-4" />
              <span>Save Configuration</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
