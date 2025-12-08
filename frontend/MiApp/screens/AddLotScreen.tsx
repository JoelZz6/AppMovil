// screens/AddLotScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { API_MAIN } from '../config';
import { useRoute, RouteProp } from '@react-navigation/native';

type AddLotScreenRouteParams = {
  onGoBack?: () => void;
};

export default function AddLotScreen({ navigation }: any) {
  const { token } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState('');
  const [entryPrice, setEntryPrice] = useState('');
  const route = useRoute<RouteProp<Record<string, AddLotScreenRouteParams>, 'AddLot'>>();
const { onGoBack } = route.params || {};

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    axios.get(`${API_MAIN}/products`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setProducts(res.data))
    .catch(() => Alert.alert('Error', 'No se pudieron cargar los productos'))
    .finally(() => setLoading(false));
  };

  const handleAddLot = async () => {
    if (!selectedProduct || !quantity || !entryPrice) {
      return Alert.alert('Error', 'Selecciona producto y completa cantidad y costo');
    }

    if (parseInt(quantity) <= 0 || parseFloat(entryPrice) <= 0) {
      return Alert.alert('Error', 'Cantidad y costo deben ser mayores a 0');
    }

    try {
      await axios.post(`${API_MAIN}/products/lot`, {
        productId: selectedProduct.id,
        quantity: parseInt(quantity),
        entry_price: parseFloat(entryPrice),
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Alert.alert('Éxito', 'Lote agregado correctamente', [
        { text: 'OK', onPress: () => {
            onGoBack?.();
            //navigation.goBack(); //ESTO TE NOS REGRESA ATRAS, OPCIONAL
        }}
        ]);
      setQuantity('');
      setEntryPrice('');
      setSelectedProduct(null);
      loadProducts(); // actualiza stock
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'No se pudo agregar el lote');
    }
  };

  const selectProduct = (product: any) => {
    setSelectedProduct(product);
    Alert.alert(
      'Producto seleccionado',
      `${product.name}\nStock actual: ${product.stock}\nPrecio de venta: $${product.market_price}`,
      [{ text: 'OK' }]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#28a745" />
        <Text style={{ marginTop: 15, color: '#666' }}>Cargando productos...</Text>
      </View>
    );
  }

  return (
  <SafeAreaView style={styles.container}>
    <FlatList
      data={products}
      keyExtractor={item => item.id.toString()}
      contentContainerStyle={{ padding: 20 }}
      
      // ------------- ENCABEZADO -------------
      ListHeaderComponent={
        <>
          <Text style={styles.title}>Agregar Nuevo Lote</Text>

          <Text style={styles.subtitle}>
            Selecciona un producto y registra su entrada
          </Text>

          <Text style={styles.sectionTitle}>Mis productos</Text>
        </>
      }

      // ------------- RENDER PRODUCTO -------------
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[
            styles.productItem,
            selectedProduct?.id === item.id && styles.selectedProduct
          ]}
          onPress={() => selectProduct(item)}
        >
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} style={styles.thumb} />
          ) : (
            <View style={styles.noThumb}><Text>No foto</Text></View>
          )}

          <View style={{ flex: 1 }}>
            <Text style={styles.productName}>{item.name}</Text>
            <Text style={styles.productInfo}>
              Stock: {item.stock} • Precio: ${item.market_price}
            </Text>
          </View>

          {selectedProduct?.id === item.id && (
            <View style={styles.check}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Check</Text>
            </View>
          )}
        </TouchableOpacity>
      )}

      ListEmptyComponent={
        <Text style={styles.empty}>No tienes productos aún</Text>
      }

      // ------------- FORMULARIO AL FINAL -------------
      ListFooterComponent={
        selectedProduct && (
          <View style={styles.form}>
            <Text style={styles.formTitle}>
              Producto: {selectedProduct.name}
            </Text>

            <TextInput
              placeholder="Cantidad del lote"
              style={styles.input}
              keyboardType="numeric"
              value={quantity}
              onChangeText={setQuantity}
            />

            <TextInput
              placeholder="Costo por unidad (entrada)"
              style={styles.input}
              keyboardType="numeric"
              value={entryPrice}
              onChangeText={setEntryPrice}
            />

            <TouchableOpacity style={styles.addBtn} onPress={handleAddLot}>
              <Text style={styles.addBtnText}>Agregar Lote</Text>
            </TouchableOpacity>
          </View>
        )
      }
    />
  </SafeAreaView>
);

}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginBottom: 10, color: '#333' },
  subtitle: { fontSize: 16, textAlign: 'center', color: '#666', marginBottom: 20 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 20, marginBottom: 10, color: '#333' },
  productItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 3,
    alignItems: 'center',
  },
  selectedProduct: {
    borderColor: '#28a745',
    borderWidth: 2,
  },
  thumb: { width: 60, height: 60, borderRadius: 10, marginRight: 15 },
  noThumb: { width: 60, height: 60, backgroundColor: '#f0f0f0', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  productName: { fontSize: 16, fontWeight: 'bold' },
  productInfo: { fontSize: 14, color: '#666' },
  check: { backgroundColor: '#28a745', padding: 8, borderRadius: 20 },
  form: { backgroundColor: '#fff', padding: 20, borderRadius: 12, marginTop: 20, elevation: 4 },
  formTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#007bff' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  addBtn: {
    backgroundColor: '#fd7e14',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  empty: { textAlign: 'center', color: '#999', marginTop: 30, fontSize: 16 },
});