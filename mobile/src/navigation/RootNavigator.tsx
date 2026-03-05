import React, {useEffect, useState} from 'react';
import {ActivityIndicator, View} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useAuthStore} from '../store/authStore';
import {initSyncService} from '../services/syncService';

import {LoginScreen} from '../screens/auth/LoginScreen';
import {SiteSelectionScreen} from '../screens/home/SiteSelectionScreen';
import {ModeSelectionScreen} from '../screens/home/ModeSelectionScreen';
import {DeploymentScanQRScreen} from '../screens/deployment/DeploymentScanQRScreen';
import {DeploymentScanNFCScreen} from '../screens/deployment/DeploymentScanNFCScreen';
import {DeploymentConfirmScreen} from '../screens/deployment/DeploymentConfirmScreen';
import {GuidedUnitListScreen} from '../screens/guided/GuidedUnitListScreen';
import {GuidedScanNFCScreen} from '../screens/guided/GuidedScanNFCScreen';
import {GuidedSkipScreen} from '../screens/guided/GuidedSkipScreen';
import {AdHocScanScreen} from '../screens/adhoc/AdHocScanScreen';
import {AdHocConfirmScreen} from '../screens/adhoc/AdHocConfirmScreen';
import {ConflictListScreen} from '../screens/conflicts/ConflictListScreen';

const Stack = createNativeStackNavigator();

export const RootNavigator = () => {
  const {isAuthenticated, restoreSession} = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    restoreSession().finally(() => setLoading(false));
    initSyncService();
  }, [restoreSession]);

  if (loading) {
    return <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}><ActivityIndicator size="large" color="#007AFF" /></View>;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{headerShown: true}}>
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} options={{headerShown: false}} />
        ) : (
          <>
            <Stack.Screen name="SiteSelection" component={SiteSelectionScreen} options={{title: 'Select Site', headerBackVisible: false}} />
            <Stack.Screen name="ModeSelection" component={ModeSelectionScreen} options={{title: 'Mode'}} />
            <Stack.Screen name="DeploymentScanQR" component={DeploymentScanQRScreen} options={{title: 'Scan QR Sticker', headerShown: false}} />
            <Stack.Screen name="DeploymentScanNFC" component={DeploymentScanNFCScreen} options={{title: 'Scan Lock'}} />
            <Stack.Screen name="DeploymentConfirm" component={DeploymentConfirmScreen} options={{title: 'Confirm'}} />
            <Stack.Screen name="GuidedUnitList" component={GuidedUnitListScreen} options={{title: 'Units'}} />
            <Stack.Screen name="GuidedScanNFC" component={GuidedScanNFCScreen} options={{title: 'Scan Lock'}} />
            <Stack.Screen name="GuidedSkip" component={GuidedSkipScreen} options={{title: 'Skip Unit'}} />
            <Stack.Screen name="AdHocScan" component={AdHocScanScreen} options={{title: 'Ad-Hoc Scan'}} />
            <Stack.Screen name="AdHocConfirm" component={AdHocConfirmScreen} options={{title: 'Result'}} />
            <Stack.Screen name="ConflictList" component={ConflictListScreen} options={{title: 'Needs Action'}} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
