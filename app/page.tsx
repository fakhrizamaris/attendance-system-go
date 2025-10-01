'use client';

import { useState, useEffect } from 'react';
import AttendanceForm from './components/AttendanceForm';
import AttendanceHistory from './components/AttendanceHistory';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'absen' | 'history'>('absen');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Sistem Absensi Karyawan
          </h1>
          <p className="text-gray-600">
            Absensi dengan verifikasi lokasi dan bukti foto
          </p>
        </header>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('absen')}
              className={`flex-1 py-4 px-6 font-semibold transition-colors ${
                activeTab === 'absen'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              📍 Absen Sekarang
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-4 px-6 font-semibold transition-colors ${
                activeTab === 'history'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              📋 Riwayat Absensi
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'absen' ? (
              <AttendanceForm />
            ) : (
              <AttendanceHistory />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}



