// src/screens/UploadScreen.js
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, FlatList,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { uploadFiles } from '../api';
import { parseFilename } from '../utils/filename';

const TYPE_META = {
  sam:   { label: 'SAM',   color: '#1565C0', bg: '#E3F2FD' },
  sts:   { label: 'STS',   color: '#E65100', bg: '#FBE9E7' },
};

function buildFileEntry(asset) {
  const parsed = parseFilename(asset.name);
  if (!parsed || (parsed.type !== 'sam' && parsed.type !== 'sts')) {
    return {
      uri: asset.uri,
      name: asset.name,
      valid: false,
      error: 'Nama file tidak dikenali. Pastikan format: SAM_III-2_... atau STS_...',
      typeMeta: { label: 'PDF', color: '#616E7C', bg: '#ECEFF1' },
    };
  }
  return {
    uri: asset.uri,
    name: asset.name,
    valid: true,
    error: null,
    typeMeta: TYPE_META[parsed.type] || { label: 'PDF', color: '#616E7C', bg: '#ECEFF1' },
    meta: parsed,
  };
}

export default function UploadScreen({ navigation }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

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
    } catch {
      Alert.alert('Error', 'Gagal membuka file picker');
    }
  }

  function removeFile(name) {
    setFiles(prev => prev.filter(f => f.name !== name));
  }

  const validFiles = files.filter(f => f.valid);
  const hasInvalid = files.some(f => !f.valid);

  async function submit() {
    if (validFiles.length === 0) return;

    // Client-side validation: pastikan semua file berasal dari outlet dan tanggal yang sama
    let commonKode = null;
    let commonTanggal = null;
    let firstFileName = '';

    for (const file of validFiles) {
      const meta = file.meta;
      if (meta) {
        if (commonKode === null) {
          commonKode = meta.kode;
          commonTanggal = meta.tanggal;
          firstFileName = file.name;
        } else {
          if (meta.kode !== commonKode) {
            Alert.alert(
              'Gagal',
              `File PDF berasal dari outlet yang berbeda!\n\n` +
              `• '${firstFileName}' -> Kode: ${commonKode}\n` +
              `• '${file.name}' -> Kode: ${meta.kode}\n\n` +
              `Pastikan semua file yang dipilih berasal dari outlet yang sama.`
            );
            return;
          }
          if (meta.tanggal !== commonTanggal) {
            Alert.alert(
              'Gagal',
              `File PDF memiliki tanggal laporan yang berbeda!\n\n` +
              `• '${firstFileName}' -> Tanggal: ${commonTanggal}\n` +
              `• '${file.name}' -> Tanggal: ${meta.tanggal}\n\n` +
              `Pastikan semua file yang dipilih memiliki tanggal yang sama.`
            );
            return;
          }
        }
      }
    }

    setLoading(true);
    try {
      const data = await uploadFiles(validFiles);
      if (data.errors?.length > 0 && data.results?.length === 0) {
        Alert.alert('Gagal', data.errors.map(e => e.error).join('\n'));
        return;
      }
      const laporan_id = data.results?.[0]?.laporan_id;
      navigation.navigate('Ringkasan', { laporan_id, errors: data.errors });
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || 'Gagal menghubungi server';
      Alert.alert('Error', errMsg);
    } finally {
      setLoading(false);
    }
  }

  const submitDisabled = loading || validFiles.length === 0;

  return (
    <View style={styles.container}>
      {/* Area pilih file */}
      <TouchableOpacity style={styles.pickArea} onPress={pickFiles} disabled={loading}>
        <Text style={styles.pickIcon}>📄</Text>
        <Text style={styles.pickText}>Pilih File PDF</Text>
        <Text style={styles.pickHint}>SAM III-2 · STS  (maks. 2 file)</Text>
      </TouchableOpacity>

      {/* Peringatan jika ada file invalid */}
      {hasInvalid && (
        <View style={styles.warnBox}>
          <Text style={styles.warnText}>
            ⚠️ File dengan nama tidak valid tidak akan dikirim.
          </Text>
        </View>
      )}

      {/* Daftar file */}
      {files.length > 0 ? (
        <FlatList
          data={files}
          keyExtractor={item => item.name}
          style={styles.fileList}
          renderItem={({ item }) => (
            <View style={[styles.fileRow, !item.valid && styles.fileRowInvalid]}>
              {/* Badge tipe */}
              <View style={[styles.typeBadge, { backgroundColor: item.typeMeta.bg }]}>
                <Text style={[styles.typeBadgeText, { color: item.typeMeta.color }]}>
                  {item.typeMeta.label}
                </Text>
              </View>

              {/* Info file */}
              <View style={styles.fileInfo}>
                <Text style={styles.fileName} numberOfLines={1}>{item.name}</Text>
                {!item.valid && (
                  <Text style={styles.fileError} numberOfLines={2}>{item.error}</Text>
                )}
              </View>

              {/* Tombol hapus */}
              <TouchableOpacity onPress={() => removeFile(item.name)} disabled={loading}>
                <Text style={styles.removeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      ) : (
        <Text style={styles.emptyText}>Belum ada file dipilih</Text>
      )}

      {/* Tombol kirim */}
      <TouchableOpacity
        style={[styles.submitBtn, submitDisabled && styles.submitBtnDisabled]}
        onPress={submit}
        disabled={submitDisabled}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.submitText}>
              Kirim ke Server {validFiles.length > 0 ? `(${validFiles.length} file)` : ''}
            </Text>
        }
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F4F6F9' },

  pickArea: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5, borderColor: '#BBDEFB',
    borderRadius: 16, padding: 32, alignItems: 'center', marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  pickIcon: { fontSize: 48, marginBottom: 8 },
  pickText: { fontSize: 16, fontWeight: '600', color: '#1565C0' },
  pickHint: { fontSize: 12, color: '#616E7C', marginTop: 4, textAlign: 'center' },

  warnBox: {
    backgroundColor: '#FFF3E0', borderRadius: 10,
    padding: 10, marginBottom: 10,
    borderLeftWidth: 3, borderLeftColor: '#E65100',
  },
  warnText: { fontSize: 12, color: '#E65100' },

  fileList: { flex: 1, marginBottom: 16 },
  fileRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12, padding: 12, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  fileRowInvalid: {
    borderWidth: 1.5, borderColor: '#FFCDD2',
    backgroundColor: '#FFF5F5',
  },
  typeBadge: {
    paddingHorizontal: 9, paddingVertical: 3,
    borderRadius: 10, marginRight: 10, alignSelf: 'flex-start', marginTop: 2,
  },
  typeBadgeText: { fontSize: 10, fontWeight: '700' },
  fileInfo: { flex: 1 },
  fileName: { fontSize: 13, color: '#1A1A2E', fontWeight: '500' },
  fileError: { fontSize: 11, color: '#C62828', marginTop: 3, lineHeight: 15 },
  removeBtn: { fontSize: 16, color: '#B71C1C', paddingHorizontal: 8 },

  emptyText: { flex: 1, textAlign: 'center', color: '#aaa', marginTop: 40, fontSize: 14 },

  submitBtn: {
    backgroundColor: '#1565C0', height: 52, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 4, elevation: 2,
  },
  submitBtnDisabled: { backgroundColor: '#90CAF9', elevation: 0 },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

