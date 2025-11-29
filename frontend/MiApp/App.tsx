// App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AuthScreen from './screens/AuthScreen';
import HomeScreen from './screens/HomeScreen';
import CreateBusinessScreen from './screens/CreateBusinessScreen';
import { AuthProvider } from './contexts/AuthContext';

const Stack = createStackNavigator();

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Auth" component={AuthScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="CreateBusiness" component={CreateBusinessScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}