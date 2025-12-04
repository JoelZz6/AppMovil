// screens/AnalyticsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const API_URL = 'http://192.168.0.8:8001/analytics';

interface AnalyticsData {
  total_ventas?: number;
  top_productos?: Record<string, number>;
  stock_bajo?: Array<{ id: number; name: string; stock: number }>;
  prediccion?: string;
  graficos?: {
    ventas_diarias: string;
    top_productos: string;
  };
  message?: string;
}

export default function AnalyticsScreen({ navigation }: any) {
  const { user } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.businessDbName) {
      loadAnalytics();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadAnalytics = async () => {
    if (!user?.businessDbName) {
      setData({ message: 'No tienes un negocio asociado' });
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post(API_URL, {
        business_db: user.businessDbName,
      });
      setData(res.data);
    } catch (error: any) {
      setData({ message: error.response?.data?.detail || 'Error al cargar análisis' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#28a745" />
        <Text style={{ marginTop: 15, fontSize: 16, color: '#666' }}>
          Analizando tus datos...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: '#fff', fontSize: 18 }}>Atrás</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Análisis Inteligente</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={{ padding: 20 }}>
        {data?.message ? (
          <Text style={styles.message}>{data.message}</Text>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Total de unidades vendidas</Text>
            <Text style={styles.bigNumber}>{data?.total_ventas || 0}</Text>

            <Text style={styles.sectionTitle}>Predicción para mañana</Text>
            <Text style={styles.prediccion}>{data?.prediccion || 'Sin datos'}</Text>

            <Text style={styles.sectionTitle}>Top 5 productos más vendidos</Text>
            {data?.top_productos && Object.entries(data.top_productos).length > 0 ? (
              Object.entries(data.top_productos).map(([id, qty]) => (
                <Text key={id} style={styles.listItem}>
                  • {id}: {qty} unidades
                </Text>
              ))
            ) : (
              <Text style={styles.empty}>Aún no hay ventas</Text>
            )}

            <Text style={styles.sectionTitle}>Stock bajo (menos de 10)</Text>
            {data?.stock_bajo && data.stock_bajo.length > 0 ? (
              data.stock_bajo.map(item => (
                <Text key={item.id} style={styles.alertItem}>
                  {item.name}: solo {item.stock} en stock
                </Text>
              ))
            ) : (
              <Text style={styles.good}>Todo el stock está bien</Text>
            )}

            {data?.graficos && (
              <>
                <Text style={styles.sectionTitle}>Tendencia de ventas</Text>
                <Image
                  source={{ uri: `data:image/png;base64,${data.graficos.ventas_diarias}` }}
                  style={styles.chart}
                  resizeMode="contain"
                />

                <Text style={styles.sectionTitle}>Productos más vendidos</Text>
                <Image
                  source={{ uri: `data:image/png;base64,${data.graficos.top_productos}` }}
                  style={styles.chart}
                  resizeMode="contain"
                />
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: '#007bff',
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 20, color: '#333' },
  bigNumber: { fontSize: 48, fontWeight: 'bold', color: '#28a745', marginVertical: 10 },
  prediccion: { fontSize: 18, color: '#007bff', fontWeight: 'bold', marginVertical: 10 },
  listItem: { fontSize: 16, marginVertical: 4, color: '#555' },
  alertItem: { fontSize: 16, marginVertical: 4, color: '#dc3545', fontWeight: 'bold' },
  good: { fontSize: 16, color: '#28a745', fontStyle: 'italic' },
  empty: { fontSize: 16, color: '#999', fontStyle: 'italic' },
  message: { fontSize: 18, textAlign: 'center', color: '#dc3545', marginTop: 50 },
  chart: { width: '100%', height: 300, marginVertical: 20, backgroundColor: '#fff', borderRadius: 12 },
});