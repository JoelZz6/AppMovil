// screens/AnalyticsScreen.tsx - CON MÉTRICAS SEPARADAS E ICONOS
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
import Ionicons from '@react-native-vector-icons/ionicons';
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
    ganancia_real: number;
    margen_promedio: number;
    roi: number;
    prediccion: string;
    inversion_total: number;
    inversion_recuperada: number;
    inversion_actual: number;
    total_ingresos_reales: number;
    valor_market_total: number;
    valor_market_actual: number;
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
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Análisis Financiero</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {data?.message ? (
          <View style={styles.messageContainer}>
            <Ionicons name="alert-circle" size={64} color="#dc3545" />
            <Text style={styles.message}>{data.message}</Text>
          </View>
        ) : (
          <>
            {/* INVERSIÓN */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="wallet" size={24} color="#dc3545" />
                <Text style={styles.cardTitle}>Inversión</Text>
              </View>
              
              <View style={styles.metricRow}>
                <View style={styles.metricItem}>
                  <View style={styles.iconLabelRow}>
                    <Ionicons name="cash-outline" size={18} color="#666" />
                    <Text style={styles.metricLabel}>Total Invertido</Text>
                  </View>
                  <Text style={styles.metricValue}>
                    Bs.{data?.resumen?.inversion_total?.toLocaleString() || '0'}
                  </Text>
                </View>
                <View style={styles.metricItem}>
                  <View style={styles.iconLabelRow}>
                    <Ionicons name="trending-up" size={18} color="#28a745" />
                    <Text style={styles.metricLabel}>Recuperado</Text>
                  </View>
                  <Text style={[styles.metricValue, styles.positiveColor]}>
                    Bs.{data?.resumen?.inversion_recuperada?.toLocaleString() || '0'}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.metricRowCenter}>
                <View style={styles.iconLabelRow}>
                  <Ionicons name="file-tray-stacked" size={20} color="#007bff" />
                  <Text style={styles.metricLabel}>En Stock Actual</Text>
                </View>
                <Text style={[styles.metricValueLarge, styles.stockColor]}>
                  Bs.{data?.resumen?.inversion_actual?.toLocaleString() || '0'}
                </Text>
              </View>
            </View>

            {/* INGRESOS Y GANANCIAS */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="stats-chart" size={24} color="#28a745" />
                <Text style={styles.cardTitle}>Ingresos y Ganancias</Text>
              </View>
              
              <View style={styles.metricRow}>
                <View style={styles.metricItem}>
                  <View style={styles.iconLabelRow}>
                    <Ionicons name="cash" size={18} color="#007bff" />
                    <Text style={styles.metricLabel}>Ingresos Reales</Text>
                  </View>
                  <Text style={[styles.metricValue, styles.ingresoColor]}>
                    Bs.{data?.resumen?.total_ingresos_reales?.toLocaleString() || '0'}
                  </Text>
                  <Text style={styles.metricSubtext}>Monto total recibido</Text>
                </View>
                <View style={styles.metricItem}>
                  <View style={styles.iconLabelRow}>
                    <Ionicons name="trophy" size={18} color="#28a745" />
                    <Text style={styles.metricLabel}>Ganancias Reales</Text>
                  </View>
                  <Text style={[styles.metricValue, styles.positiveColor]}>
                    Bs.{data?.resumen?.ganancia_real?.toLocaleString() || '0'}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.metricRow}>
                <View style={styles.metricItem}>
                  <View style={styles.iconLabelRow}>
                    <Ionicons name="analytics" size={18} color="#fd7e14" />
                    <Text style={styles.metricLabel}>Margen de Ganancia</Text>
                  </View>
                  <Text style={styles.percentBadge}>
                    {data?.resumen?.margen_promedio ?? 0}%
                  </Text>
                  <Text style={styles.metricSubtext}>Ganancia / Ingresos</Text>
                </View>
                <View style={styles.metricItem}>
                  <View style={styles.iconLabelRow}>
                    <Ionicons name="trending-up" size={18} color="#6f42c1" />
                    <Text style={styles.metricLabel}>ROI</Text>
                  </View>
                  <Text style={[styles.percentBadge, styles.roiBadge]}>
                    {data?.resumen?.roi ?? 0}%
                  </Text>
                  <Text style={styles.metricSubtext}>Ganancia / Inversión</Text>
                </View>
              </View>
            </View>

            {/* VALOR POTENCIAL */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="trending-up" size={24} color="#6f42c1" />
                <Text style={styles.cardTitle}>Valor Potencial</Text>
              </View>
              
              <View style={styles.metricRow}>
                <View style={styles.metricItem}>
                  <View style={styles.iconLabelRow}>
                    <Ionicons name="albums" size={18} color="#6f42c1" />
                    <Text style={styles.metricLabel}>Total</Text>
                  </View>
                  <Text style={[styles.metricValue, styles.potencialColor]}>
                    Bs.{data?.resumen?.valor_market_total?.toLocaleString() || '0'}
                  </Text>
                  <Text style={styles.metricSubtext}>Monto Total estimado vendidos al precio establecido</Text>
                </View>
                <View style={styles.metricItem}>
                  <View style={styles.iconLabelRow}>
                    <Ionicons name="cube" size={18} color="#6f42c1" />
                    <Text style={styles.metricLabel}>Stock Actual</Text>
                  </View>
                  <Text style={[styles.metricValue, styles.potencialColor]}>
                    Bs.{data?.resumen?.valor_market_actual?.toLocaleString() || '0'}
                  </Text>
                  <Text style={styles.metricSubtext}>Monto restante en productos</Text>
                </View>
              </View>
            </View>

            {/* RESUMEN OPERATIVO */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="calculator" size={24} color="#fd7e14" />
                <Text style={styles.cardTitle}>Resumen Operativo</Text>
              </View>
              
              <View style={styles.metricRow}>
                <View style={styles.metricItem}>
                  <View style={styles.iconLabelRow}>
                    <Ionicons name="basket" size={18} color="#666" />
                    <Text style={styles.metricLabel}>Unidades vendidas</Text>
                  </View>
                  <Text style={styles.metricValue}>
                    {data?.resumen?.total_unidades_vendidas || 0}
                  </Text>
                </View>
                <View style={styles.metricItem}>
                  <View style={styles.iconLabelRow}>
                    <Ionicons name="calendar" size={18} color="#6f42c1" />
                    <Text style={styles.metricLabel}>Pronóstico mañana</Text>
                  </View>
                  <Text style={styles.prediccionText}>
                    {data?.resumen?.prediccion || 'Sin datos'}
                  </Text>
                </View>
              </View>
            </View>

            {/* TOP PRODUCTOS */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="ribbon" size={24} color="#ffc107" />
                <Text style={styles.cardTitle}>Top 5 Más Rentables</Text>
              </View>
              {data?.top_ganancia && Object.keys(data.top_ganancia).length > 0 ? (
                Object.entries(data.top_ganancia).map(([nombre, info]) => (
                  <View key={nombre} style={styles.topItem}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.topNameRow}>
                        <Ionicons name="pricetag" size={16} color="#333" />
                        <Text style={styles.topName}>{nombre}</Text>
                      </View>
                      <Text style={styles.topVentas}>
                        {info.ventas} vendidos a Bs.{info.precio_promedio_venta.toFixed(2)} promedio
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.topGanancia}>+Bs.{info.ganancia.toLocaleString()}</Text>
                      <View style={styles.margenContainer}>
                        <Ionicons name="checkmark-circle" size={14} color="#007bff" />
                        <Text style={styles.margenReal}>Bs.{info.ganancia_unitaria_real.toFixed(2)}/u</Text>
                      </View>
                      <View style={styles.margenContainer}>
                        <Ionicons name="rocket" size={14} color="#6f42c1" />
                        <Text style={styles.margenPotencial}>Bs.{info.ganancia_unitaria_potencial.toFixed(2)}/u</Text>
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
              <View style={styles.cardHeader}>
                <Ionicons name="warning" size={24} color="#dc3545" />
                <Text style={styles.cardTitle}>Alerta: Stock Bajo</Text>
              </View>
              {data?.stock_bajo && data.stock_bajo.length > 0 ? (
                data.stock_bajo.map((item, i) => (
                  <View key={i} style={styles.alertCard}>
                    <View style={styles.alertRow}>
                      <Ionicons name="alert-circle" size={20} color="#c62828" />
                      <Text style={styles.alertText}>{item.name}</Text>
                    </View>
                    <Text style={styles.alertStock}>
                      Solo {item.stock} unidades
                    </Text>
                  </View>
                ))
              ) : (
                <View style={styles.successRow}>
                  <Ionicons name="checkmark-circle" size={20} color="#28a745" />
                  <Text style={styles.successText}>Todo el stock está bien</Text>
                </View>
              )}
            </View>

            {/* GRÁFICOS */}
            {data?.graficos && (
              <>
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Ionicons name="bar-chart" size={24} color="#007bff" />
                    <Text style={styles.cardTitle}>Ventas Diarias</Text>
                  </View>
                  <Image
                    source={{ uri: `data:image/png;base64,${data.graficos.ventas_diarias}` }}
                    style={styles.chart}
                    resizeMode="contain"
                  />
                </View>

                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Ionicons name="pie-chart" size={24} color="#28a745" />
                    <Text style={styles.cardTitle}>Ganancia por Producto</Text>
                  </View>
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  
  iconLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 8,
  },
  metricRowCenter: {
    alignItems: 'center',
    marginVertical: 8,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginLeft: 5,
  },
  metricSubtext: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 3,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 5,
  },
  metricValueLarge: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 5,
  },
  
  positiveColor: { color: '#28a745' },
  ingresoColor: { color: '#007bff' },
  stockColor: { color: '#007bff' },
  potencialColor: { color: '#6f42c1' },
  
  margenBadge: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fd7e14',
    backgroundColor: '#fff3cd',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 5,
  },
  
  percentBadge: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fd7e14',
    backgroundColor: '#fff3cd',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 8,
  },
  
  roiBadge: {
    color: '#6f42c1',
    backgroundColor: '#f3e5f5',
  },
  
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 15,
  },
  
  prediccionText: {
    fontSize: 18,
    color: '#6f42c1',
    fontWeight: 'bold',
    marginTop: 5,
  },
  
  topItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  topNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  topName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  topVentas: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    marginLeft: 22,
  },
  topGanancia: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: 6,
  },
  margenContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  margenReal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#007bff',
    marginLeft: 4,
  },
  margenPotencial: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#6f42c1',
    marginLeft: 4,
  },
  
  alertCard: {
    backgroundColor: '#ffebee',
    padding: 15,
    borderRadius: 12,
    marginVertical: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#c62828',
    marginLeft: 8,
  },
  alertStock: {
    fontSize: 14,
    color: '#c62828',
    fontWeight: '600',
  },
  
  successRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  successText: {
    fontSize: 16,
    color: '#28a745',
    fontStyle: 'italic',
    marginLeft: 8,
  },
  
  empty: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  message: {
    fontSize: 18,
    color: '#dc3545',
    textAlign: 'center',
    marginTop: 20,
  },
  
  chart: {
    width: '100%',
    height: 320,
    borderRadius: 16,
    backgroundColor: '#fff',
    marginVertical: 10,
  },
  
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});