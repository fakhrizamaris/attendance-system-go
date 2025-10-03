'use client';

import { useState, useRef } from 'react';
import { MapPin, Check, Camera } from 'lucide-react';

// Perbarui interface untuk menyimpan detail alamat
interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  address: {
    full: string;
    road?: string;
    suburb?: string; // Kecamatan
    city?: string;
    state?: string; // Provinsi
  };
}

const Spinner = () => (
  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export default function AttendanceForm() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [submitStatus, setSubmitStatus] = useState({ message: '', type: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- FUNGSI getLocation DIUBAH UNTUK MENGAMBIL DETAIL ALAMAT ---
  const getLocation = async () => {
    setLoading(true);
    setSubmitStatus({ message: '', type: '' });
    if (!navigator.geolocation) {
      alert('GPS tidak didukung di browser ini.');
      setLoading(false);
      return;
    }
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        });
      });

      const locationData: Partial<LocationData> = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
        address: { full: 'Alamat tidak ditemukan' },
      };

      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${locationData.latitude}&lon=${locationData.longitude}`);
        const data = await response.json();
        if (data && data.address) {
          locationData.address = {
            full: data.display_name,
            road: data.address.road,
            suburb: data.address.suburb,
            city: data.address.city || data.address.county,
            state: data.address.state,
          };
        }
      } catch (error) {
        console.error('Gagal mendapatkan alamat:', error);
      }

      setLocation(locationData as LocationData);
    } catch (error: any) {
      alert('Gagal mendapatkan lokasi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- FUNGSI handlePhotoSelect DIUBAH UNTUK MENAMPILKAN DETAIL ALAMAT ---
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !location) {
      alert('Harap ambil lokasi terlebih dahulu sebelum memilih foto.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // Siapkan semua baris teks
        const timestamp = new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'long' });
        const addressLines = [
          location.address.road || 'Jalan tidak terdeteksi',
          `${location.address.suburb || ''}, ${location.address.city || ''}`,
          location.address.state || '',
          `Lat: ${location.latitude?.toFixed(6)}, Lon: ${location.longitude?.toFixed(6)}`,
        ].filter((line) => line.trim() !== ''); // Filter baris kosong

        const fontSize = Math.max(20, Math.floor(img.width / 50)); // Font sedikit lebih kecil
        const lineHeight = fontSize * 1.4;
        const boxHeight = lineHeight * (addressLines.length + 1) + 40; // +1 untuk baris waktu

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, canvas.height - boxHeight, canvas.width, boxHeight);

        ctx.fillStyle = 'white';
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textAlign = 'left';

        // Gambar waktu
        let currentY = canvas.height - boxHeight + lineHeight;
        ctx.fillText(timestamp, 20, currentY);

        // Gambar baris-baris alamat
        ctx.font = `${fontSize}px Arial`; // Font non-bold untuk alamat
        addressLines.forEach((line) => {
          currentY += lineHeight;
          ctx.fillText(line, 20, currentY);
        });

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const newFile = new File([blob], `attendance_${Date.now()}.jpg`, { type: 'image/jpeg' });
              setPhotoFile(newFile);
              setPhotoPreview(URL.createObjectURL(newFile));
            }
          },
          'image/jpeg',
          0.9
        );
      };
      if (event.target?.result) img.src = event.target.result as string;
    };
    reader.readAsDataURL(file);
  };

  // handleSubmit tetap sama
  const handleSubmit = async () => {
    if (!location || !photoFile) {
      alert('Lokasi dan foto harus diisi!');
      return;
    }
    setSubmitLoading(true);
    setSubmitStatus({ message: '', type: '' });
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      setSubmitStatus({ message: '✗ Gagal: Anda belum login atau sesi telah habis.', type: 'error' });
      setSubmitLoading(false);
      return;
    }
    try {
      const formData = new FormData();
      formData.append('photo', photoFile);
      formData.append('latitude', location.latitude.toString());
      formData.append('longitude', location.longitude.toString());
      formData.append('accuracy', location.accuracy.toString());
      formData.append('address', location.address.full || '');
      const response = await fetch('http://localhost:8080/api/attendance', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Gagal mengirim absensi.');
      }
      setSubmitStatus({ message: '✓ Absensi berhasil disimpan!', type: 'success' });
      setTimeout(() => {
        setLocation(null);
        setPhotoFile(null);
        setPhotoPreview('');
        setSubmitStatus({ message: '', type: '' });
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 2000);
    } catch (error: any) {
      setSubmitStatus({ message: `✗ Gagal: ${error.message}`, type: 'error' });
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {!location && (
        <button
          onClick={getLocation}
          disabled={loading}
          className="w-full flex justify-center items-center gap-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-transform transform active:scale-95"
        >
          {loading ? <Spinner /> : <MapPin size={20} />}
          {loading ? 'Mencari Lokasi...' : 'Ambil Lokasi Saat Ini'}
        </button>
      )}

      {location && (
        <div className="bg-blue-50 border-l-4 border-blue-400 rounded-r-lg p-4 space-y-2">
          <h4 className="font-bold text-blue-800">Lokasi Terdeteksi</h4>
          <p className="text-sm text-gray-700">{location.address.full || 'Alamat tidak ditemukan'}</p>
          <p className="text-xs text-gray-500">Akurasi: ~{Math.round(location.accuracy)} meter</p>
        </div>
      )}

      {location && (
        <div className="space-y-3">
          <label className="block font-semibold text-gray-700 flex items-center gap-2">
            <Camera size={20} /> Bukti Foto
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            {photoPreview ? <img src={photoPreview} alt="Preview" className="w-full h-auto max-h-72 object-contain rounded-lg mb-4" /> : <p className="text-gray-500">Ambil atau pilih foto pekerjaan Anda.</p>}
            <button onClick={() => fileInputRef.current?.click()} className="mt-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg">
              {photoPreview ? 'Ganti Foto' : 'Pilih Foto'}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoSelect} className="hidden" />
          </div>
        </div>
      )}

      {location && photoFile && (
        <button
          onClick={handleSubmit}
          disabled={submitLoading}
          className="w-full flex justify-center items-center gap-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-transform transform active:scale-95"
        >
          {submitLoading ? <Spinner /> : <Check size={20} />}
          {submitLoading ? 'Mengirim...' : 'Submit Absensi'}
        </button>
      )}

      {submitStatus.message && <div className={`p-4 rounded-lg text-center font-semibold ${submitStatus.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{submitStatus.message}</div>}
    </div>
  );
}
