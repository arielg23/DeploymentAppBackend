import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useSessionStore} from '../../store/sessionStore';
import {useSyncStore} from '../../store/syncStore';
import {SyncStatusBar} from '../shared/SyncStatusBar';
import type {AppMode} from '../../types';

interface ModeCard {
  mode: AppMode;
  title: string;
  description: string;
  icon: string;
  color: string;
}

const MODES: ModeCard[] = [
  {mode: 'deployment', title: 'Deployment', description: 'Scan QR sticker then NFC lock to associate units', icon: '📦', color: '#007AFF'},
  {mode: 'guided', title: 'Guided Validation', description: 'Verify each unit matches its expected lock sequentially', icon: '✅', color: '#34C759'},
  {mode: 'adhoc', title: 'Ad-Hoc Validation', description: 'Scan any lock or unit to check its current association', icon: '🔍', color: '#FF9500'},
];

export const ModeSelectionScreen = ({navigation}: any) => {
  const {selectedSite, setMode} = useSessionStore();
  const {conflictCount} = useSyncStore();

  const handleMode = (mode: AppMode) => {
    setMode(mode);
    if (mode === 'deployment') navigation.navigate('DeploymentScanQR');
    else if (mode === 'guided') navigation.navigate('GuidedUnitList');
    else navigation.navigate('AdHocScan');
  };

  return (
    <View style={styles.container}>
      <SyncStatusBar />
      <Text style={styles.header}>{selectedSite?.site_name}</Text>
      <Text style={styles.subHeader}>Select Mode</Text>

      {MODES.map(m => (
        <TouchableOpacity key={m.mode} style={styles.card} onPress={() => handleMode(m.mode)}>
          <Text style={styles.icon}>{m.icon}</Text>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>{m.title}</Text>
            <Text style={styles.cardDesc}>{m.description}</Text>
          </View>
          <View style={[styles.dot, {backgroundColor: m.color}]} />
        </TouchableOpacity>
      ))}

      {conflictCount > 0 && (
        <TouchableOpacity style={styles.conflictBanner} onPress={() => navigation.navigate('ConflictList')}>
          <Text style={styles.conflictText}>⚠️ {conflictCount} conflict{conflictCount !== 1 ? 's' : ''} need attention</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F2F2F7', padding: 20},
  header: {fontSize: 26, fontWeight: '700', color: '#1C1C1E', marginTop: 8},
  subHeader: {fontSize: 15, color: '#8E8E93', marginBottom: 20},
  card: {backgroundColor: '#fff', borderRadius: 14, padding: 18, marginBottom: 12, flexDirection: 'row', alignItems: 'center', elevation: 1},
  icon: {fontSize: 28, marginRight: 14},
  cardText: {flex: 1},
  cardTitle: {fontSize: 17, fontWeight: '600', color: '#1C1C1E'},
  cardDesc: {fontSize: 13, color: '#8E8E93', marginTop: 2},
  dot: {width: 10, height: 10, borderRadius: 5},
  conflictBanner: {backgroundColor: '#FF3B30', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 8},
  conflictText: {color: '#fff', fontWeight: '600', fontSize: 15},
});
