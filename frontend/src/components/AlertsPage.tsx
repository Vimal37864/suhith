import { useState, useEffect } from 'react';
import axios from 'axios';
import { RiskBadge } from './DataTable';

const api = axios.create({ baseURL: 'http://localhost:8000/api/v1' });

export function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/alerts?limit=50')
      .then(res => { setAlerts(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? alerts : alerts.filter(a => a.risk_level === filter);

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading alerts...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Crime Alerts</h1>
          <p className="text-sm text-slate-500 mt-1">Recent crime incidents from the database</p>
        </div>
        <div className="flex gap-2">
          {['all', 'Low Risk', 'Medium Risk', 'High Risk'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                filter === f ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>
      </div>

      <div className="dashboard-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-5 py-3 text-xs font-bold text-slate-700">Crime ID</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-700">Time</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-700">Area</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-700">Crime Type</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-700">Severity</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-700">Risk Level</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-700">Weapon</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-700">Arrest</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((a, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3 text-sm font-mono text-blue-600 font-semibold">{a.crime_id}</td>
                  <td className="px-5 py-3 text-sm text-slate-600">{a.time}</td>
                  <td className="px-5 py-3 text-sm text-slate-600 font-medium">{a.area}</td>
                  <td className="px-5 py-3 text-sm text-slate-600">{a.crime_type}</td>
                  <td className="px-5 py-3"><RiskBadge level={a.severity} /></td>
                  <td className="px-5 py-3"><RiskBadge level={a.risk_level} /></td>
                  <td className="px-5 py-3 text-sm text-slate-600">{a.weapon_used}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-1 rounded-md text-xs font-semibold ${a.arrest_made === 'Yes' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                      {a.arrest_made}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-slate-400">No alerts match the selected filter.</div>
        )}
      </div>
    </div>
  );
}
