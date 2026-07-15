import React, {useEffect} from 'react';
import {Alert, Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useSessionStore} from '../../store/sessionStore';
import {getErroredQueueItems, runSync} from '../../services/syncService';

const BG = '#0D7A8C';

export const DeploymentCompleteScreen = ({navigation}: any) => {
  const {selectedSite, activeUpload, units, setUnits} = useSessionStore();

  useEffect(() => {
    runSync();
  }, []);

  const handleComplete = async () => {
    runSync();
    if (activeUpload) {
      const errored = await getErroredQueueItems(activeUpload.upload_id);
      if (errored.length > 0) {
        const names = errored.map(e => units?.find(u => u.unit_id === e.unitId)?.unit_name || e.unitId).join(', ');
        Alert.alert(
          'Unsent Data',
          `${errored.length} item(s) could not be sent and won't be retried automatically: ${names}. Contact your admin to resolve these before this site's data is considered complete.`,
          [
            {text: 'Go Back', style: 'cancel'},
            {text: 'Complete Anyway', style: 'destructive', onPress: () => navigation.navigate('SiteSelection')},
          ],
        );
        return;
      }
    }
    navigation.navigate('SiteSelection');
  };

  const handleReview = () => {
    runSync();
    // Bring skipped units back into the pending pool so DeploymentScanQR picks
    // up the lowest-sequence undeployed unit next.
    if (units) {
      setUnits(units.map(u => (u.is_skipped ? {...u, is_skipped: false} : u)));
    }
    navigation.navigate('DeploymentScanQR');
  };

  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.hamburger}>{'≡'}</Text>
        <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        <View style={styles.topBarSpacer} />
      </View>

      <Text style={styles.title}>Lock Deployment</Text>
      <Text style={styles.siteName}>{selectedSite ? selectedSite.site_name : ''}</Text>

      <Text style={styles.heading}>{'Deployment for Site\nComplete'}</Text>

      <View style={styles.bottomButtons}>
        <TouchableOpacity style={styles.outlineBtn} onPress={handleReview}>
          <Text style={styles.outlineBtnText}>Review Undeployed Units</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.whiteBtn} onPress={handleComplete}>
          <Text style={styles.whiteBtnText}>Complete Site</Text>
        </TouchableOpacity>
      </View>
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
  siteName: {fontSize: 15, color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginBottom: 28},
  heading: {fontSize: 24, fontWeight: '700', color: '#fff', paddingHorizontal: 24, lineHeight: 32},
  bottomButtons: {position: 'absolute', bottom: 48, left: 24, right: 24, gap: 12},
  whiteBtn: {backgroundColor: '#fff', borderRadius: 24, paddingVertical: 14, alignItems: 'center'},
  whiteBtnText: {color: BG, fontSize: 16, fontWeight: '700'},
  outlineBtn: {borderWidth: 2, borderColor: '#fff', borderRadius: 24, paddingVertical: 14, alignItems: 'center'},
  outlineBtnText: {color: '#fff', fontSize: 16, fontWeight: '700'},
});
