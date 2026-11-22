import React, { useState, useEffect } from 'react';
import { Droplet, Bell, Wifi, WifiOff, ShieldCheck, UserCheck, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTelemetry } from '../context/TelemetryContext';
import { UserRole } from '../types';
import { getAlerts, markAllAlertsRead } from '../services/api';

export const Navbar: React.FC = () => {
  const { user, role, switchDemoRole } = useAuth();
  const { isConnected, telemetry } = useTelemetry();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAlertMenu, setShowAlertMenu] = useState(false);
  const [recentAlerts, setRecentAlerts] = useState<any[]>([]);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const resp = await getAlerts(true);
        setRecentAlerts(resp.data.slice(0, 5));
        setUnreadCount(resp.data.length);
      } catch (e) {
        // ignore
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleClearAlerts = async () => {
    await markAllAlertsRead();
    setUnreadCount(0);
    setRecentAlerts([]);
  };

  return (
    <header className="h-16 bg-[#0B132B] border-b border-navy-700/60 px-6 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md bg-opacity-90">
      {/* Brand */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Droplet className="w-6 h-6 text-navy-900 fill-navy-900" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-lg text-white tracking-wide">AQUA<span className="text-cyan-400">FLOW</span></span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-900/50 text-cyan-300 border border-cyan-500/30">
              v1.0 IoT
            </span>
          </div>
          <p className="text-xs text-slate-400 hidden sm:block">Smart Community Water Infrastructure & Leak Detection</p>
        </div>
      </div>

      {/* Middle: IoT Status Indicator & Simulation Badge */}
      <div className="hidden md:flex items-center space-x-4">
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-mono border ${
          isConnected
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400'
            : 'bg-rose-950/40 border-rose-500/40 text-rose-400'
        }`}>
          {isConnected ? <Wifi className="w-3.5 h-3.5 animate-pulse" /> : <WifiOff className="w-3.5 h-3.5" />}
          <span>{isConnected ? 'LIVE WEBSOCKET' : 'CONNECTING...'}</span>
        </div>

        {telemetry?.active_scenario && (
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>SIMULATION: {telemetry.active_scenario.toUpperCase()}</span>
          </div>
        )}
      </div>

      {/* Right Actions: Role Switcher, Alert Bell, Profile */}
      <div className="flex items-center space-x-4">
        {/* Quick Role Switcher Pill */}
        <div className="flex items-center space-x-1 bg-navy-800 p-1 rounded-lg border border-navy-700">
          <span className="text-[11px] text-slate-400 px-2 font-medium hidden lg:inline">Role:</span>
          {(['admin', 'maintenance', 'resident'] as UserRole[]).map((r) => (
            <button
              key={r}
              onClick={() => switchDemoRole(r)}
              className={`px-2.5 py-1 text-xs rounded font-medium capitalize transition-all ${
                role === r
                  ? 'bg-cyan-500 text-navy-900 font-bold shadow-md shadow-cyan-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-navy-700'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Alerts Bell Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowAlertMenu(!showAlertMenu)}
            className="p-2 rounded-lg bg-navy-800 text-slate-300 hover:text-white hover:bg-navy-700 transition relative"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-bounce">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showAlertMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-navy-800 border border-navy-700 rounded-xl shadow-2xl p-4 z-50">
              <div className="flex items-center justify-between pb-3 border-b border-navy-700">
                <span className="font-semibold text-sm text-white">Active Alerts ({unreadCount})</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleClearAlerts}
                    className="text-xs text-cyan-400 hover:underline flex items-center space-x-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>
              <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                {recentAlerts.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No unread alerts at this time.</p>
                ) : (
                  recentAlerts.map((a) => (
                    <div
                      key={a.id}
                      className={`p-2.5 rounded-lg border text-xs ${
                        a.severity === 'critical'
                          ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                          : a.severity === 'high'
                          ? 'bg-orange-950/40 border-orange-500/40 text-orange-200'
                          : 'bg-navy-900 border-navy-700 text-slate-300'
                      }`}
                    >
                      <div className="font-semibold text-white">{a.title}</div>
                      <p className="text-[11px] text-slate-300 mt-1 line-clamp-2">{a.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Badge */}
        <div className="flex items-center space-x-2 pl-2 border-l border-navy-700">
          <div className="w-8 h-8 rounded-full bg-navy-700 border border-cyan-500/30 flex items-center justify-center text-cyan-300 font-bold text-xs">
            {user?.full_name ? user.full_name[0] : 'U'}
          </div>
          <div className="hidden xl:block text-left">
            <div className="text-xs font-medium text-white truncate max-w-[120px]">{user?.full_name || 'Guest'}</div>
            <div className="text-[10px] text-cyan-400 font-mono capitalize flex items-center space-x-1">
              <ShieldCheck className="w-3 h-3 inline" />
              <span>{role || 'Viewer'}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
