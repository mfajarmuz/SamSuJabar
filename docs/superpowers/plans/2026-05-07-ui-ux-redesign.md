# UI/UX Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the 3 Android screens (Upload, Ringkasan, WhatsApp) to a Modern & Clean card-based aesthetic while keeping all logic and API calls unchanged.

**Architecture:** Style-only changes to 3 screen files plus a minor App.js tweak. Each screen gets `#F4F6F9` background, white cards with elevation shadows, refined typography, and screen-specific improvements (type badges on Upload, success banner on Ringkasan, WA bubble preview on WhatsApp).

**Tech Stack:** React Native (Expo ~55), StyleSheet API — no new dependencies.

---

## File Map

| File | Change Type | Summary |
|---|---|---|
| `Project/android/src/screens/UploadScreen.js` | Modify | New styles + `getFileType` badge helper |
| `Project/android/src/screens/RingkasanScreen.js` | Modify | New styles + success banner replaces emoji header |
| `Project/android/src/screens/WhatsAppScreen.js` | Modify | New styles + outer card wrapping inner WA-bubble scroll |
| `Project/android/App.js` | Modify | Add `headerShadowVisible: true` |

---

## Task 1: UploadScreen

**Files:**
- Modify: `Project/android/src/screens/UploadScreen.js`

### What changes
1. Screen background: `#fff` → `#F4F6F9`
2. Drop zone: `#E3F2FD` dashed border → white card with solid `#BBDEFB` border + shadow
3. File items: colored-border row → white card + type badge pill
4. Submit button: `padding:16` → `height:52`, `borderRadius:12`, text without `→`
5. New `getFileType()` helper reads filename to return badge label + colors

- [ ] **Step 1: Replace UploadScreen.js with the redesigned version**

Full file content:

```javascript
// src/screens/UploadScreen.js
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, FlatList,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { uploadFiles } from '../api';

function getFileType(filename) {
  const upper = filename.toUpperCase();
  if (upper.includes('SAM')) return { label: 'SAM', color: '#1565C0', bg: '#E3F2FD' };
  if (upper.includes('REKAP')) return { label: 'REKAP', color: '#2E7D32', bg: '#E8F5E9' };
  if (upper.includes('STS')) return { label: 'STS', color: '#E65100', bg: '#FBE9E7' };
  return { label: 'PDF', color: '#616E7C', bg: '#ECEFF1' };
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
      const picked = result.assets.slice(0, 3).map(a => ({ uri: a.uri, name: a.name }));
      setFiles(prev => {
        const existing = new Set(prev.map(f => f.name));
        const newFiles = picked.filter(f => !existing.has(f.name));
        return [...prev, ...newFiles].slice(0, 3);
      });
    } catch {
      Alert.alert('Error', 'Gagal membuka file picker');
    }
  }

  function removeFile(name) {
    setFiles(prev => prev.filter(f => f.name !== name));
  }

  async function submit() {
    if (files.length === 0) return;
    setLoading(true);
    try {
      const data = await uploadFiles(files);
      if (data.errors?.length > 0 && data.results?.length === 0) {
        Alert.alert('Gagal', data.errors.map(e => e.error).join('\n'));
        return;
      }
      const laporan_id = data.results?.[0]?.laporan_id;
      navigation.navigate('Ringkasan', { laporan_id, errors: data.errors });
    } catch (err) {
      Alert.alert('Error', err.message || 'Gagal menghubungi server');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.pickArea} onPress={pickFiles} disabled={loading}>
        <Text style={styles.pickIcon}>📄</Text>
        <Text style={styles.pickText}>Pilih File PDF</Text>
        <Text style={styles.pickHint}>SAM III-2 · Rekap Kasir · STS</Text>
      </TouchableOpacity>

      {files.length > 0 ? (
        <FlatList
          data={files}
          keyExtractor={item => item.name}
          style={styles.fileList}
          renderItem={({ item }) => {
            const ft = getFileType(item.name);
            return (
              <View style={styles.fileRow}>
                <View style={[styles.typeBadge, { backgroundColor: ft.bg }]}>
                  <Text style={[styles.typeBadgeText, { color: ft.color }]}>{ft.label}</Text>
                </View>
                <Text style={styles.fileName} numberOfLines={1}>{item.name}</Text>
                <TouchableOpacity onPress={() => removeFile(item.name)} disabled={loading}>
                  <Text style={styles.removeBtn}>✕</Text>
                </TouchableOpacity>
              </View>
            );
          }}
        />
      ) : (
        <Text style={styles.emptyText}>Belum ada file dipilih</Text>
      )}

      <TouchableOpacity
        style={[styles.submitBtn, (loading || files.length === 0) && styles.submitBtnDisabled]}
        onPress={submit}
        disabled={loading || files.length === 0}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.submitText}>Kirim ke Server</Text>
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
    borderRadius: 16, padding: 32, alignItems: 'center', marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  pickIcon: { fontSize: 48, marginBottom: 8 },
  pickText: { fontSize: 16, fontWeight: '600', color: '#1565C0' },
  pickHint: { fontSize: 12, color: '#616E7C', marginTop: 4 },
  fileList: { flex: 1, marginBottom: 16 },
  fileRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10, padding: 12, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  typeBadge: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 10, marginRight: 10,
  },
  typeBadgeText: { fontSize: 11, fontWeight: '700' },
  fileName: { flex: 1, fontSize: 13, color: '#1A1A2E' },
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
```

