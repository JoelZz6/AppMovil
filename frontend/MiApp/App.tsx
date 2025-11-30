// App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AuthScreen from './screens/AuthScreen';
import HomeScreen from './screens/HomeScreen';
import CreateBusinessScreen from './screens/CreateBusinessScreen';
import { AuthProvider } from './contexts/AuthContext';
import BusinessDashboard from './screens/BusinessDashboard';
import SalesHistoryScreen from './screens/SalesHistoryScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Auth" component={AuthScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="CreateBusiness" component={CreateBusinessScreen} />
          <Stack.Screen name="BusinessDashboard" component={BusinessDashboard} options={{ title: 'Mi Negocio' }} />
          <Stack.Screen name="HistorialVentas" component={SalesHistoryScreen} options={{ title: 'Historial de Ventas' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}