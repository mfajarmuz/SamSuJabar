import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { formatWhatsAppText } from '../utils/whatsapp';
import { colors, radius, shadows, spacing, typography } from '../theme';

export default function WhatsAppScreen({ route, navigation }) {
  const params = route.params ?? {};
  const { outlet_nama, tanggal, jenis_summary, rekap, sts, potensi, kabkota, manualData } = params;

  const teks = useMemo(
    () => formatWhatsAppText(params),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [outlet_nama, tanggal, jenis_summary, rekap, sts, potensi, kabkota, manualData]
  );

  const lineCount = useMemo(() => teks.split('\n').length, [teks]);

  async function salinTeks() {
    try {
      await Clipboard.setStringAsync(teks);
      Alert.alert('Tersalin', 'Teks laporan berhasil disalin ke clipboard.');
    } catch (err) {
      Alert.alert('Error', 'Gagal menyalin ke clipboard');
    }
  }

  async function bukaWhatsApp() {
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

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.heroCard}>
          <Text style={styles.overline}>Langkah 3 · Kirim WhatsApp</Text>
          <Text style={styles.heroTitle}>Teks laporan siap disalin atau dikirim ke WhatsApp</Text>
          <Text style={styles.heroSubtitle}>
            Periksa isi pesan, lalu salin atau kirim langsung ke WhatsApp.
          </Text>
        </View>

        <View style={styles.metaCard}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Outlet</Text>
            <Text style={styles.metaValue}>{outlet_nama || '-'}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Tanggal</Text>
            <Text style={styles.metaValue}>{tanggal || '-'}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Jumlah baris</Text>
            <Text style={styles.metaValue}>{lineCount} baris</Text>
          </View>
        </View>

        <View style={styles.previewHeader}>
          <View>
            <Text style={styles.previewTitle}>Preview Pesan</Text>
            <Text style={styles.previewCaption}>Ini adalah teks akhir yang akan dikirim ke WhatsApp.</Text>
          </View>
          <TouchableOpacity style={styles.inlineCopyButton} onPress={salinTeks} activeOpacity={0.9}>
            <Text style={styles.inlineCopyButtonText}>Salin</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.previewCard}>
          <ScrollView nestedScrollEnabled contentContainerStyle={styles.previewInner}>
            <Text style={styles.previewText}>{teks}</Text>
          </ScrollView>
        </View>

        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>Checklist sebelum kirim</Text>
          <Text style={styles.tipItem}>• Pastikan outlet dan tanggal sudah benar</Text>
          <Text style={styles.tipItem}>• Cek total setoran dan jumlah WP</Text>
          <Text style={styles.tipItem}>• Jika perlu, salin dulu untuk review sebelum buka WhatsApp</Text>
        </View>
      </ScrollView>

      <View style={styles.footerActionBar}>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()} activeOpacity={0.9}>
          <Text style={styles.secondaryButtonText}>Kembali</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryButton} onPress={bukaWhatsApp} activeOpacity={0.9}>
          <Text style={styles.primaryButtonText}>Buka WhatsApp</Text>
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
  heroCard: {
    backgroundColor: colors.whatsapp,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  overline: {
    ...typography.overline,
    color: '#DCFCE7',
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
    color: '#DCFCE7',
  },
  metaCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  metaRow: {
    minHeight: 44,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm,
  },
  metaLabel: {
    ...typography.body,
    color: colors.textMuted,
  },
  metaValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: spacing.md,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  previewTitle: {
    ...typography.title,
    color: colors.text,
    fontSize: 18,
    marginBottom: 2,
  },
  previewCaption: {
    ...typography.bodySm,
    color: colors.textSoft,
  },
  inlineCopyButton: {
    minHeight: 40,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineCopyButtonText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  previewCard: {
    minHeight: 360,
    maxHeight: 520,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  previewInner: {
    padding: spacing.lg,
    backgroundColor: '#DCF8C6',
    flexGrow: 1,
  },
  previewText: {
    fontFamily: 'monospace',
    fontSize: 14,
    lineHeight: 22,
    color: '#14532D',
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
    flex: 1.3,
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
