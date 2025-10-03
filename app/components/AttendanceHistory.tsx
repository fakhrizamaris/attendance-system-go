'use client';

import { useState, useEffect } from 'react';
import { MapPin, X, Globe, Compass, FolderArchive } from 'lucide-react';

interface AttendanceRecord {
  id: string;
  created_at: string;
  latitude: number;
  longitude: number;
  address: string;
  photo_url: string;
  accuracy: number;
}

export default function AttendanceHistory() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      const token = localStorage.getItem('jwt_token');
      if (!token) {
        setError('Anda belum login.');
        setLoading(false);
        return;
      }
      try {
        const response = await fetch('http://localhost:8080/api/attendance/history', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Gagal memuat riwayat.');
        }
        const data = await response.json();
        setRecords(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) {
    return <div className="text-center py-10 text-gray-500">Memuat riwayat...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">Error: {error}</div>;
  }

  if (records.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400">
        <FolderArchive size={48} className="mx-auto mb-2" />
        <p className="font-semibold">Belum Ada Riwayat Absensi</p>
        <p className="text-sm">Riwayat absensi Anda akan muncul di sini.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {records.map((record) => (
          <div key={record.id} onClick={() => setSelectedRecord(record)} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:shadow-md hover:border-blue-500 transition-all duration-300 cursor-pointer">
            <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
              <img src={`http://localhost:8080${record.photo_url}`} alt="Bukti kerja" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-800 truncate">{new Date(record.created_at).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
              <p className="text-sm text-gray-600">Pukul {new Date(record.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</p>
              <p className="text-xs text-gray-500 mt-2 flex items-start gap-1">
                <MapPin size={12} className="mt-0.5 flex-shrink-0" />
                <span className="truncate">{record.address || 'Alamat tidak tersedia'}</span>
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* --- MODAL DIUBAH --- */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50" onClick={() => setSelectedRecord(null)}>
          {/* Mengubah layout menjadi flex-col dan membatasi tinggi */}
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="relative">
              <img
                src={`http://localhost:8080${selectedRecord.photo_url}`}
                alt="Detail Absensi"
                className="w-full object-contain rounded-t-lg max-h-[60vh]" // Batasi tinggi gambar
              />
              <button onClick={() => setSelectedRecord(null)} className="absolute top-3 right-3 bg-white/70 backdrop-blur-sm rounded-full p-1 text-gray-800 hover:bg-white transition-all z-10">
                <X size={20} />
              </button>
            </div>

            {/* Area detail sekarang bisa scroll jika perlu */}
            <div className="p-6 overflow-y-auto">
              <h3 className="text-xl font-bold text-gray-800">Detail Absensi</h3>
              <p className="text-gray-600 text-sm mb-4">{new Date(selectedRecord.created_at).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'long' })}</p>
              <div className="space-y-3 mt-4 border-t pt-4">
                {/* ... (detail lainnya tetap sama) ... */}
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="text-blue-500 mt-1 flex-shrink-0" size={18} />
                  <div>
                    <p className="font-semibold text-gray-700">Alamat</p>
                    <p className="text-gray-600">{selectedRecord.address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <Compass className="text-blue-500 mt-1 flex-shrink-0" size={18} />
                  <div>
                    <p className="font-semibold text-gray-700">Latitude</p>
                    <p className="text-gray-600 font-mono">{selectedRecord.latitude}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <Globe className="text-blue-500 mt-1 flex-shrink-0" size={18} />
                  <div>
                    <p className="font-semibold text-gray-700">Longitude</p>
                    <p className="text-gray-600 font-mono">{selectedRecord.longitude}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
