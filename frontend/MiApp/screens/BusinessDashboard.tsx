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
  ActivityIndicator,
  Platform,
} from 'react-native';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import {
  launchCamera,
  launchImageLibrary,
  ImagePickerResponse,
} from 'react-native-image-picker';
import {
  check,
  request,
  PERMISSIONS,
  RESULTS,
  openSettings,
} from 'react-native-permissions';
import { CLOUDINARY_CONFIG } from '../config/cloudinary';
import { API_MAIN } from '../config';

export default function BusinessDashboard({ navigation }: any) {
  const { user, token } = useAuth();
  const [products, setProducts] = useState<any[]>([]);

  // Formulario
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    imageUrl: '',
  });

  // Imagen temporal (para agregar y editar)
  const [tempImageUrl, setTempImageUrl] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Modales
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [saleModalVisible, setSaleModalVisible] = useState(false);
  const [selectedForSale, setSelectedForSale] = useState<any>(null);
  const [saleQuantity, setSaleQuantity] = useState('1');
  const [saleNote, setSaleNote] = useState('');

  const loadProducts = async () => {
    try {
      const res = await axios.get(`${API_MAIN}/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(res.data);
    } catch (error: any) {
      console.log('Error cargando productos:', error.message);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // === IMAGENES ===
  const selectImage = () => {
    Alert.alert('Seleccionar foto', '¿Desde dónde?', [
      { text: 'Cámara', onPress: openCamera },
      { text: 'Galería', onPress: openGallery },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const requestPermission = async (permission: any): Promise<boolean> => {
    try {
      const result = await check(permission);
      if (result === RESULTS.GRANTED) return true;
      if (result === RESULTS.DENIED) {
        const req = await request(permission);
        return req === RESULTS.GRANTED;
      }
      if (result === RESULTS.BLOCKED) {
  Alert.alert(
    'Permiso necesario',
    'Ve a Ajustes y permite el acceso para usar esta función',
    [
      {
        text: 'Abrir Ajustes',
        onPress: () => openSettings(), // ✔️ FIX
      },
      { text: 'Cancelar', style: 'cancel' }
    ]
  );
}

      return false;
    } catch (error) {
      return false;
    }
  };

  const openCamera = async () => {
    const permission = Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA;
    if (!(await requestPermission(permission))) return;
    launchCamera({ mediaType: 'photo', quality: 0.8 }, handleImageResponse);
  };

  const openGallery = async () => {
    let permission;
    if (Platform.OS === 'ios') {
      permission = PERMISSIONS.IOS.PHOTO_LIBRARY;
    } else {
      permission = Number(Platform.Version) >= 33
        ? PERMISSIONS.ANDROID.READ_MEDIA_IMAGES
        : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;
    }
    if (!(await requestPermission(permission))) return;
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, handleImageResponse);
  };

  const handleImageResponse = async (response: ImagePickerResponse) => {
    if (response.didCancel || response.errorCode) return;
    const file = response.assets?.[0];
    if (!file?.uri) return;

    setUploadingImage(true);
    try {
      const url = await uploadToCloudinary(file.uri);
      setTempImageUrl(url);
      setForm({ ...form, imageUrl: url });
      Alert.alert('Éxito', 'Foto subida correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo subir la imagen');
    } finally {
      setUploadingImage(false);
    }
  };

  const uploadToCloudinary = async (uri: string): Promise<string> => {
    const data = new FormData();
    data.append('file', {
      uri,
      type: 'image/jpeg',
      name: 'photo.jpg',
    } as any);
    data.append('upload_preset', CLOUDINARY_CONFIG.upload_preset);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloud_name}/image/upload`,
      { method: 'POST', body: data }
    );
    const result = await res.json();
    if (!result.secure_url) throw new Error('Upload failed');
    return result.secure_url;
  };

  // === PRODUCTOS ===
  const addProduct = async () => {
    if (!form.name.trim() || !form.price.trim()) {
      return Alert.alert('Error', 'Nombre y precio son obligatorios');
    }
    try {
      await axios.post(
        `${API_MAIN}/products`,
        {
          name: form.name.trim(),
          description: form.description.trim() || null,
          price: parseFloat(form.price),
          stock: parseInt(form.stock) || 0,
          imageUrl: form.imageUrl || null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Éxito', 'Producto agregado');
      resetForm();
      loadProducts();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'No se pudo agregar');
    }
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
    setTempImageUrl(product.image_url || '');
    setEditModalVisible(true);
  };

  const updateProduct = async () => {
    if (!editingProduct) return;
    try {
      await axios.patch(
        `${API_MAIN}/products/${editingProduct.id}`,
        {
          name: form.name.trim(),
          description: form.description.trim() || null,
          price: parseFloat(form.price),
          stock: parseInt(form.stock) || 0,
          imageUrl: form.imageUrl || null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Éxito', 'Producto actualizado');
      setEditModalVisible(false);
      resetForm();
      loadProducts();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'No se pudo actualizar');
    }
  };

  const resetForm = () => {
    setForm({ name: '', description: '', price: '', stock: '', imageUrl: '' });
    setTempImageUrl('');
  };

  const registerSale = async () => {
    const qty = parseInt(saleQuantity);
    if (!selectedForSale || qty <= 0 || qty > selectedForSale.stock) {
      return Alert.alert('Error', 'Cantidad inválida');
    }
    try {
      await axios.post(
        `${API_MAIN}/products/sale`,
        { productId: selectedForSale.id, quantity: qty, notes: saleNote.trim() || null },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Venta registrada');
      setSaleModalVisible(false);
      setSaleQuantity('1');
      setSaleNote('');
      loadProducts();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'No se pudo vender');
    }
  };

  const deleteProduct = (id: number, name: string) => {
    Alert.alert('Eliminar', `¿Seguro que quieres eliminar "${name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await axios.delete(`${API_MAIN}/products/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          Alert.alert('Eliminado');
          loadProducts();
        },
      },
    ]);
  };

  // === RENDER IMAGEN ===
  const renderImagePicker = () => (
    <View style={{ marginVertical: 15 }}>
      <Text style={{ fontSize: 16, marginBottom: 8, color: '#333' }}>
        Foto del producto {tempImageUrl ? 'Check' : ''}
      </Text>
      {tempImageUrl ? (
        <View>
          <Image source={{ uri: tempImageUrl }} style={{ width: '100%', height: 220, borderRadius: 12, marginBottom: 10 }} />
          <Button title="Cambiar foto" onPress={selectImage} color="#007bff" />
        </View>
      ) : (
        <TouchableOpacity onPress={selectImage} style={styles.imagePlaceholder}>
          {uploadingImage ? (
            <ActivityIndicator size="large" color="#28a745" />
          ) : (
            <>
              <Text style={{ fontSize: 60, color: '#ccc' }}>Camera</Text>
              <Text style={{ color: '#666', marginTop: 10 }}>Toca para agregar foto</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );

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
              <Text style={styles.label}>Agregar Producto</Text>
              <TextInput placeholder="Nombre" style={styles.input} value={form.name} onChangeText={(t) => setForm({ ...form, name: t })} />
              <TextInput placeholder="Descripción" style={styles.input} value={form.description} onChangeText={(t) => setForm({ ...form, description: t })} />
              <TextInput placeholder="Precio" style={styles.input} keyboardType="numeric" value={form.price} onChangeText={(t) => setForm({ ...form, price: t })} />
              <TextInput placeholder="Stock" style={styles.input} keyboardType="numeric" value={form.stock} onChangeText={(t) => setForm({ ...form, stock: t })} />
              {renderImagePicker()}
              <Button title="Agregar Producto" onPress={addProduct} color="#28a745" />
              <View style={{ height: 10 }} />
              <Button title="Historial de Ventas" onPress={() => navigation.navigate('HistorialVentas')} color="#6c757d" />
                <TouchableOpacity
  style={styles.analyticsBtn}
  onPress={() => navigation.navigate('Analytics')}
>
  <Text style={styles.btnText}>Análisis y Predicciones IA</Text>
</TouchableOpacity>
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
                style={[styles.saleBtn, item.stock === 0 && { opacity: 0.6 }]}
                disabled={item.stock === 0}
              >
                <Text style={{ color: item.stock === 0 ? '#aaa' : '#28a745', fontWeight: 'bold' }}>
                  {item.stock === 0 ? 'Agotado' : 'Vender'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
            {renderImagePicker()}
            <Button title="Guardar Cambios" onPress={updateProduct} color="#007bff" />
            <View style={{ height: 10 }} />
            <Button title="Cancelar" onPress={() => { setEditModalVisible(false); resetForm(); }} color="#6c757d" />
          </ScrollView>
        </View>
      </Modal>

      {/* Modal Vender */}
      <Modal visible={saleModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Registrar Venta</Text>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
              {selectedForSale?.name}
            </Text>
            <Text>Stock disponible: {selectedForSale?.stock}</Text>
            <TextInput placeholder="Cantidad" keyboardType="numeric" value={saleQuantity} onChangeText={setSaleQuantity} style={styles.input} />
            <TextInput placeholder="Nota (opcional)" value={saleNote} onChangeText={setSaleNote} style={[styles.input, { height: 80 }]} multiline />
            <Button title="Confirmar Venta" onPress={registerSale} color="#28a745" />
            <View style={{ height: 10 }} />
            <Button title="Cancelar" onPress={() => { setSaleModalVisible(false); setSaleQuantity('1'); setSaleNote(''); }} color="#6c757d" />
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
  productCard: { flexDirection: 'row', backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 12, elevation: 3 },
  image: { width: 80, height: 80, borderRadius: 10 },
  noImage: { width: 80, height: 80, backgroundColor: '#f0f0f0', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  info: { marginLeft: 15, flex: 1 },
  name: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  price: { fontSize: 20, color: '#28a745', fontWeight: 'bold', marginTop: 6 },
  actions: { justifyContent: 'center', gap: 8 },
  editBtn: { backgroundColor: '#e3f2fd', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  deleteBtn: { backgroundColor: '#ffebee', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  saleBtn: { backgroundColor: '#d4edda', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', padding: 20, borderRadius: 15, width: '90%' },
  modalTitle: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: '#333' },
  imagePlaceholder: {
    height: 200,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  analyticsBtn: {
  backgroundColor: '#6f42c1',  // púrpura moderno (como GitHub, Twitch)
  padding: 14,
  borderRadius: 15,
  alignItems: 'center',
  marginTop: 20,
  elevation: 6,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.3,
  shadowRadius: 5,
},
btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});