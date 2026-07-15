import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {getActiveUpload, getSites} from '../../api/sites';
import {useSessionStore} from '../../store/sessionStore';
import {runSync} from '../../services/syncService';
import type {Site} from '../../types';

const BG = '#0D7A8C';

export const SiteSelectionScreen = ({navigation}: any) => {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Site | null>(null);
  const [confirming, setConfirming] = useState(false);
  const {setSite, setUpload} = useSessionStore();

  useEffect(() => {
    runSync();
    getSites()
      .then(data => setSites(data.filter(s => s.active_upload_id)))
      .catch(() => Alert.alert('Error', 'Failed to load sites'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = query.trim()
    ? sites.filter(s =>
        s.site_name.toLowerCase().includes(query.toLowerCase()) ||
        s.site_id.toLowerCase().includes(query.toLowerCase()),
      )
    : sites;

  const handleContinue = useCallback(async () => {
    if (!selected) return;
    setConfirming(true);
    try {
      const upload = await getActiveUpload(selected.site_id);
      setSite(selected);
      setUpload(upload);
      navigation.navigate('ModeSelection');
    } catch {
      Alert.alert('Error', 'Failed to load site data');
    } finally {
      setConfirming(false);
    }
  }, [selected, setSite, setUpload, navigation]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.topBar}>
        <Text style={styles.hamburger}>{'\u2261'}</Text>
        <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        <View style={styles.topBarSpacer} />
      </View>

      <Text style={styles.title}>Lock Deployment</Text>
      <Text style={styles.heading}>Start Deployment</Text>
      <Text style={styles.subtitle}>
        {'Select the site you are deploying for' + (selected ? ' \u2013 ' + selected.site_name : '')}
      </Text>

      <Text style={styles.sectionLabel}>Sites</Text>
      <View style={styles.inputWrap}>
        <TextInput
          style={styles.input}
          placeholder="Type site name"
          placeholderTextColor="#aaa"
          value={query}
          onChangeText={t => { setQuery(t); setSelected(null); }}
        />
      </View>

      {loading ? (
        <ActivityIndicator style={{marginTop: 24}} size="large" color="#fff" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={s => s.site_id}
          style={styles.list}
          keyboardShouldPersistTaps="handled"
          renderItem={({item}) => (
            <TouchableOpacity
              style={[styles.siteRow, selected && selected.site_id === item.site_id && styles.siteRowSelected]}
              onPress={() => { setSelected(item); setQuery(item.site_name); }}>
              <Text style={[styles.siteRowText, selected && selected.site_id === item.site_id && styles.siteRowTextSelected]}>
                {item.site_name}
              </Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            query ? <Text style={styles.empty}>No sites match.</Text> : null
          }
        />
      )}

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, (!selected || confirming) && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!selected || confirming}>
          {confirming ? (
            <ActivityIndicator color={BG} />
          ) : (
            <Text style={styles.buttonText}>Continue</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: BG},
  topBar: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 52, paddingBottom: 16},
  hamburger: {fontSize: 26, color: '#fff', width: 36},
  logo: {flex: 1, height: 72},
  topBarSpacer: {width: 36},
  title: {fontSize: 22, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 20, paddingHorizontal: 24},
  heading: {fontSize: 20, fontWeight: '700', color: '#fff', paddingHorizontal: 24, marginBottom: 6},
  subtitle: {fontSize: 14, color: 'rgba(255,255,255,0.85)', paddingHorizontal: 24, lineHeight: 20, marginBottom: 24},
  sectionLabel: {fontSize: 15, fontWeight: '600', color: '#fff', paddingHorizontal: 24, marginBottom: 8},
  inputWrap: {paddingHorizontal: 24, marginBottom: 8},
  input: {backgroundColor: '#fff', borderRadius: 6, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: '#1C1C1E'},
  list: {flex: 1, paddingHorizontal: 24},
  siteRow: {backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 13, marginBottom: 6, flexDirection: 'row', alignItems: 'center'},
  siteRowSelected: {backgroundColor: '#fff'},
  siteRowText: {flex: 1, fontSize: 15, color: '#fff', fontWeight: '500'},
  siteRowTextSelected: {color: BG, fontWeight: '700'},
  empty: {color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginTop: 20},
  buttonRow: {alignItems: 'center', paddingVertical: 28},
  button: {backgroundColor: '#fff', borderRadius: 24, paddingVertical: 14, paddingHorizontal: 56},
  buttonDisabled: {opacity: 0.4},
  buttonText: {color: BG, fontSize: 16, fontWeight: '700'},
});
