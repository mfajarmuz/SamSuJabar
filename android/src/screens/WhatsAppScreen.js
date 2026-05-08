import React, { useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Linking, Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { formatWhatsAppText } from '../utils/whatsapp';

export default function WhatsAppScreen({ route }) {
  const params = route.params;
  const teks = useMemo(() => formatWhatsAppText(params), [params]);

  async function salinTeks() {
    await Clipboard.setStringAsync(teks);
    Alert.alert('Tersalin!', 'Teks laporan berhasil disalin ke clipboard');
  }

  async function bukaWhatsApp() {
    const url = `whatsapp://send?text=${encodeURIComponent(teks)}`;
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert('Error', 'WhatsApp tidak terinstall di perangkat ini');
      return;
    }
    Linking.openURL(url);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Preview Teks Laporan</Text>

      <View style={styles.previewCard}>
        <ScrollView contentContainerStyle={styles.previewInner}>
          <Text style={styles.previewText}>{teks}</Text>
        </ScrollView>
      </View>

      <View style={styles.btnRow}>
        <TouchableOpacity style={styles.btnCopy} onPress={salinTeks}>
          <Text style={styles.btnText}>📋  Salin Teks</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnWa} onPress={bukaWhatsApp}>
          <Text style={styles.btnText}>💬  Buka WA</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F4F6F9' },
  label: {
    fontSize: 11, fontWeight: '700', color: '#616E7C',
    marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1.2,
  },
  previewCard: {
    flex: 1, marginBottom: 16,
    backgroundColor: '#FFFFFF', borderRadius: 16,
    overflow: 'hidden',
  },
  previewInner: {
    padding: 16, backgroundColor: '#DCF8C6',
    flexGrow: 1,
  },
  previewText: {
    fontFamily: 'monospace', fontSize: 13.5,
    color: '#1B5E20', lineHeight: 22,
  },
  btnRow: { flexDirection: 'row', gap: 12 },
  btnCopy: {
    flex: 1, backgroundColor: '#455A64', height: 52,
    borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 4, elevation: 2,
  },
  btnWa: {
    flex: 1, backgroundColor: '#25D366', height: 52,
    borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 4, elevation: 2,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
