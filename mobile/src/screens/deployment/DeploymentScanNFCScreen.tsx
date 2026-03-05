import React, {useEffect, useRef, useState} from 'react';
import {Animated, Easing, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {cancelNfcRead, initNfc, readNfcTag} from '../../services/nfc';
import {validateDevEui} from '../../services/deveui';

export const DeploymentScanNFCScreen = ({navigation, route}: any) => {
  const {unitId, siteId} = route.params;
  const [status, setStatus] = useState<'waiting' | 'reading' | 'error'>('waiting');
  const [errorMsg, setErrorMsg] = useState('');
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {toValue: 1.15, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true}),
        Animated.timing(pulse, {toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true}),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  const startRead = async () => {
    setStatus('reading');
    setErrorMsg('');
    const ready = await initNfc();
    if (!ready) {
      setStatus('error');
      setErrorMsg('NFC is not available or disabled on this device');
      return;
    }
    try {
      const raw = await readNfcTag();
      const {valid, normalized, error} = validateDevEui(raw);
      if (!valid) {
        setStatus('error');
        setErrorMsg(error || 'Invalid DevEUI');
        return;
      }
      navigation.navigate('DeploymentConfirm', {unitId, siteId, devEuiRaw: raw, devEuiNormalized: normalized});
      setStatus('waiting');
    } catch (e: any) {
      setStatus('error');
      setErrorMsg(e.message || 'Failed to read NFC tag');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scan Lock</Text>
      <Text style={styles.unitLabel}>Unit: {unitId}</Text>

      <Animated.View style={[styles.nfcCircle, {transform: [{scale: pulse}]}]}>
        <Text style={styles.nfcIcon}>📡</Text>
      </Animated.View>

      <Text style={styles.instruction}>
        {status === 'waiting' ? 'Tap the button and hold your phone to the lock' :
         status === 'reading' ? 'Reading lock NFC...' : 'Error reading lock'}
      </Text>

      {status === 'error' && <Text style={styles.error}>{errorMsg}</Text>}

      <TouchableOpacity style={[styles.button, status === 'reading' && styles.buttonDisabled]} onPress={startRead} disabled={status === 'reading'}>
        <Text style={styles.buttonText}>{status === 'reading' ? 'Reading...' : 'Read NFC'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelBtn} onPress={() => { cancelNfcRead(); navigation.goBack(); }}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F2F2F7', alignItems: 'center', justifyContent: 'center', padding: 24},
  title: {fontSize: 24, fontWeight: '700', color: '#1C1C1E', marginBottom: 4},
  unitLabel: {fontSize: 15, color: '#8E8E93', marginBottom: 40},
  nfcCircle: {width: 160, height: 160, borderRadius: 80, backgroundColor: '#007AFF22', alignItems: 'center', justifyContent: 'center', marginBottom: 32},
  nfcIcon: {fontSize: 64},
  instruction: {fontSize: 16, color: '#3C3C43', textAlign: 'center', marginBottom: 8},
  error: {fontSize: 14, color: '#FF3B30', textAlign: 'center', marginVertical: 8, paddingHorizontal: 16},
  button: {backgroundColor: '#007AFF', borderRadius: 12, paddingHorizontal: 40, paddingVertical: 16, marginTop: 24},
  buttonDisabled: {backgroundColor: '#99C0FF'},
  buttonText: {color: '#fff', fontSize: 17, fontWeight: '600'},
  cancelBtn: {marginTop: 16, padding: 12},
  cancelText: {color: '#FF3B30', fontSize: 16},
});
