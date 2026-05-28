import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  iconBgColor?: string;
  trend?: React.ReactNode;
}

export function StatCard({ title, value, subtitle, icon, iconBgColor, trend }: StatCardProps) {
  return (
    <div className="dashboard-card p-5 flex flex-col justify-between">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-sm font-semibold text-slate-600">{title}</h3>
        {icon && (
          <div className={`p-2 rounded-lg ${iconBgColor || 'bg-slate-100'}`}>
            {icon}
          </div>
        )}
      </div>
      <div>
        <div className="text-3xl font-bold text-slate-800 mb-1">{value}</div>
        {subtitle && <p className="text-xs text-slate-500 font-medium flex items-center gap-1">{subtitle}</p>}
        {trend && <div className="mt-2 h-8">{trend}</div>}
      </div>
    </div>
  );
}
