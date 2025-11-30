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
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const API_URL = 'http://192.168.0.8:3000';

export default function BusinessDashboard({ navigation }: any) {
  const { user, token } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [saleNote, setSaleNote] = useState('');

  // Formulario para agregar/editar
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    imageUrl: '',
  });

  // Modal edición
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  // Modal vender
  const [saleModalVisible, setSaleModalVisible] = useState(false);
  const [selectedForSale, setSelectedForSale] = useState<any>(null);
  const [saleQuantity, setSaleQuantity] = useState('1');

  const loadProducts = async () => {
    try {
      const res = await axios.get(`${API_URL}/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(res.data);
    } catch (error: any) {
      console.log('Error:', error.response?.data || error.message);
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
          name: form.name.trim(),
          description: form.description.trim() || null,
          price: parseFloat(form.price),
          stock: parseInt(form.stock) || 0,
          imageUrl: form.imageUrl.trim() || null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Éxito', 'Producto agregado');
      setForm({ name: '', description: '', price: '', stock: '', imageUrl: '' });
      loadProducts();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'No se pudo agregar');
    }
  };

  const updateProduct = async () => {
    if (!editingProduct) return;
    try {
      await axios.patch(
        `${API_URL}/products/${editingProduct.id}`,
        {
          name: form.name.trim(),
          description: form.description.trim() || null,
          price: parseFloat(form.price),
          stock: parseInt(form.stock) || 0,
          imageUrl: form.imageUrl.trim() || null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Éxito', 'Producto actualizado');
      setEditModalVisible(false);
      loadProducts();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'No se pudo actualizar');
    }
  };

  const deleteProduct = (id: number, name: string) => {
    Alert.alert('Eliminar producto', `¿Seguro que quieres eliminar "${name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await axios.delete(`${API_URL}/products/${id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            Alert.alert('Eliminado', 'Producto borrado');
            loadProducts();
          } catch (error) {
            Alert.alert('Error', 'No se pudo eliminar');
          }
        },
      },
    ]);
  };

  const openEditModal = (product: any) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      stock: product.stock.toString(),
      imageUrl: product.image_url || '',
    });
    setEditModalVisible(true);
  };

  const registerSale = async () => {
  const qty = parseInt(saleQuantity);
  if (!selectedForSale || qty <= 0 || qty > selectedForSale.stock) {
    return Alert.alert('Error', 'Cantidad inválida');
  }
  try {
    await axios.post(`${API_URL}/products/sale`, {
      productId: selectedForSale.id,
      quantity: qty,
      notes: saleNote.trim() || null,
    }, { headers: { Authorization: `Bearer ${token}` } });

    Alert.alert('Venta registrada', '¡Listo!');
    setSaleModalVisible(false);
    setSaleQuantity('1');
    setSaleNote('');
    loadProducts();
  } catch (error: any) {
    Alert.alert('Error', error.response?.data?.message || 'No se pudo vender');
  }
};

  useEffect(() => {
    loadProducts();
  }, []);

  return (
    <>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 15, backgroundColor: '#f8f9fa' }}
        ListHeaderComponent={
          <View>
            <Text style={styles.title}>Mi Negocio Digital</Text>
            <Text style={styles.subtitle}>Bienvenido, {user?.name}</Text>

            <View style={styles.form}>
              <Text style={styles.label}>Agregar Nuevo Producto</Text>
              <TextInput placeholder="Nombre" style={styles.input} value={form.name} onChangeText={(t) => setForm({ ...form, name: t })} />
              <TextInput placeholder="Descripción" style={styles.input} value={form.description} onChangeText={(t) => setForm({ ...form, description: t })} />
              <TextInput placeholder="Precio" style={styles.input} keyboardType="numeric" value={form.price} onChangeText={(t) => setForm({ ...form, price: t })} />
              <TextInput placeholder="Stock" style={styles.input} keyboardType="numeric" value={form.stock} onChangeText={(t) => setForm({ ...form, stock: t })} />
              <TextInput placeholder="URL imagen" style={styles.input} value={form.imageUrl} onChangeText={(t) => setForm({ ...form, imageUrl: t })} />
              <Button title="Agregar Producto" onPress={addProduct} color="#28a745" />
              <Button title="Ver Historial de Ventas" onPress={() => navigation.navigate('HistorialVentas')} color="#6c757d" />
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
              <Text style={{ color: item.stock === 0 ? '#dc3545' : '#444', fontWeight: item.stock === 0 ? 'bold' : 'normal' }}>
                Stock: {item.stock} {item.stock === 0 && '(Agotado)'}
              </Text>
            </View>

            <View style={styles.actions}>
  <TouchableOpacity onPress={() => openEditModal(item)} style={styles.editBtn}>
    <Text style={{ color: '#007bff', fontWeight: 'bold' }}>Editar</Text>
  </TouchableOpacity>

  <TouchableOpacity onPress={() => deleteProduct(item.id, item.name)} style={styles.deleteBtn}>
    <Text style={{ color: '#dc3545', fontWeight: 'bold' }}>Eliminar</Text>
  </TouchableOpacity>

  <TouchableOpacity
    onPress={() => {
      setSelectedForSale(item);
      setSaleModalVisible(true);
    }}
    style={[styles.saleBtn, item.stock === 0 && { opacity: 0.5 }]}
    disabled={item.stock === 0}
  >
    <Text style={{ color: item.stock === 0 ? '#aaa' : '#28a745', fontWeight: 'bold' }}>
      {item.stock === 0 ? 'Agotado' : 'Vender'}
    </Text>
  </TouchableOpacity>
</View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', color: '#999', marginTop: 30 }}>
            Aún no tienes productos. ¡Agrega el primero!
          </Text>
        }
      />

      {/* Modal Editar */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Producto</Text>
            <TextInput placeholder="Nombre" style={styles.input} value={form.name} onChangeText={(t) => setForm({ ...form, name: t })} />
            <TextInput placeholder="Descripción" style={styles.input} value={form.description} onChangeText={(t) => setForm({ ...form, description: t })} />
            <TextInput placeholder="Precio" style={styles.input} keyboardType="numeric" value={form.price} onChangeText={(t) => setForm({ ...form, price: t })} />
            <TextInput placeholder="Stock" style={styles.input} keyboardType="numeric" value={form.stock} onChangeText={(t) => setForm({ ...form, stock: t })} />
            <TextInput placeholder="URL imagen" style={styles.input} value={form.imageUrl} onChangeText={(t) => setForm({ ...form, imageUrl: t })} />
            <Button title="Guardar Cambios" onPress={updateProduct} color="#007bff" />
            <View style={{ height: 10 }} />
            <Button title="Cancelar" onPress={() => setEditModalVisible(false)} color="#6c757d" />
          </ScrollView>
        </View>
      </Modal>

      {/* Modal Vender */}
      {/* Modal Vender con nota opcional */}
<Modal visible={saleModalVisible} transparent animationType="fade">
  <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Registrar Venta</Text>
      <Text style={{ fontSize: 18, marginBottom: 10, fontWeight: 'bold' }}>
        {selectedForSale?.name}
      </Text>
      <Text>Stock disponible: {selectedForSale?.stock}</Text>

      <TextInput
        placeholder="Cantidad"
        keyboardType="numeric"
        value={saleQuantity}
        onChangeText={setSaleQuantity}
        style={styles.input}
      />

      <TextInput
        placeholder="Nota opcional (ej: cliente Juan, pago en efectivo)"
        value={saleNote}
        onChangeText={setSaleNote}
        style={[styles.input, { height: 70 }]}
        multiline
      />

      <Button title="Confirmar Venta" onPress={registerSale} color="#28a745" />
      <View style={{ height: 10 }} />
      <Button title="Cancelar" onPress={() => {
        setSaleModalVisible(false);
        setSaleQuantity('1');
        setSaleNote('');
      }} color="#6c757d" />
    </View>
  </View>
</Modal>
    </>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginVertical: 20, color: '#333' },
  subtitle: { fontSize: 18, textAlign: 'center', color: '#666', marginBottom: 20 },
  form: { backgroundColor: '#fff', padding: 20, borderRadius: 12, marginBottom: 20, elevation: 4 },
  label: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#333' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 14, borderRadius: 10, marginBottom: 12, backgroundColor: '#fff', fontSize: 16 },
  section: { fontSize: 22, fontWeight: 'bold', marginVertical: 20, color: '#333' },
  productCard: { flexDirection: 'row', backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 12, elevation: 3, position: 'relative' },
  image: { width: 80, height: 80, borderRadius: 10 },
  noImage: { width: 80, height: 80, backgroundColor: '#f0f0f0', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  info: { marginLeft: 15, flex: 1, justifyContent: 'center' },
  name: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  price: { fontSize: 20, color: '#28a745', fontWeight: 'bold', marginTop: 6 },
  actions: { justifyContent: 'center', gap: 8 },
  editBtn: { backgroundColor: '#e3f2fd', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  deleteBtn: { backgroundColor: '#ffebee', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  saleBtn: { backgroundColor: '#d4edda', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', padding: 20, borderRadius: 15, width: '90%', maxHeight: '85%' },
  modalTitle: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: '#333' },
});