import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { getLaporan } from '../api';
import { formatRupiah, formatTanggal } from '../utils/format';
import { formatWhatsAppText } from '../utils/whatsapp';
import * as Clipboard from 'expo-clipboard';
import { Linking } from 'react-native';
import { colors, radius, shadows, spacing, typography } from '../theme';

function QuickStat({ label, value, tone = 'default' }) {
  const tones = {
    default: { bg: colors.surfaceMuted, text: colors.text },
    accent: { bg: colors.accentSoft, text: colors.accent },
    success: { bg: colors.successSoft, text: colors.success },
    warning: { bg: colors.warningSoft, text: colors.warning },
  };

  const selected = tones[tone] || tones.default;

  return (
    <View style={[styles.quickStatCard, { backgroundColor: selected.bg }]}> 
      <Text style={styles.quickStatLabel}>{label}</Text>
      <Text style={[styles.quickStatValue, { color: selected.text }]}>{value}</Text>
    </View>
  );
}

function BreakdownRow({ label, value, highlight = false }) {
  return (
    <View style={[styles.breakdownRow, highlight && styles.breakdownRowTotal]}>
      <Text style={[styles.breakdownLabel, highlight && styles.breakdownLabelTotal]}>{label}</Text>
      <Text style={[styles.breakdownValue, highlight && styles.breakdownValueTotal]}>
        Rp {formatRupiah(value)}
      </Text>
    </View>
  );
}

