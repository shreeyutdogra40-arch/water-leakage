import React, { useState } from 'react';
import { Pipeline } from '../types';
import { controlValve } from '../services/api';
import { X, Lock, Unlock, AlertTriangle, ShieldAlert } from 'lucide-react';

interface ValveModalProps {
  pipeline: Pipeline;
  onClose: () => void;
  onSuccess: () => void;
}

export const ValveModal: React.FC<ValveModalProps> = ({ pipeline, onClose, onSuccess }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMainLine = !pipeline.building_id && pipeline.name.toLowerCase().includes('main');
  const isClosed = pipeline.valve_status === 'closed' || pipeline.is_isolated;

  const handleAction = async (actionType: string) => {
    if (!reason.trim()) {
      setError('Please provide an operational reason for this valve command.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await controlValve(pipeline.id, actionType, reason);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Valve control command failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-navy-800 border border-navy-700 w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 pb-3 border-b border-navy-700">
          <div className={`p-2.5 rounded-xl ${isClosed ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
            {isClosed ? <Lock className="w-6 h-6" /> : <Unlock className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-base font-bold text-white">{pipeline.name}</h3>
            <span className="text-xs font-mono text-cyan-400">{pipeline.code}</span>
          </div>
        </div>

        {isMainLine && (
          <div className="mt-4 p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs flex items-start space-x-2">
            <ShieldAlert className="w-5 h-5 shrink-0 text-amber-400" />
            <div>
              <span className="font-bold">CRITICAL SAFETY GUARD ACTIVE:</span>
              <p className="mt-0.5 text-slate-300 leading-relaxed">
                This is a primary community arterial line. Automated shutoffs are blocked by policy. Manual administrator authorization is required.
              </p>
            </div>
          </div>
        )}

        <div className="mt-4 space-y-3">
          <div className="bg-navy-900 p-3 rounded-xl border border-navy-700 text-xs font-mono grid grid-cols-2 gap-2">
            <div>
              <span className="text-slate-400 block text-[10px]">CURRENT FLOW</span>
              <span className="text-white font-bold">{pipeline.current_flow_lpm} LPM</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">PRESSURE</span>
              <span className="text-white font-bold">{pipeline.current_pressure_bar} Bar</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Operational Justification / Reason <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Emergency leak isolation on 2nd floor riser"
              className="w-full bg-navy-900 border border-navy-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {error && <p className="text-xs text-rose-400">{error}</p>}

          <div className="pt-3 grid grid-cols-2 gap-3">
            {isClosed ? (
              <button
                onClick={() => handleAction('manual_open')}
                disabled={loading}
                className="col-span-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition"
              >
                {loading ? 'Actuating Valve...' : 'Open & Restore Valve'}
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleAction('manual_close')}
                  disabled={loading}
                  className="py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition"
                >
                  Manual Close
                </button>
                <button
                  onClick={() => handleAction('emergency_shutdown')}
                  disabled={loading}
                  className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition"
                >
                  Emergency Shutdown
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
