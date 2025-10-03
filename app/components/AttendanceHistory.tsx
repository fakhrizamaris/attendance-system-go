'use client';

import { useState, useEffect } from 'react';

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

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setError(null);
        const response = await fetch('http://localhost:8080/api/attendance/history', {
          credentials: 'include', // Penting untuk mengirim cookie/token
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Gagal memuat riwayat.');
        }

        const data = await response.json();
        setRecords(data);
      } catch (err: any) {
        setError(err.message);
        console.error('Gagal load riwayat:', err);
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
        <p className="text-4xl mb-2">📂</p>
        <p className="font-semibold">Belum Ada Riwayat Absensi</p>
        <p className="text-sm">Silakan lakukan absensi pertama Anda.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {records.map((record) => (
        <div key={record.id} className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:shadow-md hover:border-blue-300 transition-all duration-300">
          <img src={`http://localhost:8080${record.photo_url}`} alt="Bukti kerja" className="w-24 h-24 object-cover rounded-lg bg-gray-100" />
          <div className="flex-1">
            <p className="font-bold text-gray-800">
              {new Date(record.created_at).toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
            <p className="text-sm text-gray-600">
              {new Date(record.created_at).toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
              })}{' '}
              WIB
            </p>
            <p className="text-xs text-gray-500 mt-2">📍 {record.address || 'Alamat tidak tersedia'}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
