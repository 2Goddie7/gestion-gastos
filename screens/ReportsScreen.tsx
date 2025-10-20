import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { obtenerGastos } from '../storage/storage';
import { Gasto } from '../types';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import Layout from '../components/Layout';

const PRIMARY_COLOR = '#5B5FF9';
const BACKGROUND_COLOR = '#F8FAFC';

export default function ReportsScreen() {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(false);

  const cargarGastos = async () => {
    try {
      const gastosObtenidos = await obtenerGastos();
      setGastos(gastosObtenidos);
    } catch (error) {
      console.error('Error al cargar gastos:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarGastos();
    }, [])
  );

  const calcularTotalMes = () => {
    return gastos.reduce((sum, g) => sum + g.monto, 0);
  };

  const calcularPromedioDia = () => {
    if (gastos.length === 0) return 0;
    const diasUnicos = new Set(gastos.map(g => new Date(g.fecha).toDateString())).size;
    return calcularTotalMes() / Math.max(diasUnicos, 1);
  };

  const calcularGastosPorCategoria = () => {
    const categorias: { [key: string]: number } = {
      'Comida': 0,
      'Restaurantes': 0,
      'Transporte': 0,
    };

    gastos.forEach(gasto => {
      const desc = gasto.descripcion.toLowerCase();
      if (desc.includes('super') || desc.includes('comida')) {
        categorias['Comida'] += gasto.monto;
      } else if (desc.includes('restaurante') || desc.includes('cena')) {
        categorias['Restaurantes'] += gasto.monto;
      } else if (desc.includes('uber') || desc.includes('taxi') || desc.includes('transporte')) {
        categorias['Transporte'] += gasto.monto;
      }
    });

    return categorias;
  };

  const formatearMoneda = (valor: number): string => {
    return `${Math.round(valor)}`;
  };

  const obtenerMesActual = () => {
    return new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  };

  const generarPDF = async () => {
    if (gastos.length === 0) {
      Alert.alert('Sin datos', 'No hay gastos registrados para generar el reporte');
      return;
    }

    setLoading(true);
    try {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; padding: 30px; }
            .header { text-align: center; margin-bottom: 30px; }
            h1 { color: ${PRIMARY_COLOR}; }
            .stat { margin: 10px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: ${PRIMARY_COLOR}; color: white; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📊 Reporte Mensual</h1>
            <p>${obtenerMesActual()}</p>
          </div>
          <div class="stat">Total Gastos: ${formatearMoneda(calcularTotalMes())}</div>
          <div class="stat">Promedio/día: ${formatearMoneda(calcularPromedioDia())}</div>
          <table>
            <tr><th>Fecha</th><th>Descripción</th><th>Monto</th><th>Pagado por</th></tr>
            ${gastos.map(g => `
              <tr>
                <td>${new Date(g.fecha).toLocaleDateString('es-ES')}</td>
                <td>${g.descripcion}</td>
                <td>${formatearMoneda(g.monto)}</td>
                <td>${g.pagadoPor}</td>
              </tr>
            `).join('')}
          </table>
        </body>
        </html>
      `;
      
      const { uri } = await Print.printToFileAsync({ html });
      await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      
      Alert.alert('Éxito', 'Reporte PDF generado correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo generar el reporte PDF');
    } finally {
      setLoading(false);
    }
  };

  if (gastos.length === 0) {
    return (
      <Layout backgroundColor={BACKGROUND_COLOR} headerColor={PRIMARY_COLOR}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Reporte Mensual</Text>
            <Text style={styles.headerSubtitle}>{obtenerMesActual()}</Text>
          </View>
          <View style={styles.emptyState}>
            <Ionicons name="bar-chart-outline" size={80} color="#CBD5E1" />
            <Text style={styles.emptyText}>No hay datos para reportar</Text>
            <Text style={styles.emptySubtext}>Registra gastos para ver estadísticas</Text>
          </View>
        </View>
      </Layout>
    );
  }

  const categorias = calcularGastosPorCategoria();
  const totalCategorias = Object.values(categorias).reduce((a, b) => a + b, 0);

  return (
    <Layout backgroundColor={BACKGROUND_COLOR} headerColor={PRIMARY_COLOR}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Reporte Mensual</Text>
          <Text style={styles.headerSubtitle}>{obtenerMesActual()}</Text>
        </View>

        <View style={styles.content}>
          {/* Totales */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total Gastos</Text>
              <Text style={styles.statValue}>{formatearMoneda(calcularTotalMes())}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Promedio/día</Text>
              <Text style={styles.statValue}>{formatearMoneda(calcularPromedioDia())}</Text>
            </View>
          </View>

          {/* Gastos por Categoría */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gastos por Categoría</Text>
            
            {Object.entries(categorias).map(([categoria, monto]) => {
              const porcentaje = totalCategorias > 0 ? (monto / totalCategorias) * 100 : 0;
              let color = '#3B82F6';
              if (categoria === 'Restaurantes') color = '#8B5CF6';
              if (categoria === 'Transporte') color = '#F97316';

              return monto > 0 ? (
                <View key={categoria} style={styles.categoriaItem}>
                  <View style={styles.categoriaHeader}>
                    <Text style={styles.categoriaNombre}>{categoria}</Text>
                    <Text style={styles.categoriaMonto}>{formatearMoneda(monto)}</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { width: `${porcentaje}%`, backgroundColor: color }
                      ]} 
                    />
                  </View>
                </View>
              ) : null;
            })}
          </View>

          {/* Período del Reporte */}
          <View style={styles.periodoCard}>
            <View style={styles.periodoHeader}>
              <Ionicons name="calendar" size={20} color="#64748B" />
              <Text style={styles.periodoTitle}>Período del Reporte</Text>
            </View>
            <View style={styles.periodoRow}>
              <View style={styles.periodoItem}>
                <Text style={styles.periodoLabel}>01/10/2025</Text>
              </View>
              <View style={styles.periodoItem}>
                <Text style={styles.periodoLabel}>17/10/2025</Text>
              </View>
            </View>
          </View>

          {/* Botones de Acción */}
          <TouchableOpacity
            style={[styles.pdfButton, loading && styles.pdfButtonDisabled]}
            onPress={generarPDF}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Ionicons name="download" size={20} color="#FFF" />
                <Text style={styles.pdfButtonText}>Generar PDF</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.shareButton}>
            <Text style={styles.shareButtonText}>Compartir Reporte</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textTransform: 'capitalize',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 8,
  },
  content: {
    padding: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statLabel: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
  },
  categoriaItem: {
    marginBottom: 20,
  },
  categoriaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoriaNombre: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  categoriaMonto: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  periodoCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  periodoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  periodoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  periodoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  periodoItem: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  periodoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
  },
  pdfButton: {
    backgroundColor: PRIMARY_COLOR,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  pdfButtonDisabled: {
    opacity: 0.6,
  },
  pdfButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  shareButton: {
    backgroundColor: '#FFF',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: PRIMARY_COLOR,
  },
  shareButtonText: {
    color: PRIMARY_COLOR,
    fontSize: 16,
    fontWeight: '700',
  },
});