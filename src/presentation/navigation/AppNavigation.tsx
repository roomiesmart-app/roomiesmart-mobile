import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Compass, MessageCircle, DollarSign } from 'lucide-react-native';

import { getSession } from '../../core/session';
import { OnboardingProvider } from '../../core/onboarding';
import { LoginScreen } from '../screens/LoginScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { ExploreSpacesScreen } from '../screens/ExploreSpacesScreen';
import { InboxScreen } from '../screens/InboxScreen';
import { FinanceScreen } from '../screens/FinanceScreen';
import { PublishSpaceScreen } from '../screens/PublishSpaceScreen';
import { SpaceRequestsScreen } from '../screens/SpaceRequestsScreen';
import { OnboardingIdentityScreen } from '../screens/onboarding/OnboardingIdentityScreen';
import { OnboardingLifestyleScreen } from '../screens/onboarding/OnboardingLifestyleScreen';
import { OnboardingSocialScreen } from '../screens/onboarding/OnboardingSocialScreen';
import { OnboardingFinancialScreen } from '../screens/onboarding/OnboardingFinancialScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#8C3A27',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#F2E3DB',
          height: 60,
          paddingBottom: 5,
        }
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{ tabBarIcon: ({ color, size }) => <Home color={color} size={size} />, tabBarLabel: 'Roomies' }} 
      />
      <Tab.Screen 
        name="Espacios" 
        component={ExploreSpacesScreen} 
        options={{ tabBarIcon: ({ color, size }) => <Compass color={color} size={size} /> }} 
      />
      <Tab.Screen 
        name="Mensajes" 
        component={InboxScreen} 
        options={{ tabBarIcon: ({ color, size }) => <MessageCircle color={color} size={size} /> }} 
      />
      <Tab.Screen 
        name="Finanzas" 
        component={FinanceScreen} 
        options={{ tabBarIcon: ({ color, size }) => <DollarSign color={color} size={size} /> }} 
      />
    </Tab.Navigator>
  );
}

export function AppNavigation() {
  const [initialRoute, setInitialRoute] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const session = await getSession();
      setInitialRoute(session ? 'MainApp' : 'Login');
    };
    checkSession();
  }, []);

  if (!initialRoute) {
    return null; // Or a loading splash screen
  }

  return (
    <NavigationContainer>
      <OnboardingProvider>
        <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="OnboardingIdentity" component={OnboardingIdentityScreen} />
          <Stack.Screen name="OnboardingLifestyle" component={OnboardingLifestyleScreen} />
          <Stack.Screen name="OnboardingSocial" component={OnboardingSocialScreen} />
          <Stack.Screen name="OnboardingFinancial" component={OnboardingFinancialScreen} />
          <Stack.Screen name="MainApp" component={TabNavigator} />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="PublishSpace" component={PublishSpaceScreen} options={{ presentation: 'modal' }} />
          <Stack.Screen name="SpaceRequests" component={SpaceRequestsScreen} />
        </Stack.Navigator>
      </OnboardingProvider>
    </NavigationContainer>
  );
}
