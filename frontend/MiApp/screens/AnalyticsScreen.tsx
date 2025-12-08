// screens/AnalyticsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { API_ANALYTICS } from '../config';

interface TopProduct {
  ventas: number;
  ganancia: number;
  ganancia_unitaria_real: number;
  ganancia_unitaria_potencial: number;
  precio_promedio_venta: number;
}

interface AnalyticsData {
  resumen?: {
    total_unidades_vendidas: number;
    ganancia_total: number;
    margen_promedio: number;
    prediccion: string;
  };
  top_ganancia?: Record<string, TopProduct>;
  stock_bajo?: Array<{ name: string; stock: number }>;
  graficos?: {
    ventas_diarias: string;
    ganancia_productos: string;
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
      const res = await axios.post(API_ANALYTICS, {
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
        <Text style={styles.loadingText}>Analizando tus ventas y ganancias...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Atrás</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Análisis de Ganancias</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {data?.message ? (
          <View style={styles.messageContainer}>
            <Text style={styles.message}>{data.message}</Text>
          </View>
        ) : (
          <>
            {/* RESUMEN GENERAL */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Resumen del Negocio</Text>
              
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Unidades vendidas</Text>
                  <Text style={styles.summaryValue}>{data?.resumen?.total_unidades_vendidas || 0}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Ganancia total</Text>
                  <Text style={styles.gananciaValue}>
                    ${data?.resumen?.ganancia_total?.toLocaleString() || '0'}
                  </Text>
                </View>
              </View>

              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Margen de ganancia global</Text>
                  <Text style={[styles.summaryValue, styles.margen]}>{data?.resumen?.margen_promedio}%</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Pronóstico mañana</Text>
                  <Text style={styles.prediccionText}>
                    {data?.resumen?.prediccion || 'Sin datos'}
                  </Text>
                </View>
              </View>
            </View>

            {/* TOP PRODUCTOS POR GANANCIA */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Top 5 Productos Más Rentables</Text>
              {data?.top_ganancia && Object.keys(data.top_ganancia).length > 0 ? (
                Object.entries(data.top_ganancia).map(([nombre, info]) => (
                  <View key={nombre} style={styles.topItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.topName}>{nombre}</Text>
                      <Text style={styles.topVentas}>{info.ventas} vendidos a ${info.precio_promedio_venta.toFixed(2)} promedio</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.topGanancia}>+${info.ganancia.toLocaleString()}</Text>
                      <View style={styles.margenContainer}>
                        <Text style={styles.margenLabel}>Ganancia real/unidad:</Text>
                        <Text style={styles.margenReal}>${info.ganancia_unitaria_real.toFixed(2)}</Text>
                      </View>
                      <View style={styles.margenContainer}>
                        <Text style={styles.margenLabel}>Potencial/unidad:</Text>
                        <Text style={styles.margenPotencial}>${info.ganancia_unitaria_potencial.toFixed(2)}</Text>
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.empty}>Aún no hay suficientes ventas</Text>
              )}
            </View>

            {/* STOCK BAJO */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Alerta: Stock Bajo</Text>
              {data?.stock_bajo && data.stock_bajo.length > 0 ? (
                data.stock_bajo.map((item, i) => (
                  <View key={i} style={styles.alertCard}>
                    <Text style={styles.alertText}>
                      {item.name}
                    </Text>
                    <Text style={styles.alertStock}>
                      Quedan solo {item.stock} unidades
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.successText}>
                  Todo el stock está bien
                </Text>
              )}
            </View>

            {/* GRÁFICOS */}
            {data?.graficos && (
              <>
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Tendencia de Ventas Diarias</Text>
                  <Image
                    source={{ uri: `data:image/png;base64,${data.graficos.ventas_diarias}` }}
                    style={styles.chart}
                    resizeMode="contain"
                  />
                </View>

                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Ganancia por Producto (Top 5)</Text>
                  <Image
                    source={{ uri: `data:image/png;base64,${data.graficos.ganancia_productos}` }}
                    style={styles.chart}
                    resizeMode="contain"
                  />
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: '#6f42c1',
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 5,
  },
  backText: { color: '#fff', fontSize: 18 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  scrollContent: { padding: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center'
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  summaryItem: { alignItems: 'center' },
  summaryLabel: { fontSize: 14, color: '#666', marginBottom: 5 },
  summaryValue: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  gananciaValue: { fontSize: 28, fontWeight: 'bold', color: '#28a745' },
  margen: { color: '#fd7e14' },
  prediccionText: { fontSize: 18, color: '#6f42c1', fontWeight: 'bold' },
  topItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  topName: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  topVentas: { fontSize: 13, color: '#666', fontStyle: 'italic' },
  topGanancia: { fontSize: 18, fontWeight: 'bold', color: '#28a745', marginBottom: 8 },
  margenContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  margenLabel: { fontSize: 12, color: '#666', marginRight: 5 },
  margenReal: { fontSize: 14, fontWeight: 'bold', color: '#007bff' },
  margenPotencial: { fontSize: 14, fontWeight: 'bold', color: '#6f42c1' },
  alertCard: {
    backgroundColor: '#ffebee',
    padding: 15,
    borderRadius: 12,
    marginVertical: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertText: { fontSize: 16, fontWeight: 'bold', color: '#c62828' },
  alertStock: { fontSize: 16, color: '#c62828' },
  successText: { fontSize: 16, color: '#28a745', fontStyle: 'italic', textAlign: 'center', marginTop: 10 },
  empty: { fontSize: 16, color: '#999', textAlign: 'center', marginTop: 10, fontStyle: 'italic' },
  messageContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  message: { fontSize: 18, color: '#dc3545', textAlign: 'center' },
  chart: {
    width: '100%',
    height: 320,
    borderRadius: 16,
    backgroundColor: '#fff',
    marginVertical: 10,
  },
  loadingText: { marginTop: 15, fontSize: 16, color: '#666', textAlign: 'center' },
});