- [ ] **Step 2: Visually verify UploadScreen**

Run Expo (from `Project/android`):
```
npx expo start
```
Open on Android device/emulator. Check:
- Background is light grey (`#F4F6F9`), not pure white
- Drop zone is a white card with subtle shadow and light blue border
- Pick 3 PDF files — each file card shows colored badge: SAM=blue, REKAP=green, STS=orange
- Submit button is taller (52px) with text "Kirim ke Server" (no arrow)
- Disabled state shows `#90CAF9` light blue (not grey)

- [ ] **Step 3: Commit**

```
git add Project/android/src/screens/UploadScreen.js
git commit -m "redesign: UploadScreen card-based layout with file type badges"
```

---

## Task 2: RingkasanScreen

**Files:**
- Modify: `Project/android/src/screens/RingkasanScreen.js`

### What changes
1. Screen background: `#fff` → `#F4F6F9`
2. Header: emoji ✅ + centered text → horizontal success banner with left green border
3. WP boxes: `#E3F2FD` flat → `#F0F7FF` with shadow on parent card
4. Stat numbers: 28px → 32px, weight 800
5. Penerimaan card: background `#F5F5F5` flat → white with shadow
6. Row separator: `#e0e0e0` → `#E2E8F0`, paddingVertical 8 → 10
7. Total Setoran: bold row at bottom → `#FFF8E1` pill row with orange text
8. WA button: height increased to 52px, text "Buat Laporan WhatsApp" (no emoji)

- [ ] **Step 1: Replace RingkasanScreen.js with the redesigned version**

Full file content:

```javascript
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  TouchableOpacity, ScrollView, Alert,
} from 'react-native';
import { getLaporan } from '../api';
import { formatRupiah } from '../utils/format';

export default function RingkasanScreen({ route, navigation }) {
  const { laporan_id, errors = [] } = route.params;
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
  const rekap = laporan.rekap || {};
  const sts = laporan.sts || {};
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
```

- [ ] **Step 2: Visually verify RingkasanScreen**

Navigate from UploadScreen after uploading. Check:
- Background is `#F4F6F9`
- Top shows a green left-bordered banner with outlet name and tanggal (no ✅ emoji)
- WP numbers are 32px, very prominent
- WP boxes are `#F0F7FF` (cool light blue), Total WP box is `#BBDEFB`
- Penerimaan rows have refined `#E2E8F0` separator lines
- "Total Setoran" row has `#FFF8E1` (warm yellow) background and orange text
- Cards visibly float above background with shadows
- Green WA button is 52px tall

