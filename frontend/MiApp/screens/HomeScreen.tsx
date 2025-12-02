// screens/HomeScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const API_URL = 'http://192.168.0.8:3000';
const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const hasBusiness = !!user?.businessDbName;

  const loadPublicProducts = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await axios.get(`${API_URL}/products/public/all-random`);
      setProducts(res.data);
    } catch (error) {
      console.log('Error cargando productos públicos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPublicProducts();
  }, []);

  const handleLogout = () => {
    // mismo que antes
    logout();
    navigation.replace('Auth');
  };

  const renderProduct = ({ item }: any) => (
    <TouchableOpacity
  onPress={() => navigation.navigate('ProductDetail', { product: item, fromStore: false })}
  style={styles.productCard}
>
    <View style={styles.productCard}>
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.productImage} />
      ) : (
        <View style={styles.noImage}>
          <Text style={{ color: '#999' }}>No photo</Text>
        </View>
      )}
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.businessName}>De: {item.business_name || 'Tienda'}</Text>
        <Text style={styles.price}>${parseFloat(item.price).toFixed(2)}</Text>
      </View>
    </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#28a745" />
        <Text style={{ marginTop: 20, color: '#666' }}>Cargando productos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header con saludo */}
      <View style={styles.header}>
        <Text style={styles.welcome}>¡Hola, {user?.name}!</Text>
        <Text style={styles.subtitle}>Descubre productos cerca de ti</Text>
      </View>

      {/* Feed de productos */}
      <FlatList
        data={products}
        keyExtractor={(item) => item.id + '-' + item.business_name}
        renderItem={renderProduct}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadPublicProducts(true)} />
        }
        contentContainerStyle={{ padding: 10 }}
        showsVerticalScrollIndicator={false}
        numColumns={2} // opcional: para ver 2 columnas como Instagram
      />

      {/* Botones de negocio (mismo que antes) */}
      <View style={styles.footerButtons}>
        {!hasBusiness ? (
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => navigation.navigate('CreateBusiness')}
          >
            <Text style={styles.btnText}>Crear mi negocio</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.accessBtn}
            onPress={() => navigation.navigate('BusinessDashboard')}
          >
            <Text style={styles.btnText}>Ir a mi tienda</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' },
  header: { padding: 20, alignItems: 'center', backgroundColor: '#007bff' },
  welcome: { fontSize: 26, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 16, color: '#fff', marginTop: 5, opacity: 0.9 },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    margin: 8,
    elevation: 5,
    overflow: 'hidden',
    width: (width - 40) / 2, // 2 columnas
  },
  productImage: { width: '100%', height: 180 },
  noImage: { width: '100%', height: 180, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
  productInfo: { padding: 12 },
  productName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  businessName: { fontSize: 13, color: '#666', marginVertical: 4 },
  price: { fontSize: 18, fontWeight: 'bold', color: '#28a745' },
  footerButtons: { padding: 20, gap: 12 },
  createBtn: { backgroundColor: '#28a745', padding: 16, borderRadius: 12, alignItems: 'center' },
  accessBtn: { backgroundColor: '#007bff', padding: 16, borderRadius: 12, alignItems: 'center' },
  logoutBtn: { backgroundColor: '#dc3545', padding: 14, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  logoutText: { color: '#fff', fontWeight: 'bold' },
});