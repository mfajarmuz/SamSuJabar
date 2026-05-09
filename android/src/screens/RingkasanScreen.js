import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  TouchableOpacity, ScrollView, Alert,
} from 'react-native';
import { getLaporan } from '../api';
import { formatRupiah } from '../utils/format';

export default function RingkasanScreen({ route, navigation }) {
  const { laporan_id, errors = [], manualData = {} } = route.params;
  const [laporan, setLaporan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLaporan(laporan_id)
      .then(setLaporan)
      .catch(err => Alert.alert('Error', err.message))
      .finally(() => setLoading(false));
  }, [laporan_id]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#1565C0" /></View>;
  }

  if (!laporan) {
    return <View style={styles.center}><Text>Data tidak ditemukan</Text></View>;
  }

  const jenis = laporan.jenis_summary || {};
  const r2 = jenis['R01'] || 0;
  const totalWp = Object.values(jenis).reduce((s, n) => s + n, 0);
  const r4 = totalWp - r2;
  const sts = laporan.sts || {};
  const rekap = laporan.rekap || {
    total_pkb: sts.provinsi || 0,
    total_swdkllj: sts.jasa_raharja || 0,
    total_adm: sts.polda || 0,
    grand_total: (sts.provinsi || 0) + (sts.jasa_raharja || 0) + (sts.polda || 0) + (sts.kab_kota || 0),
  };
  const opsen = sts['kab_kota'] || 0;

  const outletRaw = laporan.outlets?.nama || '';
  const outlet_nama = outletRaw.replace(/^Outlet\s+/i, '');

  function goToWhatsApp() {
    navigation.navigate('WhatsApp', {
      outlet_nama,
      tanggal: laporan.tanggal,
      jenis_summary: jenis,
      rekap,
      sts,
      potensi: laporan.potensi || null,
      kabkota: laporan.kabkota || [],
      manualData,
    });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <View style={styles.successBanner}>
        <Text style={styles.successIcon}>✓</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.successTitle}>{outletRaw}</Text>
          <Text style={styles.successSub}>{laporan.tanggal}</Text>
        </View>
      </View>

      {errors.length > 0 && (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>⚠️ Sebagian file gagal diproses:</Text>
          {errors.map((e, i) => (
            <Text key={i} style={styles.errorItem}>• {e.error}</Text>
          ))}
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Jumlah WP</Text>
        <View style={styles.wpRow}>
          <View style={styles.wpBox}>
            <Text style={styles.wpNum}>{r2}</Text>
            <Text style={styles.wpLabel}>R.2</Text>
          </View>
          <View style={styles.wpBox}>
            <Text style={styles.wpNum}>{r4}</Text>
            <Text style={styles.wpLabel}>R.4 & Lainnya</Text>
          </View>
        </View>
        <View style={[styles.wpBox, styles.wpTotal]}>
          <Text style={[styles.wpNum, { color: '#1565C0' }]}>{totalWp}</Text>
          <Text style={styles.wpLabel}>Total WP</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Penerimaan</Text>
        {[
          ['PKB', rekap.total_pkb],
          ['Opsen PKB', opsen],
          ['SWDKLLJ', rekap.total_swdkllj],
          ['ADM', rekap.total_adm],
        ].map(([label, val]) => (
          <View key={label} style={styles.row}>
            <Text style={styles.rowLabel}>{label}</Text>
            <Text style={styles.rowValue}>Rp {formatRupiah(val)}</Text>
          </View>
        ))}
        <View style={styles.rowTotal}>
          <Text style={styles.rowLabelBold}>Total Setoran</Text>
          <Text style={styles.rowValueBold}>Rp {formatRupiah(rekap.grand_total)}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.waBtn} onPress={goToWhatsApp}>
        <Text style={styles.waBtnText}>Buat Laporan WhatsApp</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F9' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  successBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#E8F5E9', borderRadius: 12,
    borderLeftWidth: 4, borderLeftColor: '#2E7D32',
    padding: 14, marginBottom: 16,
  },
  successIcon: { fontSize: 20, color: '#2E7D32', marginRight: 12, fontWeight: '700' },
  successTitle: { fontSize: 16, fontWeight: '700', color: '#1B5E20' },
  successSub: { fontSize: 13, color: '#388E3C', marginTop: 2 },
  errorBox: {
    backgroundColor: '#FFF3E0', borderRadius: 8,
    padding: 12, marginBottom: 16,
  },
  errorTitle: { fontWeight: '600', marginBottom: 4, color: '#E65100' },
  errorItem: { fontSize: 12, color: '#E65100' },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 12,
    padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  cardTitle: {
    fontSize: 11, fontWeight: '700', color: '#616E7C',
    marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1.2,
  },
  wpRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  wpBox: {
    flex: 1, backgroundColor: '#F0F7FF', borderRadius: 10,
    padding: 12, alignItems: 'center',
  },
  wpTotal: { backgroundColor: '#BBDEFB' },
  wpNum: { fontSize: 32, fontWeight: '800', color: '#1A1A2E' },
  wpLabel: { fontSize: 11, color: '#616E7C', marginTop: 2 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  rowLabel: { fontSize: 15, color: '#616E7C' },
  rowValue: { fontSize: 15, color: '#1A1A2E' },
  rowTotal: {
    flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: '#FFF8E1', borderRadius: 8,
    paddingVertical: 10, paddingHorizontal: 8, marginTop: 8,
  },
  rowLabelBold: { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
  rowValueBold: { fontSize: 15, fontWeight: '700', color: '#E65100' },
  waBtn: {
    backgroundColor: '#25D366', height: 52,
    borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    marginTop: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 4, elevation: 2,
  },
  waBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
