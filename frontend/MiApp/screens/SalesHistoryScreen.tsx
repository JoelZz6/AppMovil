// screens/SalesHistoryScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { API_MAIN } from '../config';

export default function SalesHistoryScreen({ navigation }: any) {
  const { token } = useAuth();
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadSales = async () => {
    try {
      const res = await axios.get(`${API_MAIN}/products/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSales(res.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadSales();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#28a745" />
        <Text>Cargando historial...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Historial de Ventas</Text>

      <FlatList
        data={sales}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <Text style={styles.empty}>Aún no has registrado ventas</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.saleItem}>
            <View style={styles.header}>
              <Text style={styles.product}>{item.product_name}</Text>
              <Text style={styles.date}>
                {new Date(item.created_at).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
            <Text>Cantidad: {item.quantity} unidad(es)</Text>
            {item.notes ? (
              <Text style={styles.notes}>Nota: {item.notes}</Text>
            ) : (
              <Text style={{ color: '#aaa', fontStyle: 'italic' }}>Sin notas</Text>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 15 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' },
  title: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginVertical: 20, color: '#333' },
  saleItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 3,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  product: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  date: { fontSize: 14, color: '#666' },
  notes: { marginTop: 8, color: '#28a745', fontStyle: 'italic' },
  empty: { textAlign: 'center', color: '#999', fontSize: 16, marginTop: 50 },
});