import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';

export const AdHocConfirmScreen = ({navigation, route}: any) => {
  const {result} = route.params || {};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Validation Result</Text>
      {result ? (
        <View style={styles.card}>
          <Row label="Unit ID" value={result.unit_id} />
          <Row label="Unit Name" value={result.unit_name} />
          <Row label="Site" value={result.site_id} />
          <Row label="DevEUI" value={result.dev_eui_normalized} mono />
          <Row label="Assigned by" value={result.technician_email} />
          <Row label="Timestamp" value={new Date(result.timestamp_local).toLocaleString()} />
        </View>
      ) : (
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>No assignment found</Text>
        </View>
      )}
      <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
        <Text style={styles.buttonText}>Scan Another</Text>
      </TouchableOpacity>
    </View>
  );
};

const Row = ({label, value, mono}: {label: string; value: string; mono?: boolean}) => (
  <View style={rowStyles.row}>
    <Text style={rowStyles.label}>{label}</Text>
    <Text style={[rowStyles.value, mono && rowStyles.mono]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F2F2F7', padding: 20},
  title: {fontSize: 24, fontWeight: '700', color: '#1C1C1E', marginBottom: 20},
  card: {backgroundColor: '#fff', borderRadius: 14, padding: 16, elevation: 1},
  notFound: {backgroundColor: '#fff', borderRadius: 14, padding: 24, alignItems: 'center'},
  notFoundText: {fontSize: 17, color: '#FF3B30'},
  button: {backgroundColor: '#007AFF', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24},
  buttonText: {color: '#fff', fontSize: 16, fontWeight: '600'},
});

const rowStyles = StyleSheet.create({
  row: {flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F2F2F7'},
  label: {fontSize: 14, color: '#8E8E93', fontWeight: '500'},
  value: {fontSize: 14, color: '#1C1C1E', fontWeight: '600', maxWidth: '60%', textAlign: 'right'},
  mono: {fontFamily: 'monospace', fontSize: 13},
});
