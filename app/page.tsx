// FILE: app/page.tsx
'use client';

import { useState } from 'react';
import AttendanceForm from './components/AttendanceForm';
import AttendanceHistory from './components/AttendanceHistory';
import { Camera, History } from 'lucide-react'; // <-- Impor ikon

export default function Home() {
  const [activeTab, setActiveTab] = useState<'absen' | 'history'>('absen');

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold text-slate-800 tracking-tight">Sistem Absensi</h1>
        <p className="text-slate-500 mt-2">Verifikasi lokasi dan bukti foto secara real-time.</p>
      </header>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
        <div className="flex">
          <button
            onClick={() => setActiveTab('absen')}
            className={`flex-1 flex justify-center items-center gap-2 py-4 px-6 font-semibold transition-all duration-300 ${activeTab === 'absen' ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
          >
            <Camera size={20} /> {/* <-- Gunakan Ikon */}
            Absen Sekarang
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 flex justify-center items-center gap-2 py-4 px-6 font-semibold transition-all duration-300 ${activeTab === 'history' ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
          >
            <History size={20} /> {/* <-- Gunakan Ikon */}
            Riwayat Absensi
          </button>
        </div>

        <div className="p-6 md:p-8">{activeTab === 'absen' ? <AttendanceForm /> : <AttendanceHistory />}</div>
      </div>

      <footer className="text-center mt-8 text-sm text-gray-400">
        <p>&copy; {new Date().getFullYear()} Test Golang by fakhri. All rights reserved.</p>
      </footer>
    </div>
  );
}
