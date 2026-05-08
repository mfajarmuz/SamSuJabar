// src/screens/RiwayatScreen.js
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { getLaporanList } from '../api';
import { formatTanggal } from '../utils/format';

function FileCheck({ label, done }) {
  return (
    <View style={[styles.fileCheck, done ? styles.fileCheckDone : styles.fileCheckMiss]}>
      <Text style={[styles.fileCheckText, { color: done ? '#2E7D32' : '#9E9E9E' }]}>
        {done ? '✓' : '–'} {label}
      </Text>
    </View>
  );
}

export default function RiwayatScreen({ navigation }) {
  const [laporan, setLaporan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const data = await getLaporanList();
      setLaporan(data || []);
    } catch (err) {
      setError(err.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1565C0" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => { setLoading(true); fetchData(); }}
        >
          <Text style={styles.retryText}>Coba Lagi</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (laporan.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyIcon}>📂</Text>
        <Text style={styles.emptyTitle}>Belum ada laporan</Text>
        <Text style={styles.emptyHint}>Upload PDF di tab Upload untuk mulai</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      data={laporan}
      keyExtractor={item => String(item.id)}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#1565C0']}
          tintColor="#1565C0"
        />
      }
      renderItem={({ item }) => {
        const namaOutlet = item.outlets?.nama || '-';
        const isComplete = item.status === 'complete';

        return (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('RiwayatDetail', { laporan_id: item.id })}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.outletName} numberOfLines={1}>{namaOutlet}</Text>
              <View style={[styles.statusBadge, isComplete ? styles.statusComplete : styles.statusPartial]}>
                <Text style={styles.statusText}>{isComplete ? '✓ Lengkap' : '⚡ Sebagian'}</Text>
              </View>
            </View>

            <Text style={styles.tanggal}>{formatTanggal(item.tanggal)}</Text>

            <View style={styles.fileChecks}>
              <FileCheck label="SAM" done={!!item.sam_file} />
              <FileCheck label="STS" done={!!item.sts_file} />
            </View>
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: '#F4F6F9' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F4F6F9', padding: 24 },
  emptyIcon: { fontSize: 56, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#1A1A2E', marginBottom: 6 },
  emptyHint: { fontSize: 13, color: '#616E7C', textAlign: 'center' },
  errorIcon: { fontSize: 40, marginBottom: 12 },
  errorText: { fontSize: 14, color: '#C62828', textAlign: 'center', marginBottom: 16 },
  retryBtn: {
    backgroundColor: '#1565C0', paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: 10,
  },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Card
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 14,
    padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 4,
  },
  outletName: { fontSize: 16, fontWeight: '700', color: '#1A1A2E', flex: 1, marginRight: 8 },
  statusBadge: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20,
  },
  statusComplete: { backgroundColor: '#E8F5E9' },
  statusPartial: { backgroundColor: '#FFF3E0' },
  statusText: { fontSize: 11, fontWeight: '700', color: '#1B5E20' },
  tanggal: { fontSize: 13, color: '#616E7C', marginBottom: 12 },

  // File checks
  fileChecks: { flexDirection: 'row', gap: 8 },
  fileCheck: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  fileCheckDone: { backgroundColor: '#E8F5E9' },
  fileCheckMiss: { backgroundColor: '#F5F5F5' },
  fileCheckText: { fontSize: 12, fontWeight: '600' },
});
