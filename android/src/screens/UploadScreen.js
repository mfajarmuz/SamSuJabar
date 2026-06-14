import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { uploadFiles } from '../api';
import { parseFilename } from '../utils/filename';
import { colors, radius, shadows, spacing, typography } from '../theme';

const TYPE_META = {
  sam: { label: 'SAM', color: colors.accent, bg: colors.accentSoft },
  sts: { label: 'STS', color: colors.warning, bg: colors.warningSoft },
};

function buildFileEntry(asset) {
  const parsed = parseFilename(asset.name);
  if (!parsed || (parsed.type !== 'sam' && parsed.type !== 'sts')) {
    return {
      uri: asset.uri,
      name: asset.name,
      valid: false,
      error: 'Nama file tidak dikenali. Gunakan format SAM_III-2_... atau STS_...',
      typeMeta: { label: 'PDF', color: colors.textMuted, bg: colors.surfaceMuted },
    };
  }

  return {
    uri: asset.uri,
    name: asset.name,
    valid: true,
    error: null,
    typeMeta: TYPE_META[parsed.type] || { label: 'PDF', color: colors.textMuted, bg: colors.surfaceMuted },
    meta: parsed,
  };
}

function FileCard({ item, onRemove, disabled }) {
  const statusText = item.valid ? 'Siap diproses' : 'Perlu diganti';
  const metaText = item.valid
    ? `${item.meta?.kode || '-'} • ${item.meta?.tanggal || '-'} • ${item.typeMeta.label}`
    : item.error;

  return (
    <View style={[styles.fileCard, !item.valid && styles.fileCardInvalid]}>
      <View style={styles.fileCardTopRow}>
        <View style={[styles.fileTypeBadge, { backgroundColor: item.typeMeta.bg }]}> 
          <Text style={[styles.fileTypeBadgeText, { color: item.typeMeta.color }]}>{item.typeMeta.label}</Text>
        </View>
        <Text style={[styles.fileStatusText, { color: item.valid ? colors.success : colors.danger }]}>
          {statusText}
        </Text>
      </View>

      <Text style={styles.fileName}>{item.name}</Text>
      <Text style={[styles.fileMeta, !item.valid && { color: colors.danger }]}>{metaText}</Text>

      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => onRemove(item.name)}
        disabled={disabled}
        activeOpacity={0.85}
      >
        <Text style={styles.removeButtonText}>Hapus file</Text>
      </TouchableOpacity>
    </View>
  );
}

function ManualInput({ label, value, onChangeText, placeholder }) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={styles.textInput}
        keyboardType="numeric"
        placeholder={placeholder}
        placeholderTextColor={colors.textSoft}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}

