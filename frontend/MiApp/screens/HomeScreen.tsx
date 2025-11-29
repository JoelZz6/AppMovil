import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function HomeScreen({ navigation }: any) {
  const { user, logout } = useAuth();

  const hasBusiness = user?.businessDbName;

  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>¡Hola, {user?.name}!</Text>
      <Text style={styles.email}>{user?.email}</Text>
      <Text style={styles.roles}>Roles: {user?.roles?.join(', ')}</Text>

      {!hasBusiness ? (
        <TouchableOpacity
          style={styles.businessButton}
          onPress={() => navigation.navigate('CreateBusiness')}
        >
          <Text style={styles.businessText}>Lleva tu negocio al mundo digital</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.successBox}>
          <Text style={styles.successText}>Tu negocio está activo</Text>
          <Text style={styles.dbName}>{user.businessDbName}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.logoutButton} onPress={() => {
        logout();
        navigation.replace('Auth');
      }}>
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#f8f9fa' },
  welcome: { fontSize: 28, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  email: { fontSize: 16, color: '#666', marginBottom: 5 },
  roles: { fontSize: 14, color: '#007bff', marginBottom: 30 },
  businessButton: { backgroundColor: '#28a745', padding: 20, borderRadius: 12, width: '90%', alignItems: 'center' },
  businessText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  successBox: { backgroundColor: '#d4edda', padding: 20, borderRadius: 12, marginVertical: 20, width: '90%', alignItems: 'center' },
  successText: { color: '#155724', fontWeight: 'bold', fontSize: 18 },
  dbName: { color: '#155724', fontSize: 12, marginTop: 5 },
  logoutButton: { marginTop: 40, padding: 15, backgroundColor: '#dc3545', borderRadius: 10 },
  logoutText: { color: '#fff', fontWeight: 'bold' },
});