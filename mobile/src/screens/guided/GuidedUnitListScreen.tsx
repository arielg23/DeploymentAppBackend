import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {getUnits} from '../../api/sites';
import {useSessionStore} from '../../store/sessionStore';
import {SyncStatusBar} from '../shared/SyncStatusBar';
import type {Unit} from '../../types';

const STATUS_ICONS: Record<string, string> = {
  SENT: '✅',
  CONFLICT: '⚠️',
  ERROR: '❌',
  QUEUED: '🕐',
};

export const GuidedUnitListScreen = ({navigation}: any) => {
  const {activeUpload} = useSessionStore();
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!activeUpload) return;
    getUnits(activeUpload.upload_id)
      .then(setUnits)
      .catch(() => Alert.alert('Error', 'Failed to load units'))
      .finally(() => setLoading(false));
  }, [activeUpload]);

  useEffect(() => { load(); }, [load]);

  const isComplete = (u: Unit) => u.assignment_status === 'SENT' || u.assignment_status === 'QUEUED';
  const pending = units.filter(u => !isComplete(u) && !u.is_skipped).sort((a, b) => a.sequence - b.sequence);
  const done = units.filter(u => isComplete(u));
  const skipped = units.filter(u => u.is_skipped);

  const handleUnit = (unit: Unit) => {
    navigation.navigate('GuidedScanNFC', {unit});
  };

  const handleSkip = (unit: Unit) => {
    navigation.navigate('GuidedSkip', {unit});
  };

  const renderUnit = ({item}: {item: Unit}) => {
    const complete = isComplete(item);
    const icon = item.assignment_status ? (STATUS_ICONS[item.assignment_status] || '⏳') : (item.is_skipped ? '⏭️' : '⏳');
    return (
      <View style={[styles.unitRow, complete && styles.unitDone]}>
        <Text style={styles.seq}>{item.sequence}</Text>
        <View style={styles.unitInfo}>
          <Text style={styles.unitName}>{item.unit_name}</Text>
          <Text style={styles.unitId}>{item.unit_id}</Text>
          {item.dev_eui_normalized && <Text style={styles.deveui}>{item.dev_eui_normalized}</Text>}
        </View>
        <Text style={styles.icon}>{icon}</Text>
        {!complete && !item.is_skipped && (
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleUnit(item)}>
              <Text style={styles.actionBtnText}>Scan</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.skipBtn]} onPress={() => handleSkip(item)}>
              <Text style={styles.skipBtnText}>Skip</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <SyncStatusBar />
      <View style={styles.header}>
        <Text style={styles.title}>Units</Text>
        <Text style={styles.progress}>{done.length}/{units.length} done · {skipped.length} skipped</Text>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{marginTop: 40}} />
      ) : (
        <FlatList
          data={[...pending, ...skipped, ...done]}
          keyExtractor={u => u.unit_id}
          renderItem={renderUnit}
          contentContainerStyle={{paddingBottom: 20}}
          onRefresh={load}
          refreshing={loading}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F2F2F7'},
  header: {padding: 16, paddingBottom: 8},
  title: {fontSize: 26, fontWeight: '700', color: '#1C1C1E'},
  progress: {fontSize: 14, color: '#8E8E93'},
  unitRow: {backgroundColor: '#fff', marginHorizontal: 12, marginBottom: 6, borderRadius: 10, padding: 12, flexDirection: 'row', alignItems: 'center'},
  unitDone: {opacity: 0.6},
  seq: {fontSize: 12, color: '#8E8E93', width: 28, fontWeight: '600'},
  unitInfo: {flex: 1},
  unitName: {fontSize: 15, fontWeight: '600', color: '#1C1C1E'},
  unitId: {fontSize: 12, color: '#8E8E93'},
  deveui: {fontSize: 11, color: '#34C759', fontFamily: 'monospace'},
  icon: {fontSize: 18, marginHorizontal: 8},
  actions: {flexDirection: 'row', gap: 6},
  actionBtn: {backgroundColor: '#007AFF', borderRadius: 7, paddingHorizontal: 12, paddingVertical: 7},
  actionBtnText: {color: '#fff', fontSize: 13, fontWeight: '600'},
  skipBtn: {backgroundColor: '#F2F2F7', borderWidth: 1, borderColor: '#C7C7CC'},
  skipBtnText: {color: '#3C3C43', fontSize: 13},
});
