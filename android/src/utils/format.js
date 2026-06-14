// src/utils/format.js

export function formatRupiah(angka) {
  // FIX: Handle null, undefined, NaN, and string inputs
  const num = Number(angka);
  if (isNaN(num)) return '0';
  return num.toLocaleString('id-ID');
}

export function formatTanggal(isoDate) {
  // FIX: Handle null/undefined isoDate
  if (!isoDate) return '-';
  const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const d = new Date(isoDate.slice(0, 10) + 'T00:00:00');
  if (isNaN(d.getTime())) return '-';
  const dd = String(d.getDate()).padStart(2, '0');
  return `${HARI[d.getDay()]}, ${dd} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
}
