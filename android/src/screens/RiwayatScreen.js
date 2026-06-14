import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { getLaporanList } from '../api';
import { formatTanggal } from '../utils/format';
import { colors, radius, shadows, spacing, typography } from '../theme';

function StatusChip({ complete }) {
  return (
    <View style={[styles.statusChip, complete ? styles.statusChipSuccess : styles.statusChipWarning]}>
      <Text style={[styles.statusChipText, { color: complete ? colors.success : colors.warning }]}>
        {complete ? 'Lengkap' : 'Sebagian'}
      </Text>
    </View>
  );
}

function FileIndicator({ label, done }) {
  return (
    <View style={[styles.fileIndicator, done ? styles.fileIndicatorDone : styles.fileIndicatorMiss]}>
      <Text style={[styles.fileIndicatorText, { color: done ? colors.success : colors.textSoft }]}>
        {done ? '✓' : '–'} {label}
      </Text>
    </View>
  );
}

function LaporanCard({ item, onPress }) {
  const namaOutlet = item.outlets?.nama || '-';
  const isComplete = item.status === 'complete';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
      <View style={styles.cardTopRow}>
        <View style={styles.cardTextWrap}>
          <Text style={styles.cardTitle} numberOfLines={1}>{namaOutlet}</Text>
          <Text style={styles.cardSubtitle}>{formatTanggal(item.tanggal)}</Text>
        </View>
        <StatusChip complete={isComplete} />
      </View>

      <View style={styles.fileRow}>
        <FileIndicator label="SAM" done={!!item.sam_file} />
        <FileIndicator label="STS" done={!!item.sts_file} />
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.cardFooterText}>
          {isComplete ? 'Siap dibuka atau dikirim ulang ke WhatsApp' : 'Perlu cek file atau data yang belum lengkap'}
        </Text>
        <Text style={styles.cardActionText}>Buka detail</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function RiwayatScreen({ navigation }) {
  const [laporan, setLaporan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (signal) => {
    try {
      setError(null);
      const data = await getLaporanList();
      if (!signal?.aborted) {
        setLaporan(data || []);
      }
    } catch (err) {
      if (!signal?.aborted) {
        setError(err.message || 'Gagal memuat data');
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const summary = useMemo(() => {
    const total = laporan.length;
    const lengkap = laporan.filter(item => item.status === 'complete').length;
    return { total, lengkap, sebagian: total - lengkap };
  }, [laporan]);

  if (loading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.centerTitle}>Memuat riwayat laporan</Text>
        <Text style={styles.centerSubtitle}>Menyiapkan daftar laporan yang sudah pernah diproses.</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerState}>
        <Text style={styles.errorTitle}>Riwayat belum bisa dimuat</Text>
        <Text style={styles.errorSubtitle}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setLoading(true);
            fetchData();
          }}
          activeOpacity={0.9}
        >
          <Text style={styles.retryButtonText}>Coba Lagi</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      data={laporan}
      keyExtractor={(item, index) => item?.id != null ? String(item.id) : `fallback-${index}`}
      contentContainerStyle={styles.listContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.accent]}
          tintColor={colors.accent}
        />
      }
      ListHeaderComponent={
        <View>
          <View style={styles.heroCard}>
            <Text style={styles.overline}>Riwayat Laporan</Text>
            <Text style={styles.heroTitle}>Cari laporan lama dengan cepat</Text>
            <Text style={styles.heroSubtitle}>
              Buka detail untuk cek ulang angka atau kirim ulang teks WhatsApp.
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, { backgroundColor: colors.accentSoft }]}> 
              <Text style={styles.summaryLabel}>Total</Text>
              <Text style={[styles.summaryValue, { color: colors.accent }]}>{summary.total}</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: colors.successSoft }]}> 
              <Text style={styles.summaryLabel}>Lengkap</Text>
              <Text style={[styles.summaryValue, { color: colors.success }]}>{summary.lengkap}</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: colors.warningSoft }]}> 
              <Text style={styles.summaryLabel}>Sebagian</Text>
              <Text style={[styles.summaryValue, { color: colors.warning }]}>{summary.sebagian}</Text>
            </View>
          </View>

          {laporan.length === 0 && (
            <View style={styles.emptyStateBox}>
              <Text style={styles.emptyStateTitle}>Belum ada laporan</Text>
              <Text style={styles.emptyStateText}>Upload PDF di tab Upload untuk mulai membuat laporan.</Text>
            </View>
          )}
        </View>
      }
      renderItem={({ item }) => (
        <LaporanCard
          item={item}
          onPress={() => navigation.navigate('RiwayatDetail', { laporan_id: item.id })}
        />
      )}
      ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    flexGrow: 1,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
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
  errorTitle: {
    ...typography.title,
    color: colors.danger,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  errorSubtitle: {
    ...typography.body,
    color: colors.textSoft,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryButton: {
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  overline: {
    ...typography.overline,
    color: '#BFDBFE',
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  heroTitle: {
    color: colors.white,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    ...typography.body,
    color: '#CBD5E1',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  summaryCard: {
    flex: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  summaryLabel: {
    ...typography.bodySm,
    color: colors.textMuted,
    marginBottom: 6,
  },
  summaryValue: {
    ...typography.metric,
    fontSize: 28,
    lineHeight: 34,
  },
  emptyStateBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    ...shadows.card,
  },
  emptyStateTitle: {
    ...typography.title,
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  emptyStateText: {
    ...typography.body,
    color: colors.textSoft,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  cardTextWrap: {
    flex: 1,
  },
  cardTitle: {
    ...typography.title,
    fontSize: 18,
    color: colors.text,
    marginBottom: 4,
  },
  cardSubtitle: {
    ...typography.bodySm,
    color: colors.textMuted,
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
  fileRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  fileIndicator: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.md,
  },
  fileIndicatorDone: {
    backgroundColor: colors.successSoft,
  },
  fileIndicatorMiss: {
    backgroundColor: colors.surfaceMuted,
  },
  fileIndicatorText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    gap: 6,
  },
  cardFooterText: {
    ...typography.bodySm,
    color: colors.textSoft,
  },
  cardActionText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
  },
});
