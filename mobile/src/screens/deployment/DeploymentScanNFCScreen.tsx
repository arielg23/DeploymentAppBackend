import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useSessionStore} from '../../store/sessionStore';
import {readNfcTag, cancelNfcRead, initNfc} from '../../services/nfc';
import {submitAssignment, submitSkip} from '../../api/sites';

const BG = '#0D7A8C';
type ScreenState = 'scanning' | 'assigning' | 'success' | 'error';

const TopBar = () => (
  <View style={styles.topBar}>
    <Text style={styles.hamburger}>{'\u2261'}</Text>
    <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
    <View style={styles.topBarSpacer} />
  </View>
);

export const DeploymentScanNFCScreen = ({route, navigation}: any) => {
  const {unitId, unitName, siteId} = route.params as {unitId: string; unitName: string; siteId: string};
  const {selectedSite, activeUpload, units} = useSessionStore();
  const [state, setState] = useState<ScreenState>('scanning');
  const [errorMsg, setErrorMsg] = useState('');
  const [conflictUnit, setConflictUnit] = useState<string | null>(null);
  const scanning = useRef(false);

  const startScan = useCallback(async () => {
    if (scanning.current) return;
    scanning.current = true;
    setState('scanning');
    setErrorMsg('');
    setConflictUnit(null);
    try {
      await initNfc();
      const devEui = await readNfcTag();
      setState('assigning');
      if (!activeUpload) throw new Error('No active upload');
      await submitAssignment(activeUpload.upload_id, {
        site_id: siteId,
        unit_id: unitId,
        dev_eui_raw: devEui,
        timestamp_local: new Date().toISOString(),
      });
      setState('success');
    } catch (e: any) {
      const responseDetail = e?.response?.data?.detail;
      if (e?.response?.status === 409 && responseDetail?.conflict_type === 'dev_eui') {
        const conflictUnitId = responseDetail.existing?.unit_id;
        const friendlyName = units?.find(u => u.unit_id === conflictUnitId)?.unit_name;
        setConflictUnit(friendlyName || conflictUnitId || 'another unit');
      } else if (e?.response?.status === 409 && responseDetail?.conflict_type === 'unit') {
        setErrorMsg('This unit was already assigned by another technician.');
      } else {
        const msg = typeof responseDetail === 'string' ? responseDetail : e?.message || 'An unexpected error occurred.';
        setErrorMsg(msg);
      }
      setState('error');
    } finally {
      scanning.current = false;
    }
  }, [activeUpload, siteId, unitId]);

  useEffect(() => {
    startScan();
    return () => { cancelNfcRead(); };
  }, [startScan]);

  const handleSkip = useCallback(() => {
    Alert.alert('Skip Unit', 'Are you sure you want to skip this unit?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Skip', style: 'destructive', onPress: async () => {
          try {
            if (activeUpload) {
              await submitSkip(activeUpload.upload_id, {site_id: siteId, unit_id: unitId});
            }
          } catch {}
          navigation.navigate('DeploymentScanQR');
        },
      },
    ]);
  }, [activeUpload, siteId, unitId, navigation]);

  const siteName = selectedSite ? selectedSite.site_name : '';

  return (
    <View style={styles.container}>
      <TopBar />
      <Text style={styles.title}>Lock Deployment</Text>
      <Text style={styles.siteName}>{siteName}</Text>
      <Text style={styles.sectionLabel}>Read lock NFC ID</Text>

      {(state === 'scanning' || state === 'assigning') && (
        <>
          <Text style={styles.bodyText}>
            {state === 'assigning' ? 'Assigning lock...' : 'Place your phone on the lock'}
          </Text>
          <View style={styles.unitBox}>
            {state === 'assigning'
              ? <ActivityIndicator color={BG} size="large" />
              : <Text style={styles.unitBoxText}>{unitName}</Text>
            }
          </View>
          {state === 'scanning' && (
            <Text style={styles.hintText}>Hold still — the lock will be read automatically</Text>
          )}
        </>
      )}

      {state === 'success' && (
        <>
          <Text style={styles.bodyText}>NFC ID Detected</Text>
          <Text style={styles.bodyText}>{'Lock is associated with ' + unitName}</Text>
          <View style={styles.centreBottom}>
            <TouchableOpacity
              style={styles.continueBtn}
              onPress={() => navigation.navigate('DeploymentScanQR')}>
              <Text style={styles.continueBtnText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {state === 'error' && (
        <>
          <Text style={styles.bodyText}>NFC ID Detected</Text>
          {conflictUnit
            ? <Text style={styles.bodyText}>{'Lock is associated with ' + conflictUnit}</Text>
            : <>
                <Text style={styles.errorLabel}>ERROR</Text>
                <Text style={styles.errorText}>{errorMsg || 'An error has been reported.'}</Text>
              </>
          }
          <View style={styles.errorButtons}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleSkip}>
              <Text style={styles.actionBtnText}>Skip Unit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => { scanning.current = false; startScan(); }}>
              <Text style={[styles.actionBtnText, {textAlign: 'center'}]}>{'Different\nLock'}</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: BG},
  topBar: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 52, paddingBottom: 8},
  hamburger: {fontSize: 26, color: '#fff', width: 36},
  logo: {flex: 1, height: 72},
  topBarSpacer: {width: 36},
  title: {fontSize: 20, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 2},
  siteName: {fontSize: 15, color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginBottom: 24},
  sectionLabel: {fontSize: 20, fontWeight: '700', color: '#fff', paddingHorizontal: 24, marginBottom: 12},
  bodyText: {fontSize: 15, color: '#fff', paddingHorizontal: 24, marginBottom: 4, lineHeight: 22},
  hintText: {fontSize: 14, color: 'rgba(255,255,255,0.7)', paddingHorizontal: 24, marginTop: 12, textAlign: 'center'},
  unitBox: {
    marginHorizontal: 24, marginTop: 16,
    borderWidth: 2, borderColor: '#fff', borderRadius: 4,
    paddingVertical: 24, paddingHorizontal: 16,
    alignItems: 'center', justifyContent: 'center',
    minHeight: 80,
  },
  unitBoxText: {fontSize: 26, fontWeight: '800', color: '#fff', textAlign: 'center'},
  errorLabel: {fontSize: 16, fontWeight: '800', color: '#FF4444', paddingHorizontal: 24, marginTop: 12, marginBottom: 4},
  errorText: {fontSize: 15, color: '#fff', paddingHorizontal: 24, lineHeight: 22},
  centreBottom: {position: 'absolute', bottom: 48, left: 0, right: 0, alignItems: 'center'},
  continueBtn: {backgroundColor: '#fff', borderRadius: 24, paddingVertical: 14, paddingHorizontal: 56},
  continueBtnText: {color: BG, fontSize: 16, fontWeight: '700'},
  errorButtons: {position: 'absolute', bottom: 48, left: 24, right: 24, flexDirection: 'row', gap: 16},
  actionBtn: {flex: 1, backgroundColor: '#fff', borderRadius: 24, paddingVertical: 14, alignItems: 'center'},
  actionBtnText: {color: BG, fontSize: 15, fontWeight: '700'},
});
