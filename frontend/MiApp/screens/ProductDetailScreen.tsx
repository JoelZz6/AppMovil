// screens/ProductDetailScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';

const API_URL = 'http://192.168.0.8:3000';

interface Product {
  id: number;
  name: string;
  description?: string;
  price: string | number;
  stock: number;
  image_url?: string;
  business_name?: string;
  business_db?: string;
}

export default function ProductDetailScreen({ route, navigation }: any) {
  const { product, fromStore = false }: { product: Product; fromStore?:Boolean } = route.params;
  const [businessInfo, setBusinessInfo] = useState<{ phone?: string } | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);

  const stockAvailable = product.stock > 0;

  useEffect(() => {
    // Cargar teléfono del negocio
    const loadBusinessPhone = async () => {
      if (!product.business_db) {
        setLoadingInfo(false);
        return;
      }
      try {
        const res = await axios.get(`${API_URL}/business/public/${product.business_db}`);
        setBusinessInfo(res.data);
      } catch (error) {
        console.log('No se pudo cargar info del negocio');
      } finally {
        setLoadingInfo(false);
      }
    };
    loadBusinessPhone();
  }, [product.business_db]);

  const openWhatsApp = () => {
    if (!businessInfo?.phone) {
      Alert.alert('WhatsApp', 'Este negocio no tiene número de contacto');
      return;
    }

    const message = `¡Hola! Vi tu producto "${product.name}" en la app y me interesa`;
    const phone = businessInfo.phone.replace(/[^\d]/g, ''); // limpia el número
    const url = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) return Linking.openURL(url);
        // Fallback a web
        Linking.openURL(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`);
      })
      .catch(() => Alert.alert('Error', 'No tienes WhatsApp instalado'));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Foto grande */}
        {product.image_url ? (
          <Image source={{ uri: product.image_url }} style={styles.image} />
        ) : (
          <View style={styles.noImage}>
            <Text style={styles.noImageText}>Sin foto</Text>
          </View>
        )}

        <View style={styles.content}>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.price}>
            ${typeof product.price === 'string' ? parseFloat(product.price).toFixed(2) : product.price.toFixed(2)}
          </Text>

          {product.description ? (
            <Text style={styles.description}>{product.description}</Text>
          ) : (
            <Text style={styles.noDescription}>Sin descripción disponible</Text>
          )}

          <Text style={[styles.stock, { color: stockAvailable ? '#28a745' : '#dc3545' }]}>
            Stock: {stockAvailable ? `${product.stock} disponibles` : 'Agotado'}
          </Text>

          <View style={styles.businessCard}>
            <Text style={styles.businessLabel}>Vendido por</Text>
            <Text style={styles.businessName}>{product.business_name || 'Tienda'}</Text>
          </View>

          {/* Botón WhatsApp */}
          {loadingInfo ? (
            <View style={styles.loadingBtn}>
              <ActivityIndicator color="#25D366" />
            </View>
          ) : businessInfo?.phone ? (
            <TouchableOpacity style={styles.whatsappButton} onPress={openWhatsApp}>
              <Text style={styles.whatsappText}>Contactar por WhatsApp</Text>
            </TouchableOpacity>
          ) : null}

          {/* Botón condicional: Ver tienda o Volver a la tienda */}
{!fromStore ? (
  <TouchableOpacity
    style={styles.storeButton}
    onPress={() => {
      navigation.replace('PublicBusiness', {
        businessDbName: product.business_db,
        businessName: product.business_name || 'Tienda',
      });
    }}
  >
    <Text style={styles.storeButtonText}>Ver tienda completa</Text>
  </TouchableOpacity>
) : (
  <TouchableOpacity
    style={[styles.storeButton, { backgroundColor: '#6c757d' }]}
    onPress={() => navigation.goBack()}
  >
    <Text style={styles.storeButtonText}>Volver a la tienda</Text>
  </TouchableOpacity>
)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  image: { width: '100%', height: 400, resizeMode: 'cover' },
  noImage: { width: '100%', height: 400, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
  noImageText: { color: '#999', fontSize: 18 },
  content: { padding: 20 },
  name: { fontSize: 28, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  price: { fontSize: 32, fontWeight: 'bold', color: '#28a745', marginBottom: 15 },
  description: { fontSize: 16, color: '#555', lineHeight: 24, marginBottom: 20 },
  noDescription: { fontSize: 16, color: '#999', fontStyle: 'italic', marginBottom: 20 },
  stock: { fontSize: 18, fontWeight: 'bold', marginBottom: 30 },
  businessCard: { backgroundColor: '#f8f9fa', padding: 20, borderRadius: 12, marginBottom: 30, alignItems: 'center' },
  businessLabel: { fontSize: 14, color: '#666' },
  businessName: { fontSize: 22, fontWeight: 'bold', color: '#007bff', marginTop: 5 },
  whatsappButton: {
    backgroundColor: '#25D366',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
    elevation: 3,
  },
  whatsappText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  storeButton: {
    backgroundColor: '#007bff',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
  },
  storeButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  loadingBtn: { padding: 18, marginBottom: 15 },
});