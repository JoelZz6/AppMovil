// screens/BusinessDashboard.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  Image,
  StyleSheet,
  Alert,
} from 'react-native';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
const API_URL = 'http://192.168.0.8:3000';
export default function BusinessDashboard({ navigation }: any) {
  const { user, token } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    imageUrl: '',
  });
  const loadProducts = async () => {
    try {
      const res = await axios.get(`${API_URL}/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(res.data);
    } catch (error: any) {
      console.log('Error cargando productos:', error.response?.data || error.message);
    }
  };
  const addProduct = async () => {
    if (!form.name.trim() || !form.price.trim()) {
      return Alert.alert('Error', 'Nombre y precio son obligatorios');
    }
    try {
      await axios.post(
        `${API_URL}/products`,
        {
          name: form.name,
          description: form.description || null,
          price: parseFloat(form.price),
          stock: parseInt(form.stock) || 0,
          imageUrl: form.imageUrl || null,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      Alert.alert('Éxito', 'Producto agregado correctamente');
      setForm({ name: '', description: '', price: '', stock: '', imageUrl: '' });
      loadProducts();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Error desconocido');
    }
  };
  useEffect(() => {
    loadProducts();
  }, []);
  return (
    <FlatList
      data={products}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={{ padding: 15, backgroundColor: '#f8f9fa' }}
     
      // ⬇⬇⬇ AQUÍ VA EL FORMULARIO COMO HEADER
      ListHeaderComponent={
        <View>
          <Text style={styles.title}>Mi Negocio Digital</Text>
          <Text style={styles.subtitle}>Bienvenido, {user?.name}</Text>
          <View style={styles.form}>
            <Text style={styles.label}>Agregar Nuevo Producto</Text>
            <TextInput
              placeholder="Nombre del producto"
              style={styles.input}
              value={form.name}
              onChangeText={(text) => setForm({ ...form, name: text })}
            />
            <TextInput
              placeholder="Descripción (opcional)"
              style={styles.input}
              value={form.description}
              onChangeText={(text) =>
                setForm({ ...form, description: text })
              }
            />
            <TextInput
              placeholder="Precio"
              style={styles.input}
              keyboardType="numeric"
              value={form.price}
              onChangeText={(text) => setForm({ ...form, price: text })}
            />
            <TextInput
              placeholder="Stock (opcional)"
              style={styles.input}
              keyboardType="numeric"
              value={form.stock}
              onChangeText={(text) => setForm({ ...form, stock: text })}
            />
            <TextInput
              placeholder="URL de imagen (opcional)"
              style={styles.input}
              value={form.imageUrl}
              onChangeText={(text) => setForm({ ...form, imageUrl: text })}
            />
            <Button title="Agregar Producto" onPress={addProduct} color="#28a745" />
          </View>
          <Text style={styles.section}>Mis Productos ({products.length})</Text>
        </View>
      }
     
      renderItem={({ item }) => (
        <View style={styles.productCard}>
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} style={styles.image} />
          ) : (
            <View style={styles.noImage}>
              <Text style={{ color: '#888' }}>Sin imagen</Text>
            </View>
          )}
          <View style={styles.info}>
            <Text style={styles.name}>{item.name}</Text>
            <Text numberOfLines={2} style={{ color: '#666' }}>
              {item.description || 'Sin descripción'}
            </Text>
            <Text style={styles.price}>${parseFloat(item.price).toFixed(2)}</Text>
            <Text style={{ color: '#444' }}>Stock: {item.stock}</Text>
          </View>
        </View>
      )}
     
      ListEmptyComponent={
        <Text style={{ textAlign: 'center', color: '#999', marginTop: 30 }}>
          Aún no tienes productos. ¡Agrega el primero!
        </Text>
      }
    />
  );
}
const styles = StyleSheet.create({
  container: { padding: 15, backgroundColor: '#f8f9fa' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginVertical: 20, color: '#333' },
  subtitle: { fontSize: 18, textAlign: 'center', color: '#666', marginBottom: 20 },
  form: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 4,
  },
  label: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#333' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  section: { fontSize: 22, fontWeight: 'bold', marginVertical: 20, color: '#333' },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 3,
  },
  image: { width: 80, height: 80, borderRadius: 10 },
  noImage: {
    width: 80,
    height: 80,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: { marginLeft: 15, flex: 1, justifyContent: 'center' },
  name: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  price: { fontSize: 20, color: '#28a745', fontWeight: 'bold', marginTop: 6 },
});