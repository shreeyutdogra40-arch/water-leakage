import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TelemetryProvider, useTelemetry } from './context/TelemetryContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { LiveMonitoring } from './pages/LiveMonitoring';
import { LeakageDetection } from './pages/LeakageDetection';
import { CommunitySupply } from './pages/CommunitySupply';
import { Households } from './pages/Households';
import { ValveControls } from './pages/ValveControls';
import { Analytics } from './pages/Analytics';
import { AlertsPage } from './pages/AlertsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AlertTriangle, X, Flame } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { isLoading } = useAuth();
  const { activeAlerts, dismissAlertToast } = useTelemetry();
  const [currentTab, setCurrentTab] = useState('dashboard');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B132B] flex items-center justify-center text-cyan-400 font-mono text-sm">
        <div className="flex items-center space-x-3">
          <span className="w-3 h-3 rounded-full bg-cyan-400 animate-ping"></span>
          <span>Connecting to AquaFlow Infrastructure...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B132B] text-slate-100 flex flex-col">
      <Navbar />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          {currentTab === 'dashboard' && <Dashboard onNavigateTab={setCurrentTab} />}
          {currentTab === 'monitoring' && <LiveMonitoring />}
          {currentTab === 'leakage' && <LeakageDetection />}
          {currentTab === 'supply' && <CommunitySupply />}
          {currentTab === 'households' && <Households />}
          {currentTab === 'valves' && <ValveControls />}
          {currentTab === 'analytics' && <Analytics />}
          {currentTab === 'alerts' && <AlertsPage />}
          {currentTab === 'settings' && <SettingsPage />}
        </main>
      </div>

      {/* Real-Time Floating Toast Notifications */}
      {activeAlerts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 space-y-2 max-w-sm pointer-events-auto">
          {activeAlerts.map((alert) => {
            const isCritical = alert.severity === 'critical';
            return (
              <div
                key={alert.id}
                className={`p-4 rounded-2xl border shadow-2xl backdrop-blur-md flex items-start space-x-3 animate-slide-in ${
                  isCritical
                    ? 'bg-rose-950/95 border-rose-500 text-rose-100 ring-2 ring-rose-500/30'
                    : 'bg-navy-800/95 border-amber-500 text-amber-100'
                }`}
              >
                <div className="p-2 rounded-xl bg-black/20 shrink-0">
                  {isCritical ? <Flame className="w-5 h-5 text-rose-400" /> : <AlertTriangle className="w-5 h-5 text-amber-400" />}
                </div>
                <div className="flex-1 text-xs">
                  <div className="font-bold flex items-center justify-between">
                    <span>{alert.title}</span>
                    <button
                      onClick={() => dismissAlertToast(alert.id)}
                      className="text-slate-400 hover:text-white p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="mt-1 text-[11px] leading-snug opacity-90">{alert.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <TelemetryProvider>
        <MainLayout />
      </TelemetryProvider>
    </AuthProvider>
  );
}

export default App;