- [ ] **Step 3: Commit**

```
git add Project/android/src/screens/RingkasanScreen.js
git commit -m "redesign: RingkasanScreen success banner and refined card layout"
```

---

## Task 3: WhatsAppScreen

**Files:**
- Modify: `Project/android/src/screens/WhatsAppScreen.js`

### What changes
1. Screen background: `#fff` → `#F4F6F9`
2. Section label: `#777` → `#616E7C`, text changes to "PREVIEW TEKS LAPORAN"
3. Preview: `#E8F5E9` flat ScrollView → white outer card (elevation 3) wrapping inner `#DCF8C6` scroll area
4. Buttons: `padding:14` → `height:52`, `borderRadius:10` → `borderRadius:12`, add elevation

- [ ] **Step 1: Replace WhatsAppScreen.js with the redesigned version**

Full file content:

```javascript
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

  function bukaWhatsApp() {
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
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
    overflow: 'hidden',
  },
  previewInner: {
    padding: 16, backgroundColor: '#DCF8C6',
    minHeight: '100%',
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
```

- [ ] **Step 2: Visually verify WhatsAppScreen**

Navigate from RingkasanScreen → "Buat Laporan WhatsApp". Check:
- Background is `#F4F6F9`
- Preview area is a white card with shadow
- Text inside has `#DCF8C6` (WA bubble green) background — feels like a real WA chat bubble
- Text is `#1B5E20` dark green, monospace, readable
- Both buttons are 52px tall with rounded corners

- [ ] **Step 3: Commit**

```
git add Project/android/src/screens/WhatsAppScreen.js
git commit -m "redesign: WhatsAppScreen WA-bubble preview card and taller buttons"
```

---

## Task 4: App.js Header Polish

**Files:**
- Modify: `Project/android/App.js`

### What changes
Add `headerShadowVisible: true` to the stack navigator `screenOptions` — this makes the native navigation bar cast a subtle shadow onto the screen content, which works well with the new `#F4F6F9` screen background.

- [ ] **Step 1: Add headerShadowVisible to App.js screenOptions**

In `Project/android/App.js`, update the `screenOptions` object:

```javascript
screenOptions={{
  headerStyle: { backgroundColor: '#1565C0' },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: '700' },
  headerShadowVisible: true,
}}
```

The only addition is `headerShadowVisible: true` on a new line after `headerTitleStyle`.

- [ ] **Step 2: Visually verify**

Navigate through all 3 screens. Check:
- A subtle shadow appears below the blue header bar on all screens
- No visual regressions on any screen

- [ ] **Step 3: Commit**

```
git add Project/android/App.js
git commit -m "redesign: add header shadow for depth against F4F6F9 background"
```

---

## Self-Review

**Spec coverage:**
- ✅ Color palette (`#F4F6F9` bg, `#FFFFFF` cards, `#DCF8C6` bubble, etc.) — used in all 3 tasks
- ✅ Typography (32px/800 stat numbers, 11px/700 UPPERCASE card titles) — Task 2 and Task 3
- ✅ Shadow/elevation system (elevation 3 cards, elevation 2 buttons) — all tasks
- ✅ UploadScreen: drop zone card, file type badges, 52px button — Task 1
- ✅ RingkasanScreen: success banner, WP boxes, Penerimaan rows, total pill, WA button — Task 2
- ✅ WhatsAppScreen: outer white card + inner DCF8C6 scroll, 52px buttons — Task 3
- ✅ App.js headerShadowVisible — Task 4

**Placeholder scan:** No TBDs, no "implement later", all code blocks are complete.

**Type consistency:** `getFileType()` defined and used in Task 1 only (local helper). `styles.*` names are self-contained per file — no cross-task references.
