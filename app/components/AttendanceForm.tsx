// FILE: app/components/AttendanceForm.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import ExifReader from 'exifreader';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  address?: string;
}

interface SecurityCheck {
  passed: boolean;
  message: string;
  level: 'success' | 'warning' | 'error';
}

export default function AttendanceForm() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [securityChecks, setSecurityChecks] = useState<SecurityCheck[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [photoMetadata, setPhotoMetadata] = useState<any>(null);
  const [submitStatus, setSubmitStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    performSecurityChecks();
  }, []);

  const performSecurityChecks = () => {
    const checks: SecurityCheck[] = [];

    // Check 1: Developer tools detection
    const devToolsOpen = window.outerWidth - window.innerWidth > 160 || window.outerHeight - window.innerHeight > 160;

    checks.push({
      passed: !devToolsOpen,
      message: devToolsOpen ? '⚠️ Developer tools terdeteksi terbuka' : '✓ Developer tools tidak aktif',
      level: devToolsOpen ? 'warning' : 'success',
    });

    // Check 2: Geolocation API availability
    checks.push({
      passed: 'geolocation' in navigator,
      message: 'geolocation' in navigator ? '✓ GPS tersedia' : '✗ GPS tidak tersedia di browser ini',
      level: 'geolocation' in navigator ? 'success' : 'error',
    });

    // Check 3: Secure context (HTTPS)
    const isSecure = window.isSecureContext;
    checks.push({
      passed: isSecure,
      message: isSecure ? '✓ Koneksi aman (HTTPS)' : '⚠️ Koneksi tidak aman (HTTP)',
      level: isSecure ? 'success' : 'warning',
    });

    // Check 4: Check if running in iframe (possible attack)
    const inIframe = window.self !== window.top;
    checks.push({
      passed: !inIframe,
      message: inIframe ? '⚠️ Aplikasi berjalan dalam iframe' : '✓ Aplikasi berjalan normal',
      level: inIframe ? 'warning' : 'success',
    });

    setSecurityChecks(checks);
  };

  const getLocation = async () => {
    setLoading(true);
    setSubmitStatus('');

    try {
      if (!navigator.geolocation) {
        throw new Error('GPS tidak didukung di browser ini');
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const locationData: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
      };

      // Reverse geocoding untuk mendapatkan alamat
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${locationData.latitude}&lon=${locationData.longitude}`);
        const data = await response.json();
        locationData.address = data.display_name;
      } catch (error) {
        console.error('Gagal mendapatkan alamat:', error);
      }

      setLocation(locationData);

      // Validasi akurasi GPS
      if (locationData.accuracy > 50) {
        alert(`⚠️ Akurasi GPS rendah (${Math.round(locationData.accuracy)}m). ` + 'Pastikan GPS aktif dan Anda berada di area terbuka.');
      }
    } catch (error: any) {
      alert('Gagal mendapatkan lokasi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));

    // Extract EXIF data
    try {
      const tags = await ExifReader.load(file);

      const metadata: any = {
        dateTime: tags.DateTime?.description || 'Tidak tersedia',
        make: tags.Make?.description || 'Tidak tersedia',
        model: tags.Model?.description || 'Tidak tersedia',
        gps: null,
      };

      // Extract GPS data
      if (tags.GPSLatitude && tags.GPSLongitude) {
        const lat = tags.GPSLatitude.description;
        const lon = tags.GPSLongitude.description;
        metadata.gps = {
          latitude: lat,
          longitude: lon,
        };
      }

      setPhotoMetadata(metadata);

      // Validasi: cek apakah GPS foto sesuai dengan lokasi saat ini
      if (metadata.gps && location) {
        const distance = calculateDistance(location.latitude, location.longitude, parseFloat(metadata.gps.latitude), parseFloat(metadata.gps.longitude));

        if (distance > 0.1) {
          // lebih dari 100 meter
          alert(`⚠️ PERINGATAN: Lokasi foto berbeda ${Math.round(distance * 1000)}m dari lokasi Anda saat ini. ` + 'Foto mungkin tidak diambil di lokasi ini!');
        }
      }
    } catch (error) {
      console.error('Gagal membaca EXIF:', error);
      setPhotoMetadata({ error: 'Tidak ada metadata EXIF' });
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius bumi dalam km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const toRad = (deg: number) => deg * (Math.PI / 180);

  const handleSubmit = async () => {
    if (!location) {
      alert('Silakan ambil lokasi terlebih dahulu!');
      return;
    }

    if (!photoFile) {
      alert('Silakan upload foto bukti kerja!');
      return;
    }

    // Check security issues
    const hasError = securityChecks.some((check) => !check.passed && check.level === 'error');
    if (hasError) {
      alert('Tidak dapat submit karena ada masalah keamanan!');
      return;
    }

    setLoading(true);
    setSubmitStatus('');

    try {
      const formData = new FormData();
      formData.append('photo', photoFile);
      formData.append('latitude', location.latitude.toString());
      formData.append('longitude', location.longitude.toString());
      formData.append('accuracy', location.accuracy.toString());
      formData.append('timestamp', location.timestamp.toString());
      formData.append('address', location.address || '');
      formData.append('photoMetadata', JSON.stringify(photoMetadata));
      formData.append('securityChecks', JSON.stringify(securityChecks));

      // Kirim ke backend (ganti dengan URL backend Anda)
      const response = await fetch('http://localhost:8080/api/attendance', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Gagal submit absensi');
      }

      const result = await response.json();
      setSubmitStatus('✓ Absensi berhasil disimpan!');

      // Reset form
      setTimeout(() => {
        setLocation(null);
        setPhotoFile(null);
        setPhotoPreview('');
        setPhotoMetadata(null);
        setSubmitStatus('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 2000);
    } catch (error: any) {
      setSubmitStatus('✗ Gagal submit: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Security Checks */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold mb-3 text-gray-700">🔒 Pemeriksaan Keamanan</h3>
        <div className="space-y-2">
          {securityChecks.map((check, idx) => (
            <div key={idx} className={`text-sm p-2 rounded ${check.level === 'success' ? 'bg-green-100 text-green-800' : check.level === 'warning' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
              {check.message}
            </div>
          ))}
        </div>
      </div>

      {/* Get Location */}
      <div>
        <button onClick={getLocation} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
          {loading ? '⏳ Mengambil Lokasi...' : '📍 Ambil Lokasi Saya'}
        </button>

        {location && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 mb-2">✓ Lokasi Terdeteksi</h4>
            <div className="text-sm space-y-1 text-gray-700">
              <p>
                <strong>Latitude:</strong> {location.latitude.toFixed(6)}
              </p>
              <p>
                <strong>Longitude:</strong> {location.longitude.toFixed(6)}
              </p>
              <p>
                <strong>Akurasi:</strong> {Math.round(location.accuracy)} meter
              </p>
              {location.address && (
                <p>
                  <strong>Alamat:</strong> {location.address}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-2">Waktu: {new Date(location.timestamp).toLocaleString('id-ID')}</p>
            </div>
          </div>
        )}
      </div>

      {/* Upload Photo */}
      {location && (
        <div>
          <label className="block mb-2 font-semibold text-gray-700">📸 Upload Foto Bukti Kerja</label>
          <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoSelect} className="w-full border border-gray-300 rounded-lg p-2" />

          {photoPreview && (
            <div className="mt-4">
              <img src={photoPreview} alt="Preview" className="w-full max-h-64 object-contain rounded-lg border" />

              {photoMetadata && (
                <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                  <h5 className="font-semibold text-blue-800 mb-2">📊 Metadata Foto</h5>
                  {photoMetadata.error ? (
                    <p className="text-red-600">{photoMetadata.error}</p>
                  ) : (
                    <div className="space-y-1 text-gray-700">
                      <p>
                        <strong>Waktu:</strong> {photoMetadata.dateTime}
                      </p>
                      <p>
                        <strong>Device:</strong> {photoMetadata.make} {photoMetadata.model}
                      </p>
                      {photoMetadata.gps && (
                        <div className="mt-2 p-2 bg-white rounded">
                          <p className="font-semibold text-green-600">✓ GPS Foto:</p>
                          <p>Lat: {photoMetadata.gps.latitude}</p>
                          <p>Lon: {photoMetadata.gps.longitude}</p>
                        </div>
                      )}
                      {!photoMetadata.gps && <p className="text-yellow-600 mt-2">⚠️ Foto tidak memiliki data GPS</p>}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Submit Button */}
      {location && photoFile && (
        <button onClick={handleSubmit} disabled={loading} className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
          {loading ? '⏳ Mengirim...' : '✓ Submit Absensi'}
        </button>
      )}

      {/* Status Message */}
      {submitStatus && <div className={`p-4 rounded-lg text-center font-semibold ${submitStatus.includes('✓') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{submitStatus}</div>}
    </div>
  );
}
