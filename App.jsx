/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Map as MapIcon, ChevronLeft, MapPin, Search, List, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchPhotoSpots } from '../services/dataService';
import { PhotoSpot } from '../types';

// Fix for default marker icons in React Leaflet
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom Marker Helper to programmatically move the map
function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 14, { animate: true });
  }, [center, map]);
  return null;
}

export default function MapPage() {
  const [spots, setSpots] = useState<PhotoSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpot, setSelectedSpot] = useState<PhotoSpot | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    fetchPhotoSpots()
      .then(setSpots)
      .finally(() => setLoading(false));
  }, []);

  const filteredSpots = useMemo(() => {
    return spots.filter(spot => 
      spot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      spot.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      spot.locationName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [spots, searchTerm]);

  const mapCenter: [number, number] = selectedSpot 
    ? [selectedSpot.latitude, selectedSpot.longitude] 
    : [41.0082, 28.9784];

  if (loading) {
    return (
      <div className="h-screen bg-ink flex items-center justify-center">
        <motion.div 
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-paper font-mono text-xs uppercase tracking-[0.4em]"
        >
          Yükleniyor...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex overflow-hidden bg-ink text-paper font-sans">
      {/* Search & Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: sidebarOpen ? '400px' : '0px' }}
        className="h-full bg-paper text-ink relative z-30 flex flex-col shadow-2xl"
      >
        <div className="p-6 border-b border-ink/5">
          <div className="flex justify-between items-center mb-8">
            <Link to="/" className="flex items-center gap-2 hover:text-accent transition-colors">
              <ChevronLeft className="w-4 h-4" />
              <span className="font-mono text-[10px] uppercase font-bold">Geri Dön</span>
            </Link>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 hover:bg-ink/5 rounded"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          <h2 className="font-serif text-3xl mb-6">Mekanlar</h2>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" />
            <input 
              type="text" 
              placeholder="Mekan ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-ink/5 border-none rounded-lg pl-10 pr-4 py-3 text-sm focus:ring-1 focus:ring-accent outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredSpots.map((spot) => (
              <motion.div
                key={spot.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={() => setSelectedSpot(spot)}
                className={`p-3 rounded-xl cursor-pointer group transition-all duration-300 ${
                  selectedSpot?.id === spot.id ? 'bg-ink text-paper' : 'hover:bg-ink/5'
                }`}
              >
                <div className="flex gap-4">
                  <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                    <img 
                      src={spot.imageUrl} 
                      alt={spot.name} 
                      className="w-full h-full object-cover transition-transform group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex flex-col justify-center overflow-hidden">
                    <span className="font-mono text-[9px] uppercase text-accent mb-1 tracking-wider">{spot.category}</span>
                    <h3 className="font-medium text-sm mb-1 truncate">{spot.name}</h3>
                    <div className="flex items-center gap-1 opacity-60">
                      <MapPin className="w-3 h-3" />
                      <span className="text-[10px] truncate">{spot.locationName}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.aside>

      {/* Toggle Sidebar Button (Desktop only when closed) */}
      {!sidebarOpen && (
        <button 
          onClick={() => setSidebarOpen(true)}
          className="absolute top-8 left-8 z-40 bg-paper text-ink p-3 rounded-full shadow-xl hover:bg-accent hover:text-white transition-all transform active:scale-95"
        >
          <List className="w-5 h-5" />
        </button>
      )}

      {/* Map View */}
      <main className="flex-1 relative">
        <MapContainer 
          center={mapCenter} 
          zoom={13} 
          className="z-10"
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          <ChangeView center={mapCenter} />
          
          {spots.map((spot) => (
            <Marker 
              key={spot.id} 
              position={[spot.latitude, spot.longitude]}
              eventHandlers={{
                click: () => setSelectedSpot(spot),
              }}
            >
              <Popup className="custom-popup">
                <div className="w-48 overflow-hidden rounded-lg">
                  <img 
                    src={spot.imageUrl} 
                    alt={spot.name} 
                    className="w-full h-24 object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="p-3">
                    <h4 className="font-bold text-xs uppercase tracking-wider mb-1">{spot.name}</h4>
                    <p className="text-[10px] text-ink/60 line-clamp-2">{spot.description}</p>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Selected Spot Quick Info overlay (Mobile friendly) */}
        <AnimatePresence>
          {selectedSpot && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 w-[90%] max-w-lg bg-paper text-ink p-6 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-accent" />
              <div className="flex gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-[10px] uppercase font-bold text-accent px-2 py-0.5 bg-accent/10 rounded">
                      {selectedSpot.category}
                    </span>
                  </div>
                  <h3 className="font-serif text-2xl mb-2">{selectedSpot.name}</h3>
                  <p className="text-sm text-ink/60 mb-4 line-clamp-2">{selectedSpot.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-ink/40">
                      <Camera className="w-4 h-4" />
                      <span className="text-[10px] uppercase font-bold">Popüler Mekan</span>
                    </div>
                    <button 
                      onClick={() => setSelectedSpot(null)}
                      className="text-[10px] uppercase font-bold text-ink/40 hover:text-ink transition-colors"
                    >
                      Kapat
                    </button>
                  </div>
                </div>
                <div className="w-32 aspect-square rounded-xl overflow-hidden hidden sm:block">
                  <img 
                    src={selectedSpot.imageUrl} 
                    alt={selectedSpot.name} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* HUD Elements */}
        <div className="absolute top-8 right-8 z-20 flex flex-col items-end gap-4">
          <div className="bg-ink/80 backdrop-blur text-paper p-4 rounded-xl border border-paper/10 flex items-center gap-3">
            <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
            <span className="font-mono text-[10px] uppercase tracking-widest">
              {spots.length} Mekan Aktif
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
