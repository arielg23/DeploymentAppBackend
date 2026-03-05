import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {getActiveUpload, getSites} from '../../api/sites';
import {useSessionStore} from '../../store/sessionStore';
import {SyncStatusBar} from '../shared/SyncStatusBar';
import type {Site} from '../../types';

export const SiteSelectionScreen = ({navigation}: any) => {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const {setSite, setUpload} = useSessionStore();

  useEffect(() => {
    getSites()
      .then(setSites)
      .catch(() => Alert.alert('Error', 'Failed to load sites'))
      .finally(() => setLoading(false));
  }, []);

  const handleSelectSite = useCallback(async (site: Site) => {
    if (!site.active_upload_id) {
      Alert.alert('No Active Deployment', 'This site has no active upload. Contact your admin.');
      return;
    }
    try {
      const upload = await getActiveUpload(site.site_id);
      setSite(site);
      setUpload(upload);
      navigation.navigate('ModeSelection');
    } catch {
      Alert.alert('Error', 'Failed to load site data');
    }
  }, [setSite, setUpload, navigation]);

  return (
    <View style={styles.container}>
      <SyncStatusBar />
      <Text style={styles.header}>Select Site</Text>
      {loading ? (
        <ActivityIndicator style={{marginTop: 40}} size="large" color="#007AFF" />
      ) : (
        <FlatList
          data={sites}
          keyExtractor={s => s.site_id}
          contentContainerStyle={styles.list}
          renderItem={({item}) => (
            <TouchableOpacity style={styles.card} onPress={() => handleSelectSite(item)}>
              <View style={styles.cardContent}>
                <Text style={styles.siteName}>{item.site_name}</Text>
                <Text style={styles.siteId}>{item.site_id}</Text>
              </View>
              <View style={[styles.badge, !item.active_upload_id && styles.badgeInactive]}>
                <Text style={styles.badgeText}>{item.active_upload_id ? 'ACTIVE' : 'INACTIVE'}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No sites assigned to you.</Text>}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F2F2F7'},
  header: {fontSize: 28, fontWeight: '700', padding: 20, paddingBottom: 8, color: '#1C1C1E'},
  list: {paddingHorizontal: 16, paddingBottom: 20},
  card: {backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 1},
  cardContent: {flex: 1},
  siteName: {fontSize: 17, fontWeight: '600', color: '#1C1C1E'},
  siteId: {fontSize: 13, color: '#8E8E93', marginTop: 2},
  badge: {backgroundColor: '#34C759', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3},
  badgeInactive: {backgroundColor: '#8E8E93'},
  badgeText: {color: '#fff', fontSize: 11, fontWeight: '700'},
  empty: {textAlign: 'center', color: '#8E8E93', marginTop: 40},
});
