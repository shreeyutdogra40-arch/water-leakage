import React, { useState } from 'react';
import { LeakageIncident } from '../types';
import { updateIncidentStatus } from '../services/api';
import { X, CheckCircle, Wrench, AlertTriangle, ShieldCheck } from 'lucide-react';

interface IncidentModalProps {
  incident: LeakageIncident;
  onClose: () => void;
  onSuccess: () => void;
}

export const IncidentModal: React.FC<IncidentModalProps> = ({ incident, onClose, onSuccess }) => {
  const [status, setStatus] = useState<string>(incident.status);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    setLoading(true);
    try {
      await updateIncidentStatus(incident.id, status, notes);
      onSuccess();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-navy-800 border border-navy-700 w-full max-w-lg rounded-2xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 pb-3 border-b border-navy-700">
          <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-white">Incident #{incident.id}</h3>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                incident.severity === 'critical'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                {incident.severity}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{incident.pipeline_name || incident.pipeline_code}</p>
          </div>
        </div>

        <div className="mt-4 space-y-4 text-xs">
          <div className="bg-navy-900 p-3.5 rounded-xl border border-navy-700 space-y-2">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-mono">Detection Reason & Confidence</span>
              <p className="text-slate-200 mt-0.5 font-medium">{incident.detection_reason}</p>
              <div className="mt-1 flex items-center space-x-2 text-[11px] text-cyan-400 font-mono">
                <span>Confidence: {(incident.confidence_score * 100).toFixed(0)}%</span>
                <span>• Flow: {incident.flow_rate} LPM</span>
                <span>• Pressure: {incident.pressure_reading} Bar</span>
              </div>
            </div>
            {incident.notes && (
              <div className="pt-2 border-t border-navy-800">
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Activity Log:</span>
                <p className="text-slate-300 whitespace-pre-line mt-1">{incident.notes}</p>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Update Incident Status</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {['acknowledged', 'assigned', 'resolved', 'closed'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatus(st)}
                  className={`py-2 rounded-xl text-xs font-medium capitalize border transition ${
                    status === st
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
                      : 'bg-navy-900 border-navy-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Maintenance Notes / Actions Taken</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Technician dispatched to inspect 50mm riser coupling. Leak confirmed and isolated."
              className="w-full bg-navy-900 border border-navy-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-navy-900 text-slate-300 hover:text-white text-xs border border-navy-700"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdate}
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-navy-900 font-bold text-xs shadow-lg shadow-cyan-500/20 transition"
            >
              {loading ? 'Saving...' : 'Update Incident'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
