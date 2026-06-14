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
import { colors, radius, shadows, spacing, typography } from '../theme';

function QuickStat({ label, value, tone = 'default' }) {
  const tones = {
    default: { bg: colors.surfaceMuted, text: colors.text },
    accent: { bg: colors.accentSoft, text: colors.accent },
    success: { bg: colors.successSoft, text: colors.success },
  };

  const selected = tones[tone] || tones.default;

  return (
    <View style={[styles.quickStatCard, { backgroundColor: selected.bg }]}> 
      <Text style={styles.quickStatLabel}>{label}</Text>
      <Text style={[styles.quickStatValue, { color: selected.text }]}>{value}</Text>
    </View>
  );
}

function BreakdownRow({ label, value, bold = false }) {
  return (
    <View style={[styles.breakdownRow, bold && styles.breakdownRowTotal]}>
      <Text style={[styles.breakdownLabel, bold && styles.breakdownLabelTotal]}>{label}</Text>
      <Text style={[styles.breakdownValue, bold && styles.breakdownValueTotal]}>
        Rp {formatRupiah(value)}
      </Text>
    </View>
  );
}

export default function RingkasanScreen({ route, navigation }) {
  const { laporan_id, errors = [], manualData = {} } = route.params ?? {};
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
        if (mounted) setLaporan(data);
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
  }, [laporan_id]);

  const summary = useMemo(() => {
    if (!laporan) return null;

    const jenis = laporan.jenis_summary || {};
    const r2 = jenis.R01 || 0;
    const totalWp = Object.values(jenis).reduce((s, n) => s + n, 0);
    const r4 = Math.max(0, totalWp - r2);
    const sts = laporan.sts || {};
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
      sts,
      rekap,
      opsen,
      outletRaw,
      outletNama,
      isComplete: laporan.status === 'complete',
      hasSam: Boolean(laporan.sam_file),
      hasSts: Boolean(laporan.sts_file),
      tanggal: laporan.tanggal,
    };
  }, [laporan]);

  function goToWhatsApp() {
    if (!laporan || !summary) return;

    navigation.navigate('WhatsApp', {
      outlet_nama: summary.outletNama,
      tanggal: laporan.tanggal,
      jenis_summary: summary.jenis,
      rekap: summary.rekap,
      sts: summary.sts,
      potensi: laporan.potensi || null,
      kabkota: laporan.kabkota || [],
      manualData,
    });
  }

  if (loading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.centerTitle}>Memuat ringkasan laporan</Text>
        <Text style={styles.centerSubtitle}>Menyiapkan hasil hitung sebelum dikirim ke WhatsApp.</Text>
      </View>
    );
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
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroTextWrap}>
            <Text style={styles.overline}>Langkah 2 · Cek Hasil</Text>
            <Text style={styles.heroTitle}>{summary.outletRaw}</Text>
            <Text style={styles.heroSubtitle}>{formatTanggal(summary.tanggal)}</Text>
          </View>
          <View style={[styles.statusChip, summary.isComplete ? styles.statusChipSuccess : styles.statusChipWarning]}>
            <Text style={[styles.statusChipText, { color: summary.isComplete ? colors.success : colors.warning }]}>
              {summary.isComplete ? 'Siap dikirim' : 'Perlu cek'}
            </Text>
          </View>
        </View>

        <Text style={styles.heroLabel}>Total Setoran</Text>
        <Text style={styles.heroValue}>Rp {formatRupiah(summary.rekap.grand_total)}</Text>
        <Text style={styles.heroHelper}>Pastikan angka utama ini sudah sesuai sebelum membuat teks WhatsApp.</Text>
      </View>

      {errors.length > 0 && (
        <View style={styles.alertCard}>
          <Text style={styles.alertTitle}>Ada file yang tidak ikut diproses</Text>
          {errors.map((e, i) => (
            <Text key={i} style={styles.alertItem}>• {e.error}</Text>
          ))}
        </View>
      )}

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Cek Cepat</Text>
          <Text style={styles.sectionCaption}>3 angka utama yang paling sering diverifikasi petugas</Text>
        </View>
        <View style={styles.quickStatGrid}>
          <QuickStat label="R.2" value={summary.r2} tone="accent" />
          <QuickStat label="R.4 & lainnya" value={summary.r4} />
          <QuickStat label="Total WP" value={summary.totalWp} tone="success" />
        </View>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Rincian Setoran</Text>
          <Text style={styles.sectionCaption}>Komponen yang akan muncul di laporan akhir</Text>
        </View>
        <BreakdownRow label="PKB" value={summary.rekap.total_pkb} />
        <BreakdownRow label="Opsen PKB" value={summary.opsen} />
        <BreakdownRow label="SWDKLLJ" value={summary.rekap.total_swdkllj} />
        <BreakdownRow label="ADM" value={summary.rekap.total_adm} />
        <BreakdownRow label="Total Setoran" value={summary.rekap.grand_total} bold />
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Status File</Text>
          <Text style={styles.sectionCaption}>Pastikan file sumber sudah lengkap</Text>
        </View>
        <View style={styles.statusMiniRow}>
          <Text style={styles.statusMiniLabel}>SAM</Text>
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

      <View style={styles.actionStack}>
        <TouchableOpacity style={styles.primaryButton} onPress={goToWhatsApp} activeOpacity={0.9}>
          <Text style={styles.primaryButtonText}>Lanjut ke Teks WhatsApp</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()} activeOpacity={0.9}>
          <Text style={styles.secondaryButtonText}>Kembali ke Upload</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
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
  alertCard: {
    backgroundColor: colors.warningSoft,
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  alertTitle: {
    ...typography.body,
    color: colors.warning,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  alertItem: {
    ...typography.bodySm,
    color: colors.warning,
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
  actionStack: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: radius.md,
    backgroundColor: colors.whatsapp,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '700',
  },
});
