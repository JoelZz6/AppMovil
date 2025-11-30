// screens/HomeScreen.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function HomeScreen({ navigation }: any) {
  const { user, logout } = useAuth();

  const hasBusiness = !!user?.businessDbName;

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí',
          onPress: () => {
            logout();
            navigation.replace('Auth');
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>¡Hola, {user?.name || 'Usuario'}!</Text>
      <Text style={styles.email}>{user?.email}</Text>
      <Text style={styles.roles}>Roles: {user?.roles?.join(', ') || 'cliente'}</Text>

      {/* Si NO tiene negocio */}
      {!hasBusiness ? (
        <TouchableOpacity
          style={styles.createBusinessButton}
          onPress={() => navigation.navigate('CreateBusiness')}
        >
          <Text style={styles.createBusinessText}>
            Lleva tu negocio al mundo digital
          </Text>
        </TouchableOpacity>
      ) : (
        <>
          {/* Si YA tiene negocio */}
          <TouchableOpacity
            style={styles.accessBusinessButton}
            onPress={() => navigation.navigate('BusinessDashboard')}
          >
            <Text style={styles.accessBusinessText}>
              Acceder a mi negocio digital
            </Text>
          </TouchableOpacity>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>Tu negocio está activo</Text>
            <Text style={styles.dbName}>Base de datos: {user.businessDbName}</Text>
          </View>
        </>
      )}

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
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
  email: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  roles: {
    fontSize: 14,
    color: '#007bff',
    marginBottom: 30,
    fontWeight: '600',
  },
  createBusinessButton: {
    backgroundColor: '#28a745',
    padding: 20,
    borderRadius: 12,
    width: '90%',
    alignItems: 'center',
    marginBottom: 20,
  },
  createBusinessText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  accessBusinessButton: {
    backgroundColor: '#007bff',
    padding: 20,
    borderRadius: 12,
    width: '90%',
    alignItems: 'center',
    marginBottom: 20,
  },
  accessBusinessText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoBox: {
    backgroundColor: '#d4edda',
    padding: 20,
    borderRadius: 12,
    width: '90%',
    alignItems: 'center',
    marginBottom: 30,
  },
  infoText: {
    color: '#155724',
    fontWeight: 'bold',
    fontSize: 16,
  },
  dbName: {
    color: '#155724',
    fontSize: 11,
    marginTop: 5,
    fontFamily: 'monospace',
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    padding: 15,
    borderRadius: 10,
    width: '90%',
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});