import React, {useCallback, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {Camera, useCameraDevice, useCameraPermission, useCodeScanner} from 'react-native-vision-camera';
import {useSessionStore} from '../../store/sessionStore';
import {getUnits, lookupByBarcode} from '../../api/sites';
import type {Unit} from '../../types';

const BG = '#0D7A8C';

type ConfirmState = {scannedUnit: Unit; expectedUnit: Unit};

const TopBar = () => (
  <View style={styles.topBar}>
    <Text style={styles.hamburger}>{'\u2261'}</Text>
    <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
    <View style={styles.topBarSpacer} />
  </View>
);

export const DeploymentScanQRScreen = ({navigation}: any) => {
  const {selectedSite, activeUpload, units, setUnits} = useSessionStore();
  const [loading, setLoading] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [alreadyDeployed, setAlreadyDeployed] = useState<string | null>(null);
  const device = useCameraDevice('back');
  const {hasPermission, requestPermission} = useCameraPermission();

  const nextUnit: Unit | null = units
    ? (units.filter(u => !u.assignment_status && !u.is_skipped).sort((a, b) => a.sequence - b.sequence)[0] ?? null)
    : null;

  useFocusEffect(useCallback(() => {
    if (!activeUpload) return;
    setLoadingUnits(true);
    setScanned(false);
    setConfirm(null);
    setAlreadyDeployed(null);
    getUnits(activeUpload.upload_id)
      .then(data => {
        setUnits(data);
        const allDone = data.length > 0 && !data.find(u => !u.assignment_status && !u.is_skipped);
        if (allDone) navigation.navigate('DeploymentComplete');
      })
      .catch(() => Alert.alert('Error', 'Failed to load units'))
      .finally(() => setLoadingUnits(false));
  }, [activeUpload, navigation]));

  const onCodeScanned = useCallback(async (codes: any[]) => {
    if (scanned || loading || loadingUnits || !codes[0]?.value || !activeUpload) return;
    const value = codes[0].value;
    setScanned(true);
    setLoading(true);
    try {
      const unit = await lookupByBarcode(activeUpload.upload_id, value);
      setLoading(false);

      // Already deployed check
      if (unit.assignment_status) {
        setAlreadyDeployed(unit.unit_name);
        setScanned(false);
        return;
      }

      if (nextUnit && unit.unit_id !== nextUnit.unit_id) {
        setConfirm({scannedUnit: unit, expectedUnit: nextUnit});
      } else {
        navigation.navigate('DeploymentScanNFC', {
          unitId: unit.unit_id, unitName: unit.unit_name, siteId: unit.site_id,
        });
        setTimeout(() => setScanned(false), 2000);
      }
    } catch (e: any) {
      setLoading(false);
      setScanned(false);
      if (e?.response?.status === 404) {
        Alert.alert('Not Found', 'This barcode is not in the unit list for this site.');
      } else {
        Alert.alert('Error', 'Failed to look up barcode. Check your connection.');
      }
    }
  }, [scanned, loading, loadingUnits, activeUpload, nextUnit, navigation]);

  const codeScanner = useCodeScanner({
    codeTypes: ['code-128', 'code-39', 'code-93', 'ean-13', 'ean-8', 'qr', 'data-matrix'],
    onCodeScanned,
  });

  // Already-deployed inline message
  if (alreadyDeployed) {
    return (
      <View style={styles.container}>
        <TopBar />
        <Text style={styles.title}>Lock Deployment</Text>
        <Text style={styles.siteName}>{selectedSite ? selectedSite.site_name : ''}</Text>
        <View style={styles.messageBody}>
          <Text style={styles.warnLabel}>ALREADY DEPLOYED</Text>
          <Text style={styles.messageText}>
            {'This unit has already been deployed. Scan another unit label.'}
          </Text>
          <Text style={styles.messageUnit}>{alreadyDeployed}</Text>
        </View>
        <View style={styles.centreBottom}>
          <TouchableOpacity style={styles.whiteBtn} onPress={() => { setAlreadyDeployed(null); setScanned(false); }}>
            <Text style={styles.whiteBtnText}>Scan Another</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Wrong-unit confirmation
  if (confirm) {
    return (
      <View style={styles.container}>
        <TopBar />
        <Text style={styles.title}>Lock Deployment</Text>
        <Text style={styles.siteName}>{selectedSite ? selectedSite.site_name : ''}</Text>
        <Text style={styles.unitName}>{'Unit: ' + confirm.expectedUnit.unit_name}</Text>
        <View style={styles.confirmBody}>
          <Text style={styles.confirmText}>
            {'This sticker is for unit ' + confirm.scannedUnit.unit_name + ' instead of ' + confirm.expectedUnit.unit_name + '.'}
          </Text>
          <Text style={styles.confirmQuestion}>
            {'Are you sure you want to deploy ' + confirm.scannedUnit.unit_name + '?'}
          </Text>
        </View>
        <View style={styles.confirmButtons}>
          <TouchableOpacity style={styles.confirmBtn} onPress={() => { setConfirm(null); setScanned(false); }}>
            <Text style={styles.confirmBtnText}>Rescan</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.confirmBtn} onPress={() => {
            const u = confirm.scannedUnit;
            setConfirm(null);
            navigation.navigate('DeploymentScanNFC', {unitId: u.unit_id, unitName: u.unit_name, siteId: u.site_id});
          }}>
            <Text style={styles.confirmBtnText}>Confirm</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <TopBar />
        <Text style={styles.title}>Lock Deployment</Text>
        <View style={styles.centreWrap}>
          <Text style={styles.bodyText}>Camera permission is required to scan barcodes.</Text>
          <TouchableOpacity style={styles.whiteBtn} onPress={requestPermission}>
            <Text style={styles.whiteBtnText}>Grant Camera Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <TopBar />
        <Text style={styles.title}>Lock Deployment</Text>
        <Text style={styles.bodyText}>Camera not available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopBar />
      <Text style={styles.title}>Lock Deployment</Text>
      <Text style={styles.siteName}>{selectedSite ? selectedSite.site_name : ''}</Text>
      {loadingUnits ? (
        <ActivityIndicator color="#fff" style={{marginTop: 8, marginBottom: 24}} />
      ) : (
        <Text style={styles.unitName}>{'Unit: ' + (nextUnit ? nextUnit.unit_name : '...')}</Text>
      )}
      <Text style={styles.sectionLabel}>Scan Unit ID Sticker</Text>
      <View style={styles.frameWrap}>
        <View style={styles.frame}>
          <Camera
            style={styles.camera}
            device={device}
            isActive={!loading && !loadingUnits}
            codeScanner={codeScanner}
          />
        </View>
        <Text style={styles.frameHint}>Place the code inside this frame</Text>
      </View>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Looking up barcode...</Text>
        </View>
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
  title: {fontSize: 20, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 2, paddingHorizontal: 24},
  siteName: {fontSize: 15, color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginBottom: 2},
  unitName: {fontSize: 18, fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: 20},
  sectionLabel: {fontSize: 18, fontWeight: '700', color: '#fff', paddingHorizontal: 24, marginBottom: 14},
  frameWrap: {alignItems: 'center', paddingHorizontal: 24},
  frame: {width: '100%', aspectRatio: 1.6, borderWidth: 2, borderColor: '#fff', borderRadius: 4, overflow: 'hidden', backgroundColor: '#000'},
  camera: {flex: 1},
  frameHint: {color: 'rgba(255,255,255,0.85)', fontSize: 14, marginTop: 14, textAlign: 'center'},
  loadingOverlay: {position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(13,122,140,0.85)', alignItems: 'center', justifyContent: 'center'},
  loadingText: {color: '#fff', marginTop: 12, fontSize: 16},
  // Already deployed
  messageBody: {paddingHorizontal: 24, marginTop: 24, flex: 1},
  warnLabel: {fontSize: 14, fontWeight: '800', color: '#FFD700', letterSpacing: 1, marginBottom: 12},
  messageText: {fontSize: 16, color: '#fff', lineHeight: 24, marginBottom: 16},
  messageUnit: {fontSize: 20, fontWeight: '700', color: '#fff'},
  centreBottom: {position: 'absolute', bottom: 48, left: 0, right: 0, alignItems: 'center'},
  // Confirmation
  confirmBody: {paddingHorizontal: 24, marginTop: 16, flex: 1},
  confirmText: {fontSize: 16, color: '#fff', lineHeight: 24, marginBottom: 20},
  confirmQuestion: {fontSize: 16, color: '#fff', lineHeight: 24},
  confirmButtons: {flexDirection: 'row', paddingHorizontal: 24, paddingBottom: 48, gap: 16},
  confirmBtn: {flex: 1, backgroundColor: '#fff', borderRadius: 24, paddingVertical: 14, alignItems: 'center'},
  confirmBtnText: {color: BG, fontSize: 16, fontWeight: '700'},
  centreWrap: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32},
  bodyText: {color: 'rgba(255,255,255,0.85)', fontSize: 15, textAlign: 'center', marginBottom: 24, paddingHorizontal: 24},
  whiteBtn: {backgroundColor: '#fff', borderRadius: 24, paddingVertical: 14, paddingHorizontal: 56},
  whiteBtnText: {color: BG, fontSize: 16, fontWeight: '700'},
});
