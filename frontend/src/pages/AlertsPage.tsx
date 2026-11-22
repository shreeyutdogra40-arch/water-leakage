import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, AlertTriangle, Flame, Droplet, SlidersHorizontal, Check } from 'lucide-react';
import { getAlerts, markAlertRead, markAllAlertsRead } from '../services/api';
import { NotificationItem } from '../types';

export const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<NotificationItem[]>([]);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const fetchAlerts = async () => {
    try {
      const resp = await getAlerts(unreadOnly);
      setAlerts(resp.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5000);
    return () => clearInterval(interval);
  }, [unreadOnly]);

  const handleMarkRead = async (id: number) => {
    await markAlertRead(id);
    fetchAlerts();
  };

  const handleMarkAll = async () => {
    await markAllAlertsRead();
    fetchAlerts();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-xl font-black text-white flex items-center space-x-2">
            <Bell className="w-6 h-6 text-cyan-400" />
            <span>Community Alerts & Notification Center</span>
          </h2>
          <p className="text-xs text-slate-400">
            Real-time critical alarms, valve shutoff advisories, low water levels, and maintenance work orders.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setUnreadOnly(!unreadOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono border transition ${
              unreadOnly
                ? 'bg-cyan-500 text-navy-900 font-bold border-cyan-400'
                : 'bg-navy-800 text-slate-300 border-navy-700 hover:text-white'
            }`}
          >
            {unreadOnly ? 'Showing Unread Only' : 'Show All Alerts'}
          </button>

          <button
            onClick={handleMarkAll}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-navy-800 border border-navy-700 text-xs font-mono text-cyan-400 hover:border-cyan-500 transition"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Mark All As Read</span>
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="bg-navy-800/90 rounded-2xl border border-navy-700 p-12 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <h4 className="font-bold text-white text-sm">No Active Alerts</h4>
            <p className="text-xs text-slate-400 mt-1">All pipelines and tanks are reporting within normal operating parameters.</p>
          </div>
        ) : (
          alerts.map((a) => {
            const isCritical = a.severity === 'critical';
            const isHigh = a.severity === 'high';

            return (
              <div
                key={a.id}
                className={`p-4 rounded-2xl border transition-all ${
                  !a.is_read
                    ? isCritical
                      ? 'border-rose-500/60 bg-rose-950/20'
                      : isHigh
                      ? 'border-amber-500/50 bg-amber-950/20'
                      : 'border-cyan-500/40 bg-navy-800/95 ring-1 ring-cyan-500/20'
                    : 'border-navy-700/80 bg-navy-800/60 opacity-80'
                } flex flex-col sm:flex-row sm:items-center justify-between gap-3`}
              >
                <div className="flex items-start space-x-3.5">
                  <div className={`p-2.5 rounded-xl mt-0.5 shrink-0 ${
                    isCritical
                      ? 'bg-rose-500/20 text-rose-400'
                      : isHigh
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-cyan-500/20 text-cyan-400'
                  }`}>
                    {isCritical ? <Flame className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-white">{a.title}</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                        isCritical
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : isHigh
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-navy-900 text-cyan-300 border border-navy-700'
                      }`}>
                        {a.severity}
                      </span>
                      {!a.is_read && (
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{a.message}</p>
                    <span className="text-[10px] font-mono text-slate-400 mt-2 block">
                      {new Date(a.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                {!a.is_read && (
                  <button
                    onClick={() => handleMarkRead(a.id)}
                    className="self-end sm:self-auto px-3 py-1.5 rounded-lg bg-navy-900 border border-navy-700 hover:border-cyan-500 text-xs font-mono text-slate-300 hover:text-white transition flex items-center space-x-1 shrink-0"
                  >
                    <Check className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Mark Read</span>
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