export default function RiwayatDetailScreen({ route, navigation }) {
  const { laporan_id } = route.params ?? {};
  const [laporan, setLaporan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!laporan_id) {
      setLoading(false);
      return;
    }

    let mounted = true;

    getLaporan(laporan_id)
      .then(data => {
        if (!mounted) return;
        setLaporan(data);
        const nama = data?.outlets?.nama || 'Detail Laporan';
        navigation.setOptions({ title: nama });
      })
      .catch(err => {
        if (mounted) Alert.alert('Error', err.message);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [laporan_id, navigation]);

  const summary = useMemo(() => {
    if (!laporan) return null;

    const jenis = laporan.jenis_summary || {};
    const r2 = jenis.R01 || 0;
    const totalWp = Object.values(jenis).reduce((s, n) => s + n, 0);
    const r4 = Math.max(0, totalWp - r2);

    const potensiSummary = laporan.potensi_summary || jenis;
    const potensiR2 = potensiSummary.R01 || 0;
    const potensiTotalWp = Object.values(potensiSummary).reduce((s, n) => s + n, 0);
    const potensiR4 = Math.max(0, potensiTotalWp - potensiR2);

    const luarTotalWp = Math.max(0, totalWp - potensiTotalWp);
    const luarR2 = Math.max(0, r2 - potensiR2);
    const luarR4 = Math.max(0, r4 - potensiR4);

    const sts = laporan.sts || {};
    const hasRekapOrSts = Boolean(
      laporan.rekap || sts.provinsi || sts.jasa_raharja || sts.polda || sts.kab_kota
    );
    const rekap = laporan.rekap || {
      total_pkb: sts.provinsi || 0,
      total_swdkllj: sts.jasa_raharja || 0,
      total_adm: sts.polda || 0,
      grand_total:
        (sts.provinsi || 0) +
        (sts.jasa_raharja || 0) +
        (sts.polda || 0) +
        (sts.kab_kota || 0),
    };
    const opsen = sts.kab_kota || 0;

    const outletRaw = laporan.outlets?.nama || 'Outlet Tidak Diketahui';
    const outletNama = outletRaw.replace(/^Outlet\s+/i, '');

    return {
      jenis,
      r2,
      r4,
      totalWp,
      potensiR2,
      potensiR4,
      potensiTotalWp,
      luarTotalWp,
      luarR2,
      luarR4,
      sts,
      rekap,
      opsen,
      hasRekapOrSts,
      outletRaw,
      outletNama,
      isComplete: laporan.status === 'complete',
      hasSam: Boolean(laporan.sam_file),
      hasSts: Boolean(laporan.sts_file),
    };
  }, [laporan]);

  async function salinLaporan() {
    if (!laporan || !summary) return;

    const teks = formatWhatsAppText({
      outlet_nama: summary.outletNama,
      tanggal: laporan.tanggal,
      jenis_summary: summary.jenis,
      rekap: summary.rekap,
      sts: summary.sts,
      potensi: laporan.potensi || null,
      kabkota: laporan.kabkota || [],
    });

    try {
      await Clipboard.setStringAsync(teks);
      Alert.alert('Tersalin', 'Teks laporan berhasil disalin ke clipboard.');
    } catch (err) {
      Alert.alert('Error', 'Gagal menyalin ke clipboard');
    }
  }
  async function bukaWhatsApp() {
    if (!laporan || !summary) return;

    const teks = formatWhatsAppMessage({
      outlet: laporan.outlet || '-',
      tanggal: laporan.tanggal || '-',
      samsat: summary.samsat,
      stnk: summary.stnk,
      total: summary.total,
      grand_total: summary.grand_total,
      denda: summary.denda,
      jumlah_wp: summary.jumlah_wp,
    });

    const appUrl = `whatsapp://send?text=${encodeURIComponent(teks)}`;
    const webUrl = `https://wa.me/?text=${encodeURIComponent(teks)}`;

    try {
      // On newer Android versions canOpenURL may return false without proper queries,
      // so try opening the WhatsApp scheme directly first.
      await Linking.openURL(appUrl);
      return;
    } catch (appError) {
      try {
        await Linking.openURL(webUrl);
        Alert.alert(
          'WhatsApp tidak ditemukan',
          'Aplikasi WhatsApp tidak bisa dibuka langsung. Pesan dibuka lewat browser. Jika tidak nyaman, gunakan tombol Salin untuk kirim manual.'
        );
        return;
      } catch (webError) {
        Alert.alert(
          'WhatsApp tidak tersedia',
          'Aplikasi atau link WhatsApp tidak bisa dibuka di perangkat ini. Gunakan tombol Salin untuk mengirim manual.'
        );
      }
    }
  }

  if (!laporan || !summary) {
    return (
      <View style={styles.centerState}>
        <Text style={styles.centerTitle}>Data tidak ditemukan</Text>
        <Text style={styles.centerSubtitle}>Laporan belum tersedia atau gagal dimuat.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroTextWrap}>
              <Text style={styles.overline}>Riwayat · Detail Laporan</Text>
              <Text style={styles.heroTitle}>{summary.outletRaw}</Text>
              <Text style={styles.heroSubtitle}>{formatTanggal(laporan.tanggal)}</Text>
            </View>
            <View style={[styles.statusChip, summary.isComplete ? styles.statusChipSuccess : styles.statusChipWarning]}>
              <Text style={[styles.statusChipText, { color: summary.isComplete ? colors.success : colors.warning }]}>
                {summary.isComplete ? 'Siap kirim' : 'Perlu cek'}
              </Text>
            </View>
          </View>

          <Text style={styles.heroLabel}>Total Setoran</Text>
          <Text style={styles.heroValue}>Rp {formatRupiah(summary.rekap.grand_total)}</Text>
          <Text style={styles.heroHelper}>Gunakan layar ini untuk cek cepat lalu salin atau kirim ulang teks WhatsApp.</Text>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Cek Cepat</Text>
            <Text style={styles.sectionCaption}>Angka yang paling sering diverifikasi petugas</Text>
          </View>
          <View style={styles.quickStatGrid}>
            <QuickStat label="R.2" value={summary.r2} tone="accent" />
            <QuickStat label="R.4 & lainnya" value={summary.r4} />
            <QuickStat label="Total WP" value={summary.totalWp} tone="success" />
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Status File</Text>
            <Text style={styles.sectionCaption}>Sumber laporan yang tersimpan</Text>
          </View>
          <View style={styles.statusMiniRow}>
            <Text style={styles.statusMiniLabel}>SAM III-2</Text>
            <Text style={[styles.statusMiniValue, { color: summary.hasSam ? colors.success : colors.warning }]}>
              {summary.hasSam ? 'Tersedia' : 'Belum ada'}
            </Text>
          </View>
          <View style={styles.statusMiniRow}>
            <Text style={styles.statusMiniLabel}>STS</Text>
            <Text style={[styles.statusMiniValue, { color: summary.hasSts ? colors.success : colors.warning }]}>
              {summary.hasSts ? 'Tersedia' : 'Belum ada'}
            </Text>
          </View>
        </View>

        {summary.potensiTotalWp > 0 && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>WP Potensi Sukaraja</Text>
              <Text style={styles.sectionCaption}>Rincian lokal yang paling sering dicek</Text>
            </View>
            <View style={styles.quickStatGrid}>
              <QuickStat label="R.2 Potensi" value={summary.potensiR2} tone="accent" />
              <QuickStat label="R.4 Potensi" value={summary.potensiR4} tone="default" />
              <QuickStat label="Total Potensi" value={summary.potensiTotalWp} tone="success" />
            </View>

            {summary.luarTotalWp > 0 && (
              <View style={styles.subSectionWrap}>
                <Text style={styles.subSectionTitle}>Luar Potensi / Titipan</Text>
                <View style={styles.quickStatGrid}>
                  <QuickStat label="R.2 Luar" value={summary.luarR2} tone="warning" />
                  <QuickStat label="R.4 Luar" value={summary.luarR4} tone="warning" />
                  <QuickStat label="Total Luar" value={summary.luarTotalWp} tone="warning" />
                </View>
              </View>
            )}
          </View>
        )}

        {summary.hasRekapOrSts && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Rincian Setoran</Text>
              <Text style={styles.sectionCaption}>Komponen yang akan dipakai untuk kirim ulang laporan</Text>
            </View>
            <BreakdownRow label="PKB" value={summary.rekap.total_pkb} />
            <BreakdownRow label="Opsen PKB" value={summary.opsen} />
            <BreakdownRow label="SWDKLLJ" value={summary.rekap.total_swdkllj} />
            <BreakdownRow label="ADM" value={summary.rekap.total_adm} />
            <BreakdownRow label="Total Setoran" value={summary.rekap.grand_total} highlight />
          </View>
        )}

        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>Gunakan detail ini untuk</Text>
          <Text style={styles.tipItem}>• review laporan lama sebelum dikirim ulang</Text>
          <Text style={styles.tipItem}>• salin ulang teks laporan ke clipboard</Text>
          <Text style={styles.tipItem}>• buka WhatsApp langsung dari data yang sudah tersimpan</Text>
        </View>
      </ScrollView>

      <View style={styles.footerActionBar}>
        <TouchableOpacity style={styles.secondaryButton} onPress={salinLaporan} activeOpacity={0.9}>
          <Text style={styles.secondaryButtonText}>Salin Laporan</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryButton} onPress={bukaWhatsApp} activeOpacity={0.9}>
          <Text style={styles.primaryButtonText}>Kirim Ulang WhatsApp</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: 120,
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.background,
  },
  centerTitle: {
    ...typography.title,
    color: colors.text,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  centerSubtitle: {
    ...typography.body,
    color: colors.textSoft,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  heroTextWrap: {
    flex: 1,
  },
  overline: {
    ...typography.overline,
    color: '#BFDBFE',
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  heroTitle: {
    color: colors.white,
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '800',
    marginBottom: 4,
  },
  heroSubtitle: {
    ...typography.bodySm,
    color: '#CBD5E1',
  },
  statusChip: {
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 36,
    justifyContent: 'center',
  },
  statusChipSuccess: {
    backgroundColor: colors.successSoft,
  },
  statusChipWarning: {
    backgroundColor: colors.warningSoft,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  heroLabel: {
    ...typography.overline,
    color: '#BFDBFE',
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  heroValue: {
    ...typography.hero,
    color: colors.white,
    marginBottom: spacing.sm,
  },
  heroHelper: {
    ...typography.bodySm,
    color: '#CBD5E1',
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  sectionHeader: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.title,
    color: colors.text,
    fontSize: 17,
    marginBottom: 4,
  },
  sectionCaption: {
    ...typography.bodySm,
    color: colors.textSoft,
  },
  quickStatGrid: {
    gap: spacing.sm,
  },
  quickStatCard: {
    borderRadius: radius.md,
    padding: spacing.md,
  },
  quickStatLabel: {
    ...typography.bodySm,
    color: colors.textMuted,
    marginBottom: 6,
  },
  quickStatValue: {
    ...typography.metric,
    fontSize: 28,
    lineHeight: 34,
  },
  statusMiniRow: {
    minHeight: 44,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statusMiniLabel: {
    ...typography.body,
    color: colors.textMuted,
  },
  statusMiniValue: {
    ...typography.body,
    fontWeight: '700',
  },
  subSectionWrap: {
    marginTop: spacing.lg,
  },
  subSectionTitle: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  breakdownRowTotal: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 0,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
  },
  breakdownLabel: {
    ...typography.body,
    color: colors.textMuted,
    flex: 1,
    paddingRight: spacing.md,
  },
  breakdownLabelTotal: {
    color: colors.primary,
    fontWeight: '700',
  },
  breakdownValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  breakdownValueTotal: {
    color: colors.accent,
    fontWeight: '800',
  },
  tipCard: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  tipTitle: {
    ...typography.body,
    color: colors.accent,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  tipItem: {
    ...typography.bodySm,
    color: colors.accent,
    marginBottom: 4,
  },
  footerActionBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  primaryButton: {
    flex: 1.2,
    minHeight: 52,
    borderRadius: radius.md,
    backgroundColor: colors.whatsapp,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
