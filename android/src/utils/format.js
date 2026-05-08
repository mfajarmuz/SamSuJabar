// src/utils/format.js

export function formatRupiah(angka) {
  if (!angka && angka !== 0) return '0';
  return angka.toLocaleString('id-ID');
}

export function formatTanggal(isoDate) {
  const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const d = new Date(isoDate.slice(0, 10) + 'T00:00:00');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${HARI[d.getDay()]}, ${dd} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
}
