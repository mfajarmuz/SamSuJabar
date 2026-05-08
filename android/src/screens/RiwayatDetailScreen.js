// src/screens/RiwayatDetailScreen.js
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  TouchableOpacity, ScrollView, Alert,
} from 'react-native';
import { getLaporan } from '../api';
import { formatRupiah, formatTanggal } from '../utils/format';
import { formatWhatsAppText } from '../utils/whatsapp';
import * as Clipboard from 'expo-clipboard';
import { Linking } from 'react-native';

export default function RiwayatDetailScreen({ route, navigation }) {
  const { laporan_id } = route.params;
  const [laporan, setLaporan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLaporan(laporan_id)
      .then(data => {
        setLaporan(data);
        // Set title header ke nama outlet
        const nama = data?.outlets?.nama || 'Detail Laporan';
        navigation.setOptions({ title: nama });
      })
      .catch(err => Alert.alert('Error', err.message))
      .finally(() => setLoading(false));
  }, [laporan_id, navigation]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#1565C0" /></View>;
  }

  if (!laporan) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Data tidak ditemukan</Text>
      </View>
    );
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

  const isComplete = laporan.status === 'complete';

  async function salinLaporan() {
    const teks = formatWhatsAppText({
      outlet_nama,
      tanggal: laporan.tanggal,
      jenis_summary: jenis,
      rekap,
      sts,
      potensi: laporan.potensi || null,
      kabkota: laporan.kabkota || [],
    });
    await Clipboard.setStringAsync(teks);
    Alert.alert('Tersalin!', 'Teks laporan berhasil disalin ke clipboard');
  }

  function bukaWhatsApp() {
    const teks = formatWhatsAppText({
      outlet_nama,
      tanggal: laporan.tanggal,
      jenis_summary: jenis,
      rekap,
      sts,
      potensi: laporan.potensi || null,
      kabkota: laporan.kabkota || [],
    });
    const url = `whatsapp://send?text=${encodeURIComponent(teks)}`;
    Linking.canOpenURL(url).then(supported => {
      if (!supported) {
        Alert.alert('Error', 'WhatsApp tidak terinstall di perangkat ini');
        return;
      }
      Linking.openURL(url);
    });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      {/* Header info */}
      <View style={styles.headerCard}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerOutlet}>{outletRaw}</Text>
          <Text style={styles.headerTanggal}>{formatTanggal(laporan.tanggal)}</Text>
        </View>
        <View style={[styles.statusBadge, isComplete ? styles.statusComplete : styles.statusPartial]}>
          <Text style={[styles.statusText, { color: isComplete ? '#1B5E20' : '#E65100' }]}>
            {isComplete ? '✓ Lengkap' : '⚡ Sebagian'}
          </Text>
        </View>
      </View>

      {/* Status file */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Status File</Text>
        <View style={styles.fileRow}>
          {[
            { label: 'SAM III-2', done: !!laporan.sam_file },
            { label: 'STS', done: !!laporan.sts_file },
          ].map(({ label, done }) => (
            <View key={label} style={[styles.fileBox, done ? styles.fileBoxDone : styles.fileBoxMiss]}>
              <Text style={styles.fileBoxIcon}>{done ? '✓' : '–'}</Text>
              <Text style={[styles.fileBoxLabel, { color: done ? '#2E7D32' : '#9E9E9E' }]}>{label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Jumlah WP */}
      {totalWp > 0 && (
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
      )}

      {/* Penerimaan */}
      {rekap && (
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
      )}

      {/* Tombol WhatsApp (re-send) */}
      <View style={styles.btnRow}>
        <TouchableOpacity style={styles.btnCopy} onPress={salinLaporan}>
          <Text style={styles.btnText}>📋  Salin Laporan</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnWa} onPress={bukaWhatsApp}>
          <Text style={styles.btnText}>💬  Kirim WA</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F9' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFound: { fontSize: 15, color: '#616E7C' },

  // Header card
  headerCard: {
    backgroundColor: '#1565C0', borderRadius: 14,
    padding: 18, marginBottom: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerLeft: { flex: 1, marginRight: 12 },
  headerOutlet: { fontSize: 18, fontWeight: '800', color: '#FFFFFF', marginBottom: 3 },
  headerTanggal: { fontSize: 13, color: '#BBDEFB' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusComplete: { backgroundColor: '#E8F5E9' },
  statusPartial: { backgroundColor: '#FFF3E0' },
  statusText: { fontSize: 11, fontWeight: '700' },

  // File status
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 14,
    padding: 16, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  cardTitle: {
    fontSize: 11, fontWeight: '700', color: '#616E7C',
    marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1.2,
  },
  fileRow: { flexDirection: 'row', gap: 10 },
  fileBox: {
    flex: 1, borderRadius: 10, padding: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  fileBoxDone: { backgroundColor: '#E8F5E9' },
  fileBoxMiss: { backgroundColor: '#F5F5F5' },
  fileBoxIcon: { fontSize: 18, marginBottom: 4 },
  fileBoxLabel: { fontSize: 11, fontWeight: '600' },

  // WP
  wpRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  wpBox: {
    flex: 1, backgroundColor: '#F0F7FF', borderRadius: 10,
    padding: 12, alignItems: 'center',
  },
  wpTotal: { backgroundColor: '#BBDEFB' },
  wpNum: { fontSize: 30, fontWeight: '800', color: '#1A1A2E' },
  wpLabel: { fontSize: 11, color: '#616E7C', marginTop: 2 },

  // Penerimaan rows
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

  // Buttons
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 4, marginBottom: 8 },
  btnCopy: {
    flex: 1, backgroundColor: '#455A64', height: 52,
    borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    elevation: 2,
  },
  btnWa: {
    flex: 1, backgroundColor: '#25D366', height: 52,
    borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    elevation: 2,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
