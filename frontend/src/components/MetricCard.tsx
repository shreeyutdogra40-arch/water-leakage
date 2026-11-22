import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  trend?: string;
  trendPositive?: boolean;
  color?: 'cyan' | 'green' | 'amber' | 'red' | 'blue';
  subtitle?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  icon: Icon,
  trend,
  trendPositive,
  color = 'cyan',
  subtitle,
}) => {
  const colorMap = {
    cyan: {
      border: 'border-cyan-500/20 hover:border-cyan-500/40',
      iconBg: 'bg-cyan-500/10 text-cyan-400',
      valColor: 'text-white',
    },
    green: {
      border: 'border-emerald-500/20 hover:border-emerald-500/40',
      iconBg: 'bg-emerald-500/10 text-emerald-400',
      valColor: 'text-white',
    },
    amber: {
      border: 'border-amber-500/20 hover:border-amber-500/40',
      iconBg: 'bg-amber-500/10 text-amber-400',
      valColor: 'text-amber-200',
    },
    red: {
      border: 'border-rose-500/30 hover:border-rose-500/50',
      iconBg: 'bg-rose-500/15 text-rose-400',
      valColor: 'text-rose-200',
    },
    blue: {
      border: 'border-blue-500/20 hover:border-blue-500/40',
      iconBg: 'bg-blue-500/10 text-blue-400',
      valColor: 'text-white',
    },
  };

  const c = colorMap[color];

  return (
    <div className={`bg-navy-800/90 rounded-2xl p-5 border ${c.border} shadow-lg backdrop-blur-sm transition-all duration-200`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</span>
        <div className={`p-2 rounded-xl ${c.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline space-x-1.5">
        <span className={`text-2xl font-black tracking-tight ${c.valColor}`}>{value}</span>
        {unit && <span className="text-xs font-mono text-slate-400">{unit}</span>}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs">
        {subtitle && <span className="text-slate-400">{subtitle}</span>}
        {trend && (
          <span className={`font-mono text-[11px] px-2 py-0.5 rounded-full font-medium ${
            trendPositive
              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
              : 'bg-rose-950/60 text-rose-400 border border-rose-500/30'
          }`}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
};
