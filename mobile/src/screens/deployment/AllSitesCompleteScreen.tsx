import React from 'react';
import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';

const BG = '#0D7A8C';

export const AllSitesCompleteScreen = ({navigation}: any) => (
  <View style={styles.container}>
    <View style={styles.topBar}>
      <Text style={styles.hamburger}>{'\u2261'}</Text>
      <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
      <View style={styles.topBarSpacer} />
    </View>

    <Text style={styles.title}>Lock Deployment</Text>
    <Text style={styles.heading}>Deployment Complete</Text>
    <Text style={styles.bodyText}>No more sites left for deployment</Text>

    <View style={styles.bottomRow}>
      <TouchableOpacity
        style={styles.whiteBtn}
        onPress={() => navigation.navigate('SiteSelection')}>
        <Text style={styles.whiteBtnText}>Continue</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: BG},
  topBar: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 52, paddingBottom: 8},
  hamburger: {fontSize: 26, color: '#fff', width: 36},
  logo: {flex: 1, height: 72},
  topBarSpacer: {width: 36},
  title: {fontSize: 20, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 24},
  heading: {fontSize: 22, fontWeight: '700', color: '#fff', paddingHorizontal: 24, marginBottom: 12},
  bodyText: {fontSize: 15, color: 'rgba(255,255,255,0.85)', paddingHorizontal: 24, lineHeight: 22},
  bottomRow: {position: 'absolute', bottom: 48, right: 24},
  whiteBtn: {backgroundColor: '#fff', borderRadius: 24, paddingVertical: 14, paddingHorizontal: 32},
  whiteBtnText: {color: BG, fontSize: 16, fontWeight: '700'},
});
