import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Flame,
  CheckCircle2,
  Filter,
  BrainCircuit,
  Wrench,
  Search,
  Sparkles,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { getIncidents, runMLAnalysis } from '../services/api';
import { LeakageIncident, IncidentSeverity, IncidentStatus } from '../types';
import { IncidentModal } from '../components/IncidentModal';

export const LeakageDetection: React.FC = () => {
  const [incidents, setIncidents] = useState<LeakageIncident[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [selectedIncident, setSelectedIncident] = useState<LeakageIncident | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // ML Sandbox State
  const [mlCurveType, setMlCurveType] = useState<'normal' | 'constant_leak' | 'night_spike'>('normal');
  const [mlResult, setMlResult] = useState<any>(null);
  const [mlLoading, setMlLoading] = useState(false);

  const fetchIncidents = async () => {
    try {
      const resp = await getIncidents(statusFilter || undefined, severityFilter || undefined);
      setIncidents(resp.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [statusFilter, severityFilter]);

  const handleTestML = async () => {
    setMlLoading(true);
    let curve: number[] = [];
    if (mlCurveType === 'normal') {
      curve = [2.0, 1.5, 1.0, 1.0, 3.0, 8.0, 25.0, 35.0, 28.0, 15.0, 12.0, 14.0, 16.0, 14.0, 12.0, 11.0, 15.0, 22.0, 32.0, 30.0, 24.0, 16.0, 8.0, 4.0];
    } else if (mlCurveType === 'constant_leak') {
      curve = [42.0, 44.0, 45.0, 43.0, 44.0, 48.0, 52.0, 55.0, 50.0, 45.0, 46.0, 45.0, 44.0, 45.0, 44.0, 45.0, 48.0, 50.0, 54.0, 52.0, 48.0, 45.0, 43.0, 42.0];
    } else {
      curve = [2.0, 38.0, 45.0, 40.0, 3.0, 8.0, 25.0, 35.0, 28.0, 15.0, 12.0, 14.0, 16.0, 14.0, 12.0, 11.0, 15.0, 22.0, 32.0, 30.0, 24.0, 16.0, 8.0, 4.0];
    }

    try {
      const resp = await runMLAnalysis(curve);
      setMlResult(resp.data);
    } catch (e) {
      console.error(e);
    } finally {
      setMlLoading(false);
    }
  };

  const filteredIncidents = incidents.filter((i) => {
    const text = `${i.pipeline_name} ${i.pipeline_code} ${i.detection_reason} ${i.building_name}`.toLowerCase();
    return text.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-xl font-black text-white flex items-center space-x-2">
            <AlertTriangle className="w-6 h-6 text-cyan-400" />
            <span>Intelligent Multi-Parameter Leakage Detection Engine</span>
          </h2>
          <p className="text-xs text-slate-400">
            Rule-based persistence thresholds, mass-balance hydraulic discrepancy analysis, and Scikit-Learn Isolation Forest machine learning.
          </p>
        </div>
      </div>

      {/* Detection Rules Architecture Card */}
      <div className="bg-navy-800/90 rounded-2xl border border-navy-700 p-5 shadow-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="p-3.5 rounded-xl bg-navy-900 border border-navy-700">
          <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold">Rule 1: Hydraulic Pressure Drop</span>
          <p className="text-slate-300 mt-1 font-medium">ΔP &gt; 0.85 Bar</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Sudden collapse in pipe pressure while active transfer is underway.</p>
        </div>

        <div className="p-3.5 rounded-xl bg-navy-900 border border-navy-700">
          <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold">Rule 2: Mass Balance Discrepancy</span>
          <p className="text-slate-300 mt-1 font-medium">Loss &gt; 12.0%</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Discrepancy between bulk supply line meter and the sum of household meters.</p>
        </div>

        <div className="p-3.5 rounded-xl bg-navy-900 border border-navy-700">
          <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold">Rule 3: Temporal Persistence</span>
          <p className="text-slate-300 mt-1 font-medium">3 Consecutive Ticks</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Rejects momentary water hammer spikes to eliminate false alarms.</p>
        </div>

        <div className="p-3.5 rounded-xl bg-navy-900 border border-cyan-500/30">
          <span className="text-[10px] font-mono text-cyan-300 uppercase font-bold flex items-center space-x-1">
            <BrainCircuit className="w-3.5 h-3.5" />
            <span>Rule 4: ML Isolation Forest</span>
          </span>
          <p className="text-slate-300 mt-1 font-medium">Contamination = 0.08</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Anomaly detection scoring comparing 24-hr profile against residential baseline.</p>
        </div>
      </div>

      {/* Machine Learning Model Testing Playground */}
      <div className="bg-navy-800/90 rounded-2xl border border-cyan-500/30 p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-navy-700">
          <div className="flex items-center space-x-2">
            <BrainCircuit className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-sm text-white">Machine Learning Anomaly Detection Diagnostic Sandbox</h3>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-900/40 text-cyan-300 border border-cyan-500/20">
            Scikit-Learn IsolationForest
          </span>
        </div>

        <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Select Usage Profile:</span>
            {[
              { id: 'normal', label: 'Normal Residential Diurnal Curve' },
              { id: 'constant_leak', label: 'Continuous Underground Leak (Flat 45 LPM)' },
              { id: 'night_spike', label: 'Night-Time Zero-Hour Pipe Burst' },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => {
                  setMlCurveType(opt.id as any);
                  setMlResult(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono transition ${
                  mlCurveType === opt.id
                    ? 'bg-cyan-500 text-navy-900 font-bold'
                    : 'bg-navy-900 border border-navy-700 text-slate-300 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleTestML}
            disabled={mlLoading}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-navy-900 font-bold text-xs shadow-lg shadow-cyan-500/20 transition shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>{mlLoading ? 'Evaluating...' : 'Run ML Analysis'}</span>
          </button>
        </div>

        {mlResult && (
          <div className={`mt-4 p-4 rounded-xl border text-xs ${
            mlResult.is_anomaly
              ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
              : 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm">{mlResult.verdict}</span>
              <span className="font-mono font-bold">Confidence: {(mlResult.confidence_score * 100).toFixed(1)}%</span>
            </div>
            <p className="mt-1 text-slate-300">{mlResult.description}</p>
          </div>
        )}
      </div>

      {/* Incidents Filter & Search Bar */}
      <div className="bg-navy-800/90 rounded-2xl border border-navy-700 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search incident by pipeline code, name, reason or block..."
            className="w-full bg-navy-900 border border-navy-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-navy-900 border border-navy-700 rounded-xl text-xs text-slate-200 px-3 py-2 font-mono focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-navy-900 border border-navy-700 rounded-xl text-xs text-slate-200 px-3 py-2 font-mono focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Statuses</option>
            <option value="detected">Detected</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="assigned">Assigned</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Incidents Cards / Table List */}
      <div className="space-y-3">
        {filteredIncidents.length === 0 ? (
          <div className="bg-navy-800/90 rounded-2xl border border-navy-700 p-12 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <h4 className="font-bold text-white text-sm">No Leakage Incidents Found</h4>
            <p className="text-xs text-slate-400 mt-1">All pipelines are operating within nominal pressure and flow parameters.</p>
          </div>
        ) : (
          filteredIncidents.map((inc) => {
            const isCritical = inc.severity === 'critical';
            const isResolved = inc.status === 'resolved' || inc.status === 'closed';

            return (
              <div
                key={inc.id}
                onClick={() => setSelectedIncident(inc)}
                className={`bg-navy-800/90 rounded-2xl border ${
                  isCritical ? 'border-rose-500/50 bg-rose-950/10' : 'border-navy-700'
                } p-5 shadow-lg hover:border-cyan-500/50 cursor-pointer transition-all duration-200`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-navy-700/60">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-xl ${
                      isCritical ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {isCritical ? <Flame className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-black text-sm text-white">Incident #{inc.id}</span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                          isCritical
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          {inc.severity}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-navy-900 text-slate-300 border border-navy-700 uppercase">
                          {inc.status}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs text-cyan-300 mt-0.5">
                        {inc.pipeline_name} ({inc.pipeline_code})
                      </h4>
                    </div>
                  </div>

                  <div className="text-right text-xs font-mono">
                    <span className="text-slate-400 text-[10px]">DETECTED AT</span>
                    <div className="text-white font-medium">{new Date(inc.detected_at).toLocaleString()}</div>
                  </div>
                </div>

                <div className="mt-3 text-xs text-slate-300">
                  <span className="text-slate-400 text-[11px] block font-mono">DETECTION REASON & EVIDENCE:</span>
                  <p className="mt-0.5 font-medium text-slate-200">{inc.detection_reason}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-navy-700/60 flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono text-slate-400 gap-2">
                  <div className="flex items-center space-x-4">
                    <span>Flow: <strong className="text-white">{inc.flow_rate} LPM</strong></span>
                    <span>Pressure: <strong className="text-white">{inc.pressure_reading} Bar</strong></span>
                    <span>Confidence: <strong className="text-cyan-400">{(inc.confidence_score * 100).toFixed(0)}%</strong></span>
                  </div>

                  <button className="flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 font-bold self-end sm:self-auto">
                    <span>Manage / Work Order</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {selectedIncident && (
        <IncidentModal
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
          onSuccess={fetchIncidents}
        />
      )}
    </div>
  );
};
