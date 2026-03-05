import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useSyncStore} from '../../store/syncStore';

export const SyncStatusBar = () => {
  const {pendingCount, conflictCount, isSyncing} = useSyncStore();

  if (pendingCount === 0 && conflictCount === 0) return null;

  return (
    <View style={styles.container}>
      {isSyncing && <Text style={styles.text}>Syncing...</Text>}
      {!isSyncing && pendingCount > 0 && (
        <Text style={styles.text}>
          {pendingCount} pending upload{pendingCount !== 1 ? 's' : ''}
        </Text>
      )}
      {conflictCount > 0 && (
        <Text style={[styles.text, styles.conflict]}>
          {conflictCount} conflict{conflictCount !== 1 ? 's' : ''} - needs action
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FF9500',
    paddingVertical: 6,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  text: {color: '#fff', fontSize: 12, fontWeight: '600'},
  conflict: {color: '#FF3B30'},
});
