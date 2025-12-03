import React, { useState } from 'react';
import { View, Text, TextInput, Button, ScrollView, Alert, TouchableOpacity, StyleSheet } from 'react-native';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const API_URL = 'http://192.168.0.8:3000'; // Cambia si usas otro IP

export default function CreateBusinessScreen({ navigation }: any) {
  const { token,login } = useAuth();
  const [form, setForm] = useState({
    name: '',
    category: '',
    description: '',
    phone: '',
    address: '',
  });
  const [accepted, setAccepted] = useState(false);

  const handleSubmit = async () => {
    if (!accepted) return Alert.alert('Error', 'Debes aceptar los términos y condiciones');
    if (!token) return Alert.alert('Error', 'No estás autenticado');

    try {
      const response = await axios.post(`${API_URL}/business`, form, {
  headers: { Authorization: `Bearer ${token}` },
});

// ¡¡AHORA SÍ REFRESCAMOS EL TOKEN CORRECTAMENTE!!
if (response.data.token && response.data.user) {
  await login(response.data.token, response.data.user);
} else if (response.data.user) {
  // fallback (por si acaso)
  await login(token!, response.data.user);
}

Alert.alert('Éxito', '¡Tu negocio ha sido creado con éxito!', [
  { text: 'Genial', onPress: () => navigation.replace('Home') },
]);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'No se pudo crear el negocio');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Crea tu negocio</Text>

      <TextInput placeholder="Nombre del negocio" style={styles.input} onChangeText={t => setForm({ ...form, name: t })} />
      <TextInput placeholder="Categoría (ej: Restaurante)" style={styles.input} onChangeText={t => setForm({ ...form, category: t })} />
      <TextInput placeholder="Descripción" style={styles.input} multiline numberOfLines={3} onChangeText={t => setForm({ ...form, description: t })} />
      <TextInput placeholder="Teléfono" style={styles.input} onChangeText={t => setForm({ ...form, phone: t })} keyboardType="phone-pad" />
      <TextInput placeholder="Dirección" style={styles.input} onChangeText={t => setForm({ ...form, address: t })} />

      <TouchableOpacity onPress={() => setAccepted(!accepted)} style={styles.checkboxContainer}>
        <View style={[styles.checkbox, accepted && styles.checked]} />
        <Text style={styles.checkboxLabel}>Acepto los términos y condiciones</Text>
      </TouchableOpacity>

      <Button title="Crear mi negocio" onPress={handleSubmit} color="#28a745" />
      <View style={{ height: 10 }} />
      <Button title="Cancelar" onPress={() => navigation.goBack()} color="#dc3545" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 15, borderRadius: 10, marginBottom: 15, backgroundColor: '#fff', fontSize: 16 },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  checkbox: { width: 24, height: 24, borderWidth: 2, borderColor: '#007bff', borderRadius: 4, marginRight: 10 },
  checked: { backgroundColor: '#007bff' },
  checkboxLabel: { fontSize: 16 },
});