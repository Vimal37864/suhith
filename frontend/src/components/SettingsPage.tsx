import { useState, useEffect } from 'react';
import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:8000/api/v1' });

export function SettingsPage() {
  const [modelPerf, setModelPerf] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    api.get('/model-performance').then(r => setModelPerf(r.data)).catch(() => {});
    api.get('/stats').then(r => setStats(r.data)).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Settings & System Info</h1>
        <p className="text-sm text-slate-500 mt-1">Model performance, database statistics, and system configuration</p>
      </div>

      {/* System Stats */}
      {stats && (
        <div className="dashboard-card p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Database Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatItem label="Total Records" value={stats.total_crimes?.toLocaleString()} />
            <StatItem label="Crime Types" value={stats.crime_types} />
            <StatItem label="Areas Covered" value={stats.areas_covered} />
            <StatItem label="Arrest Rate" value={`${stats.arrest_rate}%`} />
            <StatItem label="High Risk %" value={`${stats.high_risk_pct}%`} />
          </div>
        </div>
      )}

      {/* Model Performance */}
      {modelPerf && (
        <div className="dashboard-card p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Model Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(modelPerf).map(([modelName, metrics]: [string, any]) => (
              <div key={modelName} className="bg-slate-50 rounded-xl p-5">
                <h3 className="font-semibold text-slate-800 mb-4">{modelName}</h3>
                <div className="space-y-3">
                  {Object.entries(metrics).map(([metric, value]: [string, any]) => (
                    <div key={metric}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-600 capitalize">{metric.replace(/_/g, ' ')}</span>
                        <span className="font-semibold text-slate-800">{typeof value === 'number' ? `${(value * 100).toFixed(1)}%` : value}</span>
                      </div>
                      {typeof value === 'number' && (
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div className="h-2 rounded-full bg-blue-500" style={{ width: `${value * 100}%` }}></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* API Config */}
      <div className="dashboard-card p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">API Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ConfigRow label="Backend URL" value="http://localhost:8000" />
          <ConfigRow label="API Version" value="v1" />
          <ConfigRow label="Framework" value="FastAPI + SQLAlchemy" />
          <ConfigRow label="ML Models" value="Random Forest, XGBoost" />
          <ConfigRow label="Database" value="SQLite (crimes.db)" />
          <ConfigRow label="Frontend" value="React + Vite + TailwindCSS" />
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-slate-50 rounded-lg p-3 text-center">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-xl font-bold text-slate-800">{value}</p>
    </div>
  );
}

function ConfigRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3">
      <span className="text-sm text-slate-600">{label}</span>
      <span className="text-sm font-semibold text-slate-800 font-mono">{value}</span>
    </div>
  );
}
