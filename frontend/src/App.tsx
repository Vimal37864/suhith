import { useState, useEffect } from 'react';
import axios from 'axios';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { StatCard } from './components/StatCard';
import { CrimeMap } from './components/CrimeMap';
import { DataTable, RiskBadge } from './components/DataTable';
import { CrimePredictionPage } from './components/CrimePredictionPage';
import { SuspectPredictionPage } from './components/SuspectPredictionPage';
import { ReportsPage } from './components/ReportsPage';
import { AlertsPage } from './components/AlertsPage';
import { SettingsPage } from './components/SettingsPage';
import { Calendar, ShieldCheck, ShieldAlert, Shield } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

const api = axios.create({ baseURL: 'http://localhost:8000/api/v1' });

/* ─── Dashboard Page (default) ────────────────────────────────── */
function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard-data')
      .then(res => { setData(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const trendData = [
    { value: 10 }, { value: 15 }, { value: 12 }, { value: 20 },
    { value: 18 }, { value: 25 }, { value: 30 }, { value: 28 }, { value: 35 }
  ];

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading dashboard...</div>;

  const stats = data?.stats_override || {
    total_crimes_30d: 1248, total_crimes_pct: "+12.5%",
    low_risk_areas: 12, medium_risk_areas: 18, high_risk_areas: 7, predicted_crimes_7d: 342
  };
  const crimePredictions = data?.crime_predictions || [];
  const recentAlerts = data?.recent_alerts || [];
  const suspectPredictions = data?.suspect_predictions || [];

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatCard
          title="Total Crimes (Last 30 Days)"
          value={stats.total_crimes_30d.toLocaleString()}
          subtitle={<><span className="text-red-500">{stats.total_crimes_pct}</span> vs previous 30 days</>}
          icon={<Calendar size={20} className="text-purple-600" />}
          iconBgColor="bg-purple-100"
        />
        <StatCard
          title="Low Risk Areas"
          value={stats.low_risk_areas}
          subtitle={<><span className="text-green-500">+2</span> vs previous 30 days</>}
          icon={<ShieldCheck size={20} className="text-green-600" />}
          iconBgColor="bg-green-100"
        />
        <StatCard
          title="Medium Risk Areas"
          value={stats.medium_risk_areas}
          subtitle={<><span className="text-orange-500">+3</span> vs previous 30 days</>}
          icon={<Shield size={20} className="text-orange-600" />}
          iconBgColor="bg-orange-100"
        />
        <StatCard
          title="High Risk Areas"
          value={stats.high_risk_areas}
          subtitle={<><span className="text-red-500">+1</span> vs previous 30 days</>}
          icon={<ShieldAlert size={20} className="text-red-600" />}
          iconBgColor="bg-red-100"
        />
        <StatCard
          title="Predicted Crimes (Next 7 Days)"
          value={stats.predicted_crimes_7d}
          trend={
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="value" stroke="#3b82f6" fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          }
        />
      </div>

      {/* Map + Predictions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CrimeMap />
        <DataTable
          title="Crime Predictions (Next 7 Days)"
          data={crimePredictions}
          columns={[
            { header: 'Area', accessor: (row: any) => row.area },
            { header: 'Risk Level', accessor: (row: any) => <RiskBadge level={row.risk_level} /> },
            { header: 'Probability (%)', accessor: (row: any) => `${row.probability}%` },
            { header: 'Predicted Crimes', accessor: (row: any) => row.predicted_crimes },
          ]}
        />
      </div>

      {/* Alerts + Suspects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DataTable
          title="Recent Crime Alerts"
          data={recentAlerts}
          columns={[
            { header: 'Time', accessor: (row: any) => row.time },
            { header: 'Area', accessor: (row: any) => row.area },
            { header: 'Crime Type', accessor: (row: any) => row.crime_type },
            { header: 'Risk Level', accessor: (row: any) => <RiskBadge level={row.risk_level} /> },
          ]}
        />
        <DataTable
          title="Suspect Prediction (Top 5)"
          data={suspectPredictions}
          columns={[
            { header: 'Suspect ID', accessor: (row: any) => row.suspect_id },
            { header: 'Match Score (%)', accessor: (row: any) => `${row.match_score}%` },
            { header: 'Risk Level', accessor: (row: any) => <RiskBadge level={row.risk_level} /> },
          ]}
        />
      </div>
    </div>
  );
}

/* ─── Main App with Tab Routing ──────────────────────────────── */
export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardPage />;
      case 'predict': return <CrimePredictionPage />;
      case 'suspect': return <SuspectPredictionPage />;
      case 'hotspots': return <CrimeMap fullScreen />;
      case 'reports': return <ReportsPage />;
      case 'alerts': return <AlertsPage />;
      case 'settings': return <SettingsPage />;
      default: return <DashboardPage />;
    }
  };

  return (
    <div className="flex bg-[#f4f7fe] min-h-screen text-slate-800 font-sans">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 ml-64 flex flex-col">
        <Header />
        <main className="p-6 flex-1">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
