// screens/HomeScreen.tsx
import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

type UserRole = 'cliente' | 'GerenteNegocio' | 'Empleado';

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface HomeScreenProps {
  route: {
    params?: {
      user?: User;
    };
  };
  navigation: any;
}

const roleDisplayName: Record<UserRole, string> = {
  cliente: 'Cliente',
  GerenteNegocio: 'Gerente de Negocio',
  Empleado: 'Empleado',
};

export default function HomeScreen({ route, navigation }: HomeScreenProps) {
  const user = route.params?.user;

  const displayRole = user?.role ? roleDisplayName[user.role] : 'Cliente';

  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>
        ¡Hola, {user?.name || 'Usuario'}!
      </Text>
      
      <Text style={styles.role}>Rol: {displayRole}</Text>
      
      <Text style={styles.email}>{user?.email}</Text>
      
      <Text style={styles.id}>
        ID: {user?.id ? `${user.id.slice(0, 8)}...` : '—'}
      </Text>

      <View style={styles.logoutButton}>
        <Button title="Cerrar sesión" onPress={() => navigation.replace('Auth')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  welcome: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  role: {
    fontSize: 20,
    fontWeight: '600',
    color: '#007bff',
    marginBottom: 10,
  },
  email: {
    fontSize: 16,
    color: '#555',
    marginBottom: 5,
  },
  id: {
    fontSize: 12,
    color: '#999',
    marginBottom: 40,
  },
  logoutButton: {
    marginTop: 30,
    width: '80%',
  },
});