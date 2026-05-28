import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:8000/api/v1' });

function MapController() {
  const map = useMap();
  useEffect(() => {
    map.setView([13.0827, 80.2707], 11);
  }, [map]);
  return null;
}

interface CrimeMapProps {
  fullScreen?: boolean;
}

export function CrimeMap({ fullScreen = false }: CrimeMapProps) {
  const [points, setPoints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    api.get('/heatmap')
      .then(res => {
        setPoints(res.data);
        setLoading(false);
      })
      .catch(() => {
        setPoints([]);
        setLoading(false);
      });
  }, []);

  const getMarkerColor = (severity: string) => {
    switch (severity) {
      case 'High': return '#ef4444';
      case 'Medium': return '#f59e0b';
      case 'Low': return '#22c55e';
      default: return '#3b82f6';
    }
  };

  const filteredPoints = filter === 'all' ? points : points.filter(p => p.severity === filter);

  return (
    <div className={`dashboard-card overflow-hidden flex flex-col ${fullScreen ? 'h-[calc(100vh-7rem)]' : 'h-[400px]'}`}>
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <span className="font-semibold text-slate-800">Crime Risk Map</span>
        {fullScreen && (
          <div className="flex gap-2">
            {['all', 'Low', 'Medium', 'High'].map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  filter === s
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s === 'all' ? 'All' : `${s} Risk`}
              </button>
            ))}
            <span className="ml-4 text-sm text-slate-500">{filteredPoints.length.toLocaleString()} incidents</span>
          </div>
        )}
      </div>
      <div className="relative flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-full text-slate-400">Loading map data...</div>
        ) : (
          <MapContainer
            center={[13.0827, 80.2707]}
            zoom={11}
            style={{ height: '100%', width: '100%', zIndex: 0 }}
            zoomControl={true}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://carto.com/">Carto</a>'
            />
            {filteredPoints.map((p, i) => (
              <CircleMarker
                key={i}
                center={[p.lat, p.lon]}
                radius={fullScreen ? p.intensity * 12 : p.intensity * 20}
                fillColor={getMarkerColor(p.severity)}
                fillOpacity={0.45}
                color="transparent"
              >
                <Popup>
                  <div className="text-sm">
                    <strong>{p.area}</strong><br />
                    Type: {p.crime_type}<br />
                    Risk: {p.severity}
                  </div>
                </Popup>
              </CircleMarker>
            ))}
            <MapController />
          </MapContainer>
        )}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg z-[1000] border border-slate-100">
          <h4 className="text-xs font-bold text-slate-700 mb-2">Risk level</h4>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
              <span className="text-xs text-slate-600">Low Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>
              <span className="text-xs text-slate-600">Medium Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
              <span className="text-xs text-slate-600">High Risk</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
