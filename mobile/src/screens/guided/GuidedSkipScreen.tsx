import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useSessionStore} from '../../store/sessionStore';
import {enqueueSkip} from '../../services/syncService';
import {apiClient} from '../../api/client';
import type {SkipReason} from '../../types';

export const GuidedSkipScreen = ({navigation, route}: any) => {
  const {unit} = route.params;
  const {activeUpload} = useSessionStore();
  const [reasons, setReasons] = useState<SkipReason[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiClient.get('/skip-reasons').then(r => {
      setReasons(r.data.filter((s: SkipReason) => s.active));
    }).catch(() => setReasons([])).finally(() => setLoading(false));
  }, []);

  const handleSkip = async (reason: SkipReason | null) => {
    if (!activeUpload) return;
    setSubmitting(true);
    try {
      await enqueueSkip({
        uploadId: activeUpload.upload_id,
        siteId: unit.site_id,
        unitId: unit.unit_id,
        reasonId: reason?.id,
        timestampLocal: new Date().toISOString(),
      });
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Failed to record skip');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Skip Unit</Text>
      <Text style={styles.subtitle}>{unit.unit_name} ({unit.unit_id})</Text>
      {loading ? (
        <ActivityIndicator color="#007AFF" style={{marginTop: 40}} />
      ) : (
        <FlatList
          data={reasons}
          keyExtractor={r => r.id}
          style={styles.list}
          ListHeaderComponent={<Text style={styles.listLabel}>Select reason (optional):</Text>}
          renderItem={({item}) => (
            <TouchableOpacity style={styles.reasonRow} onPress={() => handleSkip(item)} disabled={submitting}>
              <Text style={styles.reasonText}>{item.label}</Text>
            </TouchableOpacity>
          )}
          ListFooterComponent={
            <TouchableOpacity style={styles.noReason} onPress={() => handleSkip(null)} disabled={submitting}>
              <Text style={styles.noReasonText}>Skip without reason</Text>
            </TouchableOpacity>
          }
        />
      )}
      {submitting && <ActivityIndicator color="#007AFF" />}
      <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F2F2F7', padding: 20},
  title: {fontSize: 22, fontWeight: '700', color: '#1C1C1E'},
  subtitle: {fontSize: 15, color: '#8E8E93', marginBottom: 16},
  list: {marginTop: 8},
  listLabel: {fontSize: 14, color: '#8E8E93', marginBottom: 8},
  reasonRow: {backgroundColor: '#fff', borderRadius: 10, padding: 16, marginBottom: 8, elevation: 1},
  reasonText: {fontSize: 16, color: '#1C1C1E'},
  noReason: {backgroundColor: '#F2F2F7', borderWidth: 1, borderColor: '#C7C7CC', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 4},
  noReasonText: {fontSize: 15, color: '#8E8E93'},
  cancelBtn: {alignItems: 'center', marginTop: 16, padding: 12},
  cancelText: {color: '#FF3B30', fontSize: 16},
});
