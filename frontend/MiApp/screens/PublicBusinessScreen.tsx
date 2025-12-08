// screens/PublicBusinessScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import axios from 'axios';
import { Linking } from 'react-native';
import { API_MAIN } from '../config';

export default function PublicBusinessScreen({ route, navigation }: any) {
  const { businessDbName, businessName } = route.params;
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [businessInfo, setBusinessInfo] = useState<any>(null);

  useEffect(() => {
    loadBusinessData();
  }, []);

  const loadBusinessData = async () => {
    try {
      // 1. Cargar productos del negocio
      const res = await axios.get(`${API_MAIN}/products/public/business/${businessDbName}`);
      setProducts(res.data);

      // 2. Cargar info del negocio (nombre, teléfono, etc.)
      const infoRes = await axios.get(`${API_MAIN}/business/public/${businessDbName}`);
      setBusinessInfo(infoRes.data);
    } catch (error: any) {
      console.log('Error:', error.response?.data || error.message);
      Alert.alert('Error', 'No se pudo cargar la tienda');
    } finally {
      setLoading(false);
    }
  };

  const openWhatsApp = () => {
    if (!businessInfo?.phone) {
      Alert.alert('WhatsApp', 'Esta tienda no tiene número de contacto');
      return;
    }

    const message = `¡Hola! Vi tu producto en la app y me interesa`;
    const url = `whatsapp://send?phone=${businessInfo.phone}&text=${encodeURIComponent(message)}`;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          // Fallback web
          Linking.openURL(`https://wa.me/${businessInfo.phone}?text=${encodeURIComponent(message)}`);
        }
      })
      .catch(() => {
        Alert.alert('Error', 'No tienes WhatsApp instalado');
      });
  };

  const renderProduct = ({ item }: any) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => navigation.navigate('ProductDetail', { product: { ...item, business_name: businessName, business_db: businessDbName }, fromStore: true })}
    >
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={styles.noImage}>
          <Text>Sin foto</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.price}>
          ${typeof item.market_price === 'string' ? parseFloat(item.market_price).toFixed(2) : item.market_price.toFixed(2)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={{ marginTop: 15, color: '#666' }}>Cargando tienda...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header de la tienda */}
      <View style={styles.header}>
        <Text style={styles.title}>{businessName || 'Tienda'}</Text>
        <Text style={styles.subtitle}>{products.length} productos</Text>
        
        {businessInfo?.phone && (
          <TouchableOpacity style={styles.whatsappButton} onPress={openWhatsApp}>
            <Text style={styles.whatsappText}>Contactar por WhatsApp</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Productos */}
      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Esta tienda aún no tiene productos</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: '#007bff',
    padding: 20,
    alignItems: 'center',
  },
  title: { fontSize: 26, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 16, color: '#fff', marginTop: 5, opacity: 0.9 },
  whatsappButton: {
    backgroundColor: '#25D366',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 15,
  },
  whatsappText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  list: { padding: 10 },
  row: { justifyContent: 'space-between' },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 6,
    elevation: 4,
    overflow: 'hidden',
    width: '46%',
  },
  image: { width: '100%', height: 140 },
  noImage: { width: '100%', height: 140, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
  info: { padding: 10 },
  name: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  price: { fontSize: 16, color: '#28a745', fontWeight: 'bold', marginTop: 4 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  emptyText: { fontSize: 18, color: '#999' },
});