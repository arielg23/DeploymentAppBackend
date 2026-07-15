import React, {useState} from 'react';
import {
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {useSessionStore} from '../../store/sessionStore';
import {useSyncStore} from '../../store/syncStore';
import type {AppMode} from '../../types';

const BG = '#0D7A8C';

const MODE_OPTIONS: {mode: AppMode; label: string}[] = [
  {mode: 'deployment', label: 'Deployment'},
  {mode: 'guided', label: 'Guided Validation'},
  {mode: 'adhoc', label: 'Ad-hoc Validation'},
];

export const ModeSelectionScreen = ({navigation}: any) => {
  const {selectedSite, setMode} = useSessionStore();
  const {conflictCount} = useSyncStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState<AppMode | null>('deployment');

  const handleContinue = () => {
    if (!selectedMode) return;
    setMode(selectedMode);
    if (selectedMode === 'deployment') navigation.navigate('DeploymentScanQR');
    else if (selectedMode === 'guided') navigation.navigate('GuidedUnitList');
    else navigation.navigate('AdHocScan');
  };

  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => setMenuOpen(true)} hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}>
          <Text style={styles.hamburger}>{'\u2261'}</Text>
        </TouchableOpacity>
        <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        <View style={styles.topBarSpacer} />
      </View>

      <Text style={styles.title}>Lock Deployment</Text>
      <Text style={styles.siteName}>{selectedSite ? selectedSite.site_name : ''}</Text>
      <Text style={styles.welcome}>Welcome!</Text>
      {selectedMode && (
        <Text style={styles.selectedLabel}>
          {'Mode: ' + MODE_OPTIONS.find(m => m.mode === selectedMode)?.label}
        </Text>
      )}
      <Text style={styles.hint}>Tap {'\u2261'} to change a mode</Text>

      {conflictCount > 0 && (
        <TouchableOpacity style={styles.conflictBanner} onPress={() => navigation.navigate('ConflictList')}>
          <Text style={styles.conflictText}>{'\u26A0\uFE0F  ' + conflictCount + ' conflict' + (conflictCount !== 1 ? 's' : '') + ' need attention'}</Text>
        </TouchableOpacity>
      )}

      <View style={styles.bottomRow}>
        <TouchableOpacity
          style={[styles.whiteBtn, !selectedMode && styles.whiteBtnDisabled]}
          onPress={handleContinue}
          disabled={!selectedMode}>
          <Text style={styles.whiteBtnText}>Continue</Text>
        </TouchableOpacity>
      </View>

      {/* Dropdown menu */}
      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <TouchableWithoutFeedback onPress={() => setMenuOpen(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.dropdown}>
                {MODE_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt.mode}
                    style={[styles.dropdownItem, selectedMode === opt.mode && styles.dropdownItemActive]}
                    onPress={() => { setSelectedMode(opt.mode); setMenuOpen(false); }}>
                    <Text style={[styles.dropdownText, selectedMode === opt.mode && styles.dropdownTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
  siteName: {fontSize: 15, color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginBottom: 20},
  welcome: {fontSize: 26, fontWeight: '700', color: '#fff', paddingHorizontal: 24, marginBottom: 12},
  selectedLabel: {fontSize: 16, color: '#fff', paddingHorizontal: 24, fontWeight: '600'},
  hint: {fontSize: 14, color: 'rgba(255,255,255,0.65)', paddingHorizontal: 24},
  conflictBanner: {marginHorizontal: 24, backgroundColor: '#FF3B30', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 24},
  conflictText: {color: '#fff', fontWeight: '600', fontSize: 15},
  bottomRow: {position: 'absolute', bottom: 48, right: 24},
  whiteBtn: {backgroundColor: '#fff', borderRadius: 24, paddingVertical: 14, paddingHorizontal: 32},
  whiteBtnDisabled: {opacity: 0.4},
  whiteBtnText: {color: BG, fontSize: 16, fontWeight: '700'},
  // Dropdown
  modalOverlay: {flex: 1},
  dropdown: {
    position: 'absolute', top: 100, left: 16,
    backgroundColor: '#fff', borderRadius: 8,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, elevation: 8,
    minWidth: 200, overflow: 'hidden',
  },
  dropdownItem: {paddingVertical: 14, paddingHorizontal: 20},
  dropdownItemActive: {backgroundColor: '#E6F7F6'},
  dropdownText: {fontSize: 16, color: '#1C1C1E'},
  dropdownTextActive: {color: BG, fontWeight: '700'},
});
