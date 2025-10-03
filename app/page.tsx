'use client';

import { useState } from 'react';
import AttendanceForm from './components/AttendanceForm';
import AttendanceHistory from './components/AttendanceHistory';
import { Camera, History, LoaderCircle } from 'lucide-react';

// Komponen Overlay Loading
const LoadingOverlay = () => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center z-50 backdrop-blur-sm">
    <LoaderCircle className="animate-spin text-white" size={48} />
    <p className="text-white mt-4 text-lg">Memproses Absensi...</p>
  </div>
);

export default function Home() {
  const [activeTab, setActiveTab] = useState<'absen' | 'history'>('absen');
  const [isSubmitting, setIsSubmitting] = useState(false); // State untuk loading

  return (
    // Tambahkan <main> untuk layout yang lebih baik
    <main className="relative min-h-screen">
      {isSubmitting && <LoadingOverlay />}

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
              <Camera size={20} />
              Absen Sekarang
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 flex justify-center items-center gap-2 py-4 px-6 font-semibold transition-all duration-300 ${activeTab === 'history' ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
            >
              <History size={20} />
              Riwayat Absensi
            </button>
          </div>

          <div className="p-6 md:p-8">
            {activeTab === 'absen' ? (
              <AttendanceForm setisSubmitting={setIsSubmitting} onSuccess={() => setActiveTab('history')} />
            ) : (
              <AttendanceHistory key={activeTab} /> // key={activeTab} akan me-remount komponen
            )}
          </div>
        </div>

        <footer className="text-center mt-8 text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} Test Golang by fakhri. All rights reserved.</p>
        </footer>
      </div>
    </main>
  );
}
