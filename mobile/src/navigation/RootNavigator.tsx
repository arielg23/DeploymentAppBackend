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
import {DeploymentCompleteScreen} from '../screens/deployment/DeploymentCompleteScreen';
import {AllSitesCompleteScreen} from '../screens/deployment/AllSitesCompleteScreen';
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
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0D7A8C'}}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="SiteSelection" component={SiteSelectionScreen} />
            <Stack.Screen name="ModeSelection" component={ModeSelectionScreen} />
            <Stack.Screen name="DeploymentScanQR" component={DeploymentScanQRScreen} />
            <Stack.Screen name="DeploymentScanNFC" component={DeploymentScanNFCScreen} />
            <Stack.Screen name="DeploymentComplete" component={DeploymentCompleteScreen} />
            <Stack.Screen name="AllSitesComplete" component={AllSitesCompleteScreen} />
            <Stack.Screen name="GuidedUnitList" component={GuidedUnitListScreen} />
            <Stack.Screen name="GuidedScanNFC" component={GuidedScanNFCScreen} />
            <Stack.Screen name="GuidedSkip" component={GuidedSkipScreen} />
            <Stack.Screen name="AdHocScan" component={AdHocScanScreen} />
            <Stack.Screen name="AdHocConfirm" component={AdHocConfirmScreen} />
            <Stack.Screen name="ConflictList" component={ConflictListScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