export default function UploadScreen({ navigation }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [potensiR2, setPotensiR2] = useState('');
  const [potensiR4, setPotensiR4] = useState('');
  const [esamsatJumlah, setEsamsatJumlah] = useState('');
  const [esamsatPotensi, setEsamsatPotensi] = useState('');

  async function pickFiles() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;

      const picked = result.assets.slice(0, 2).map(buildFileEntry);

      setFiles(prev => {
        const existingNames = new Set(prev.map(f => f.name));
        const newFiles = picked.filter(f => !existingNames.has(f.name));
        return [...prev, ...newFiles].slice(0, 2);
      });
    } catch (err) {
      Alert.alert('Error', err?.message || 'Gagal membuka file picker');
    }
  }

  function removeFile(name) {
    setFiles(prev => prev.filter(f => f.name !== name));
  }

  async function submit() {
    const currentValidFiles = files.filter(f => f.valid);
    if (currentValidFiles.length === 0) return;

    let commonKode = null;
    let commonTanggal = null;
    let firstFileName = '';

    for (const file of currentValidFiles) {
      const meta = file.meta;
      if (!meta) continue;

      if (commonKode === null) {
        commonKode = meta.kode;
        commonTanggal = meta.tanggal;
        firstFileName = file.name;
        continue;
      }

      if (meta.kode !== commonKode) {
        Alert.alert(
          'Outlet tidak sama',
          `File PDF berasal dari outlet yang berbeda.\n\n• ${firstFileName} → ${commonKode}\n• ${file.name} → ${meta.kode}\n\nPastikan semua file berasal dari outlet yang sama.`
        );
        return;
      }

      if (meta.tanggal !== commonTanggal) {
        Alert.alert(
          'Tanggal tidak sama',
          `File PDF memiliki tanggal laporan berbeda.\n\n• ${firstFileName} → ${commonTanggal}\n• ${file.name} → ${meta.tanggal}\n\nPastikan semua file memiliki tanggal yang sama.`
        );
        return;
      }
    }

    setLoading(true);
    try {
      const data = await uploadFiles(currentValidFiles);
      if (data.errors?.length > 0 && data.results?.length === 0) {
        Alert.alert('Upload gagal', data.errors.map(e => e.error).join('\n'));
        return;
      }

      const laporan_id = data.results?.[0]?.laporan_id;
      if (!laporan_id) {
        Alert.alert('Error', 'Gagal mendapatkan ID laporan dari server');
        return;
      }

      navigation.navigate('Ringkasan', {
        laporan_id,
        errors: data.errors,
        manualData: {
          potensiR2: potensiR2 || '0',
          potensiR4: potensiR4 || '0',
          esamsatJumlah: esamsatJumlah || '0',
          esamsatPotensi: esamsatPotensi || '0',
        },
      });
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || 'Gagal menghubungi server';
      Alert.alert('Error', errMsg);
    } finally {
      setLoading(false);
    }
  }

  const validFiles = files.filter(f => f.valid);
  const hasInvalid = files.some(f => !f.valid);
  const submitDisabled = loading || validFiles.length === 0;

  const uploadSummary = useMemo(() => {
    if (validFiles.length === 0) {
      return {
        title: 'Belum ada file siap kirim',
        subtitle: 'Pilih maksimal 2 PDF: SAM III-2 dan STS.',
      };
    }

    const first = validFiles[0];
    return {
      title: `${validFiles.length} file siap diproses`,
      subtitle: first?.meta
        ? `Outlet ${first.meta.kode} • Tanggal ${first.meta.tanggal}`
        : 'File valid siap diproses',
    };
  }, [validFiles]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.heroCard}>
        <Text style={styles.overline}>Langkah 1 · Upload PDF</Text>
        <Text style={styles.heroTitle}>Unggah file SAM dan STS untuk mulai membuat laporan</Text>
        <Text style={styles.heroSubtitle}>
          Pilih file PDF, cek outlet dan tanggal, lalu proses laporan untuk lanjut ke hasil.
        </Text>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>1. Pilih File PDF</Text>
          <Text style={styles.sectionCaption}>Maksimal 2 file: SAM III-2 dan STS</Text>
        </View>

        <TouchableOpacity style={styles.pickArea} onPress={pickFiles} disabled={loading} activeOpacity={0.9}>
          <Text style={styles.pickTitle}>Pilih File PDF</Text>
          <Text style={styles.pickHint}>SAM III-2 • STS • maksimal 2 file</Text>
        </TouchableOpacity>

        <View style={styles.summaryBar}>
          <Text style={styles.summaryTitle}>{uploadSummary.title}</Text>
          <Text style={styles.summarySubtitle}>{uploadSummary.subtitle}</Text>
        </View>

        {hasInvalid && (
          <View style={styles.warningBox}>
            <Text style={styles.warningTitle}>Ada file yang belum valid</Text>
            <Text style={styles.warningText}>
              File dengan format nama tidak sesuai tidak akan dikirim ke server.
            </Text>
          </View>
        )}

        <View style={styles.fileList}>
          {files.length > 0 ? (
            files.map(item => (
              <FileCard key={item.name} item={item} onRemove={removeFile} disabled={loading} />
            ))
          ) : (
            <View style={styles.emptyStateBox}>
              <Text style={styles.emptyStateTitle}>Belum ada file dipilih</Text>
              <Text style={styles.emptyStateText}>Mulai dengan memilih PDF SAM atau STS di atas.</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>2. Isian Manual Tambahan</Text>
          <Text style={styles.sectionCaption}>Isi bila ada data tambahan yang perlu ikut masuk laporan</Text>
        </View>

        <Text style={styles.formSectionTitle}>Potensi Sukaraja</Text>
        <View style={styles.inputRow}>
          <ManualInput label="WP R.2" value={potensiR2} onChangeText={setPotensiR2} placeholder="0" />
          <ManualInput label="WP R.4" value={potensiR4} onChangeText={setPotensiR4} placeholder="0" />
        </View>

        <Text style={[styles.formSectionTitle, { marginTop: spacing.lg }]}>E-Samsat</Text>
        <View style={styles.inputRow}>
          <ManualInput
            label="Jumlah WP"
            value={esamsatJumlah}
            onChangeText={setEsamsatJumlah}
            placeholder="0"
          />
          <ManualInput
            label="Potensi Sukaraja WP"
            value={esamsatPotensi}
            onChangeText={setEsamsatPotensi}
            placeholder="0"
          />
        </View>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>3. Proses Laporan</Text>
          <Text style={styles.sectionCaption}>Pastikan file valid sebelum lanjut ke cek hasil</Text>
        </View>

        <View style={styles.checklistBox}>
          <Text style={styles.checklistItem}>• File valid: {validFiles.length} dari {files.length}</Text>
          <Text style={styles.checklistItem}>• Format file harus dikenali sistem</Text>
          <Text style={styles.checklistItem}>• Outlet dan tanggal harus sama untuk semua file</Text>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, submitDisabled && styles.submitBtnDisabled]}
          onPress={submit}
          disabled={submitDisabled}
          activeOpacity={0.9}
        >
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.white} />
              <Text style={styles.submitText}>Memproses laporan...</Text>
            </View>
          ) : (
            <Text style={styles.submitText}>
              Proses Laporan {validFiles.length > 0 ? `(${validFiles.length} file)` : ''}
            </Text>
          )}
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
  pickArea: {
    minHeight: 120,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  pickTitle: {
    ...typography.title,
    color: colors.accent,
    marginBottom: 4,
  },
  pickHint: {
    ...typography.bodySm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  summaryBar: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  summaryTitle: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '700',
    marginBottom: 2,
  },
  summarySubtitle: {
    ...typography.bodySm,
    color: colors.textSoft,
  },
  warningBox: {
    backgroundColor: colors.warningSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#FCD34D',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  warningTitle: {
    ...typography.body,
    color: colors.warning,
    fontWeight: '700',
    marginBottom: 4,
  },
  warningText: {
    ...typography.bodySm,
    color: colors.warning,
  },
  fileList: {
    gap: spacing.sm,
  },
  fileCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  fileCardInvalid: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  fileCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  fileTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  fileTypeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  fileStatusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  fileName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    marginBottom: 4,
  },
  fileMeta: {
    ...typography.bodySm,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  removeButton: {
    minHeight: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  emptyStateBox: {
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyStateTitle: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyStateText: {
    ...typography.bodySm,
    color: colors.textSoft,
    textAlign: 'center',
  },
  formSectionTitle: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    ...typography.bodySm,
    color: colors.textMuted,
    marginBottom: 6,
  },
  textInput: {
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontSize: 15,
  },
  checklistBox: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: 6,
  },
  checklistItem: {
    ...typography.bodySm,
    color: colors.textMuted,
  },
  submitBtn: {
    minHeight: 52,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  submitBtnDisabled: {
    backgroundColor: '#93C5FD',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  submitText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
