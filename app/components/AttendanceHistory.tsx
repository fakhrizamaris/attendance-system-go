// FILE: app/components/AttendanceHistory.tsx
'use client';

import { useState, useEffect } from 'react';

interface AttendanceRecord {
  id: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  address: string;
  photoUrl: string;
  accuracy: number;
}

export default function AttendanceHistory() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/attendance/history', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setRecords(data);
      }
    } catch (error) {
      console.error('Gagal load riwayat:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">⏳ Memuat riwayat...</div>;
  }

  if (records.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-4xl mb-2">📋</p>
        <p>Belum ada riwayat absensi</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {records.map((record) => (
        <div key={record.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex gap-4">
            <img src={record.photoUrl} alt="Bukti kerja" className="w-24 h-24 object-cover rounded-lg" />
            <div className="flex-1">
              <p className="font-semibold text-gray-800">
                {new Date(record.timestamp).toLocaleString('id-ID', {
                  dateStyle: 'full',
                  timeStyle: 'short',
                })}
              </p>
              <p className="text-sm text-gray-600 mt-1">📍 {record.address || 'Alamat tidak tersedia'}</p>
              <p className="text-xs text-gray-500 mt-2">
                Koordinat: {record.latitude.toFixed(6)}, {record.longitude.toFixed(6)}
              </p>
              <p className="text-xs text-gray-500">Akurasi: {Math.round(record.accuracy)} meter</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
