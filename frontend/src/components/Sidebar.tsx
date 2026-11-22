import React from 'react';
import {
  LayoutDashboard,
  Activity,
  AlertTriangle,
  Droplets,
  Home,
  SlidersHorizontal,
  BarChart3,
  Bell,
  Settings,
  Shield,
  Wrench,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab }) => {
  const { role } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'maintenance', 'resident'] },
    { id: 'monitoring', label: 'Live Monitoring', icon: Activity, roles: ['admin', 'maintenance'] },
    { id: 'leakage', label: 'Leakage Detection', icon: AlertTriangle, roles: ['admin', 'maintenance'], badge: 'AI/ML' },
    { id: 'supply', label: 'Community Supply', icon: Droplets, roles: ['admin', 'maintenance', 'resident'] },
    { id: 'households', label: 'Households & Meters', icon: Home, roles: ['admin', 'maintenance', 'resident'] },
    { id: 'valves', label: 'Valve Controls', icon: SlidersHorizontal, roles: ['admin', 'maintenance'], badge: 'Auto' },
    { id: 'analytics', label: 'Analytics & Wastage', icon: BarChart3, roles: ['admin', 'maintenance'] },
    { id: 'alerts', label: 'Alert Center', icon: Bell, roles: ['admin', 'maintenance', 'resident'] },
    { id: 'settings', label: 'Settings & Node Info', icon: Settings, roles: ['admin', 'maintenance', 'resident'] },
  ];

  const filteredNav = navItems.filter((item) => !role || item.roles.includes(role));

  return (
    <aside className="w-64 bg-[#0B132B] border-r border-navy-700/60 flex flex-col justify-between shrink-0">
      <div className="py-6 px-4 space-y-1">
        <div className="px-3 mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Navigation
        </div>

        {filteredNav.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-navy-800/60'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-navy-800 text-cyan-300 border border-cyan-500/20">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Role Context Pill in bottom of sidebar */}
      <div className="p-4 border-t border-navy-700/60 bg-navy-900/40 m-3 rounded-xl border">
        <div className="flex items-center space-x-2 text-xs font-medium text-slate-300">
          {role === 'admin' && <Shield className="w-4 h-4 text-cyan-400" />}
          {role === 'maintenance' && <Wrench className="w-4 h-4 text-amber-400" />}
          {role === 'resident' && <UserCheck className="w-4 h-4 text-emerald-400" />}
          <span className="capitalize">{role || 'Viewer'} Workspace</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1 leading-snug">
          {role === 'admin' && 'Full community control, valves actuation & ML models.'}
          {role === 'maintenance' && 'Incident resolution, work orders & field sensors.'}
          {role === 'resident' && 'Household consumption & community supply availability.'}
        </p>
      </div>
    </aside>
  );
};
