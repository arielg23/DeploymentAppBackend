import React, {useEffect, useState} from 'react';
import {FlatList, StyleSheet, Text, View} from 'react-native';
import {database} from '../../db/database';
import QueuedAssignment from '../../db/models/QueuedAssignment';

export const ConflictListScreen = () => {
  const [conflicts, setConflicts] = useState<QueuedAssignment[]>([]);

  useEffect(() => {
    database.get<QueuedAssignment>('queued_assignments')
      .query()
      .fetch()
      .then(all => setConflicts(all.filter(a => a.status === 'CONFLICT')));
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Needs Action</Text>
      <Text style={styles.subtitle}>These assignments have conflicts and could not be saved.</Text>
      <FlatList
        data={conflicts}
        keyExtractor={c => c.id}
        renderItem={({item}) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.unitId}>Unit: {item.unitId}</Text>
              <View style={styles.badge}><Text style={styles.badgeText}>CONFLICT</Text></View>
            </View>
            <Text style={styles.detail}>Site: {item.siteId}</Text>
            <Text style={styles.detail}>DevEUI: <Text style={styles.mono}>{item.devEuiNormalized}</Text></Text>
            <Text style={styles.detail}>Local time: {new Date(item.timestampLocal).toLocaleString()}</Text>
            {item.lastError && (
              <Text style={styles.error}>{JSON.stringify(JSON.parse(item.lastError || '{}'), null, 2)}</Text>
            )}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No conflicts found</Text>
          </View>
        }
        contentContainerStyle={{paddingBottom: 20}}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F2F2F7', padding: 16},
  title: {fontSize: 24, fontWeight: '700', color: '#1C1C1E', marginBottom: 4},
  subtitle: {fontSize: 14, color: '#8E8E93', marginBottom: 16},
  card: {backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: '#FF3B30'},
  cardHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8},
  unitId: {fontSize: 15, fontWeight: '700', color: '#1C1C1E'},
  badge: {backgroundColor: '#FF3B30', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3},
  badgeText: {color: '#fff', fontSize: 11, fontWeight: '700'},
  detail: {fontSize: 13, color: '#3C3C43', marginBottom: 3},
  mono: {fontFamily: 'monospace'},
  error: {fontSize: 11, color: '#FF3B30', fontFamily: 'monospace', marginTop: 6, backgroundColor: '#FFF5F5', borderRadius: 6, padding: 8},
  empty: {alignItems: 'center', marginTop: 60},
  emptyText: {fontSize: 16, color: '#8E8E93'},
});
