import { useState } from 'react';
import axios from 'axios';
import { RiskBadge } from './DataTable';

const api = axios.create({ baseURL: 'http://localhost:8000/api/v1' });

const CRIME_TYPES = ["Theft", "Assault", "Burglary", "Robbery", "Fraud", "Vandalism", "Drug Offense", "Kidnapping", "Cybercrime", "Homicide"];
const AREAS = ["T. Nagar", "Anna Nagar", "Adyar", "Velachery", "Tambaram", "Guindy", "Mylapore", "Egmore", "Chromepet", "Porur", "Mamallapuram", "Sholinganallur"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const AGE_GROUPS = ["18-25", "26-35", "36-45", "46+"];
const WEAPONS = ["None", "Knife", "Firearm", "Blunt Object"];

export function CrimePredictionPage() {
  const [form, setForm] = useState({
    crime_type: "Theft",
    area: "T. Nagar",
    hour: 12,
    month: 1,
    day_of_week: "Monday",
    suspect_age_group: "26-35",
    suspect_gender: "Male",
    suspect_prior_record: "No",
    weapon_used: "None",
  });

  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/predict/risk', form);
      setResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Prediction failed. Ensure backend ML models are loaded.');
    } finally {
      setLoading(false);
    }
  };

  const update = (key: string, value: string | number) => setForm(f => ({ ...f, [key]: value }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Crime Risk Prediction</h1>
        <p className="text-sm text-slate-500 mt-1">Enter crime parameters to predict risk level using AI models</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-1 dashboard-card p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Input Parameters</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <SelectField label="Crime Type" value={form.crime_type} options={CRIME_TYPES} onChange={v => update('crime_type', v)} />
            <SelectField label="Area" value={form.area} options={AREAS} onChange={v => update('area', v)} />
            <SelectField label="Day of Week" value={form.day_of_week} options={DAYS} onChange={v => update('day_of_week', v)} />

            <div className="grid grid-cols-2 gap-3">
              <NumberField label="Hour (0-23)" value={form.hour} min={0} max={23} onChange={v => update('hour', v)} />
              <NumberField label="Month (1-12)" value={form.month} min={1} max={12} onChange={v => update('month', v)} />
            </div>

            <SelectField label="Suspect Age Group" value={form.suspect_age_group} options={AGE_GROUPS} onChange={v => update('suspect_age_group', v)} />
            
            <div className="grid grid-cols-2 gap-3">
              <SelectField label="Gender" value={form.suspect_gender} options={["Male", "Female"]} onChange={v => update('suspect_gender', v)} />
              <SelectField label="Prior Record" value={form.suspect_prior_record} options={["Yes", "No"]} onChange={v => update('suspect_prior_record', v)} />
            </div>
            
            <SelectField label="Weapon Used" value={form.weapon_used} options={WEAPONS} onChange={v => update('weapon_used', v)} />

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Analyzing...' : 'Predict Risk Level'}
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
              {/* Summary */}
              <div className="dashboard-card p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Input Summary</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(result.input_summary).map(([key, val]) => (
                    <div key={key} className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs text-slate-500 capitalize">{key.replace(/_/g, ' ')}</p>
                      <p className="text-sm font-semibold text-slate-800">{val as string}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Model Results */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(result.predictions).map(([modelName, pred]: [string, any]) => (
                  <div key={modelName} className="dashboard-card p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold text-slate-800">{modelName}</h3>
                      <RiskBadge level={pred.prediction} />
                    </div>
                    <div className="space-y-3">
                      {Object.entries(pred.probabilities).map(([level, pct]: [string, any]) => (
                        <div key={level}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-600">{level}</span>
                            <span className="font-semibold text-slate-800">{pct}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2.5">
                            <div
                              className={`h-2.5 rounded-full ${
                                level.includes('High') ? 'bg-red-500' :
                                level.includes('Medium') ? 'bg-orange-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${pct}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {!result && !error && (
            <div className="dashboard-card p-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-700">Ready to Predict</h3>
              <p className="text-sm text-slate-500 mt-1">Fill in the parameters on the left and click "Predict Risk Level"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* Helper components */
function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function NumberField({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(parseInt(e.target.value) || min)}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
  );
}
