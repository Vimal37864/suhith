import { useState } from 'react';
import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:8000/api/v1' });

const CRIME_TYPES = ["Theft", "Assault", "Burglary", "Robbery", "Fraud", "Vandalism", "Drug Offense", "Kidnapping", "Cybercrime", "Homicide"];
const AREAS = ["T. Nagar", "Anna Nagar", "Adyar", "Velachery", "Tambaram", "Guindy", "Mylapore", "Egmore", "Chromepet", "Porur", "Mamallapuram", "Sholinganallur"];

export function SuspectPredictionPage() {
  const [form, setForm] = useState({
    crime_type: "Theft",
    area: "T. Nagar",
    hour: 12,
  });

  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/predict/suspect', form);
      setResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Suspect prediction failed.');
    } finally {
      setLoading(false);
    }
  };

  const update = (key: string, value: string | number) => setForm(f => ({ ...f, [key]: value }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Suspect Prediction</h1>
        <p className="text-sm text-slate-500 mt-1">Generate AI-powered suspect profiles based on crime parameters</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-1 dashboard-card p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Crime Parameters</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Crime Type</label>
              <select value={form.crime_type} onChange={e => update('crime_type', e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {CRIME_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Area</label>
              <select value={form.area} onChange={e => update('area', e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {AREAS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Hour (0-23)</label>
              <input type="number" min={0} max={23} value={form.hour} onChange={e => update('hour', parseInt(e.target.value) || 0)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <button type="submit" disabled={loading} className="w-full mt-2 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50">
              {loading ? 'Analyzing...' : 'Generate Suspect Profile'}
            </button>
          </form>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-6">
          {error && (
            <div className="dashboard-card p-6 border-red-200 bg-red-50">
              <p className="text-red-600 font-medium">{error}</p>
            </div>
          )}

          {result && (
            <>
              {/* Profile Card */}
              <div className="dashboard-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-slate-800">Suspect Profile</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Match Score:</span>
                    <span className={`text-2xl font-bold ${
                      result.suspect_profile.suspect_match_score >= 70 ? 'text-red-500' :
                      result.suspect_profile.suspect_match_score >= 40 ? 'text-orange-500' : 'text-green-500'
                    }`}>
                      {result.suspect_profile.suspect_match_score}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <ProfileStat label="Most Likely Age" value={result.suspect_profile.most_likely_age_group} />
                  <ProfileStat label="Most Likely Gender" value={result.suspect_profile.most_likely_gender} />
                  <ProfileStat label="Prior Record Likelihood" value={`${result.suspect_profile.prior_record_likelihood}%`} />
                  <ProfileStat label="Arrest Likelihood" value={`${result.suspect_profile.arrest_likelihood}%`} />
                </div>

                <p className="text-xs text-slate-500">Based on <strong>{result.similar_cases_analyzed}</strong> similar cases analyzed.</p>
              </div>

              {/* Distributions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <DistributionCard title="Age Distribution" data={result.suspect_profile.age_distribution} color="bg-blue-500" />
                <DistributionCard title="Gender Distribution" data={result.suspect_profile.gender_distribution} color="bg-purple-500" />
                <DistributionCard title="Weapon Distribution" data={result.suspect_profile.weapon_distribution} color="bg-amber-500" />
              </div>

              {/* Risk Factors */}
              {result.risk_factors.length > 0 && (
                <div className="dashboard-card p-6">
                  <h3 className="font-semibold text-slate-800 mb-3">Risk Factors</h3>
                  <div className="space-y-2">
                    {result.risk_factors.map((f: string, i: number) => (
                      <div key={i} className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-lg p-3">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span className="text-sm text-red-700">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {!result && !error && (
            <div className="dashboard-card p-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-700">Ready to Profile</h3>
              <p className="text-sm text-slate-500 mt-1">Enter crime details to generate a suspect profile</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProfileStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-lg p-3 text-center">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-lg font-bold text-slate-800">{value}</p>
    </div>
  );
}

function DistributionCard({ title, data, color }: { title: string; data: Record<string, number>; color: string }) {
  return (
    <div className="dashboard-card p-5">
      <h4 className="font-semibold text-slate-800 mb-4 text-sm">{title}</h4>
      <div className="space-y-3">
        {Object.entries(data).map(([label, pct]) => (
          <div key={label}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-600">{label}</span>
              <span className="font-semibold text-slate-800">{pct}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
