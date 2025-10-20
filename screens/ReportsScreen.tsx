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

export default function ReportsScreen() {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(false);
  const [estadisticas, setEstadisticas] = useState({
    totalGastos: 0,
    cantidadGastos: 0,
    promedioGasto: 0,
    gastoMayor: 0,
    gastoMenor: 0,
    totalPersonas: 0,
  });

  const cargarGastos = async () => {
    try {
      const gastosObtenidos = await obtenerGastos();
      setGastos(gastosObtenidos);
      calcularEstadisticas(gastosObtenidos);
    } catch (error) {
      console.error('Error al cargar gastos:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarGastos();
    }, [])
  );

  const calcularEstadisticas = (gastos: Gasto[]) => {
    if (gastos.length === 0) {
      setEstadisticas({
        totalGastos: 0,
        cantidadGastos: 0,
        promedioGasto: 0,
        gastoMayor: 0,
        gastoMenor: 0,
        totalPersonas: 0,
      });
      return;
    }

    const totalGastos = gastos.reduce((sum, g) => sum + g.monto, 0);
    const montos = gastos.map(g => g.monto);
    const personasSet = new Set<string>();
    
    gastos.forEach(g => {
      personasSet.add(g.pagadoPor);
      g.participantes.forEach(p => personasSet.add(p));
    });

    setEstadisticas({
      totalGastos,
      cantidadGastos: gastos.length,
      promedioGasto: totalGastos / gastos.length,
      gastoMayor: Math.max(...montos),
      gastoMenor: Math.min(...montos),
      totalPersonas: personasSet.size,
    });
  };

  const formatearMoneda = (valor: number): string => {
    return `$${valor.toFixed(2)}`;
  };

  const formatearFecha = (fecha: string): string => {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const generarHTML = (): string => {
    const ahora = new Date().toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Calcular balances
    const balanceMap: { [persona: string]: number } = {};
    gastos.forEach(gasto => {
      const costoPorPersona = gasto.monto / gasto.participantes.length;
      
      if (!balanceMap[gasto.pagadoPor]) {
        balanceMap[gasto.pagadoPor] = 0;
      }
      
      gasto.participantes.forEach(participante => {
        if (!balanceMap[participante]) {
          balanceMap[participante] = 0;
        }
        
        if (participante !== gasto.pagadoPor) {
          balanceMap[participante] -= costoPorPersona;
          balanceMap[gasto.pagadoPor] += costoPorPersona;
        }
      });
    });

    const gastosHTML = gastos
      .map(
        (gasto, index) => `
      <tr style="${index % 2 === 0 ? 'background-color: #f9f9f9;' : ''}">
        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">${formatearFecha(gasto.fecha)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">${gasto.descripcion}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: right; font-weight: bold; color: #27AE60;">${formatearMoneda(gasto.monto)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">${gasto.pagadoPor}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">${gasto.participantes.join(', ')}</td>
      </tr>
    `
      )
      .join('');

    const balancesHTML = Object.entries(balanceMap)
      .sort(([, a], [, b]) => b - a)
      .map(
        ([persona, balance]) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; font-weight: 600;">${persona}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: right; font-weight: bold; color: ${balance >= 0 ? '#27AE60' : '#E74C3C'};">
          ${balance >= 0 ? '+' : ''}${formatearMoneda(balance)}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">
          ${balance > 0 ? 'Le deben' : balance < 0 ? 'Debe' : 'Saldado'}
        </td>
      </tr>
    `
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 30px;
            color: #333;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #4A90E2;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #4A90E2;
            margin: 0 0 10px 0;
          }
          .header p {
            color: #666;
            margin: 5px 0;
          }
          .section {
            margin-bottom: 30px;
            page-break-inside: avoid;
          }
          .section h2 {
            color: #333;
            border-bottom: 2px solid #e0e0e0;
            padding-bottom: 10px;
            margin-bottom: 15px;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-bottom: 20px;
          }
          .stat-card {
            background-color: #f5f7fa;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
          }
          .stat-label {
            color: #666;
            font-size: 12px;
            margin-bottom: 5px;
          }
          .stat-value {
            color: #333;
            font-size: 24px;
            font-weight: bold;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
          }
          th {
            background-color: #4A90E2;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 600;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            color: #999;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📊 Reporte de Gastos Compartidos</h1>
          <p>Generado el: ${ahora}</p>
        </div>

        <div class="section">
          <h2>📈 Estadísticas Generales</h2>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">Total Gastado</div>
              <div class="stat-value">${formatearMoneda(estadisticas.totalGastos)}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Cantidad de Gastos</div>
              <div class="stat-value">${estadisticas.cantidadGastos}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Promedio por Gasto</div>
              <div class="stat-value">${formatearMoneda(estadisticas.promedioGasto)}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Gasto Mayor</div>
              <div class="stat-value">${formatearMoneda(estadisticas.gastoMayor)}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Gasto Menor</div>
              <div class="stat-value">${formatearMoneda(estadisticas.gastoMenor)}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Total Personas</div>
              <div class="stat-value">${estadisticas.totalPersonas}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>💰 Balance General</h2>
          <table>
            <thead>
              <tr>
                <th>Persona</th>
                <th style="text-align: right;">Balance</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              ${balancesHTML}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>🧾 Detalle de Gastos</h2>
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Descripción</th>
                <th style="text-align: right;">Monto</th>
                <th>Pagado por</th>
                <th>Participantes</th>
              </tr>
            </thead>
            <tbody>
              ${gastosHTML}
            </tbody>
          </table>
        </div>

        <div class="footer">
          <p>Gestión de Gastos Compartidos - Reporte generado automáticamente</p>
        </div>
      </body>
      </html>
    `;
  };

  const generarPDF = async () => {
    if (gastos.length === 0) {
      Alert.alert('Sin datos', 'No hay gastos registrados para generar el reporte');
      return;
    }

    setLoading(true);
    try {
      const html = generarHTML();
      
      // Generar el PDF
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });

      // Compartir el PDF
      await shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
      });

      Alert.alert('Éxito', 'Reporte PDF generado correctamente');
    } catch (error) {
      console.error('Error al generar PDF:', error);
      Alert.alert('Error', 'No se pudo generar el reporte PDF');
    } finally {
      setLoading(false);
    }
  };

  if (gastos.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="bar-chart-outline" size={80} color="#CCC" />
        <Text style={styles.emptyText}>No hay datos para reportar</Text>
        <Text style={styles.emptySubtext}>
          Registra gastos para ver estadísticas y generar reportes
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reportes</Text>
        <Text style={styles.headerSubtitle}>Estadísticas y resúmenes</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="stats-chart" size={20} /> Estadísticas Generales
          </Text>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="cash-outline" size={32} color="#27AE60" />
              <Text style={styles.statValue}>
                {formatearMoneda(estadisticas.totalGastos)}
              </Text>
              <Text style={styles.statLabel}>Total Gastado</Text>
            </View>

            <View style={styles.statCard}>
              <Ionicons name="receipt-outline" size={32} color="#4A90E2" />
              <Text style={styles.statValue}>{estadisticas.cantidadGastos}</Text>
              <Text style={styles.statLabel}>Cantidad de Gastos</Text>
            </View>

            <View style={styles.statCard}>
              <Ionicons name="calculator-outline" size={32} color="#9B59B6" />
              <Text style={styles.statValue}>
                {formatearMoneda(estadisticas.promedioGasto)}
              </Text>
              <Text style={styles.statLabel}>Promedio por Gasto</Text>
            </View>

            <View style={styles.statCard}>
              <Ionicons name="trending-up" size={32} color="#E74C3C" />
              <Text style={styles.statValue}>
                {formatearMoneda(estadisticas.gastoMayor)}
              </Text>
              <Text style={styles.statLabel}>Gasto Mayor</Text>
            </View>

            <View style={styles.statCard}>
              <Ionicons name="trending-down" size={32} color="#3498DB" />
              <Text style={styles.statValue}>
                {formatearMoneda(estadisticas.gastoMenor)}
              </Text>
              <Text style={styles.statLabel}>Gasto Menor</Text>
            </View>

            <View style={styles.statCard}>
              <Ionicons name="people-outline" size={32} color="#E67E22" />
              <Text style={styles.statValue}>{estadisticas.totalPersonas}</Text>
              <Text style={styles.statLabel}>Total Personas</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="pie-chart" size={20} /> Resumen por Persona
          </Text>
          {(() => {
            const gastoPorPersona: { [persona: string]: number } = {};
            gastos.forEach(gasto => {
              if (!gastoPorPersona[gasto.pagadoPor]) {
                gastoPorPersona[gasto.pagadoPor] = 0;
              }
              gastoPorPersona[gasto.pagadoPor] += gasto.monto;
            });

            return Object.entries(gastoPorPersona)
              .sort(([, a], [, b]) => b - a)
              .map(([persona, total]) => (
                <View key={persona} style={styles.personCard}>
                  <View style={styles.personHeader}>
                    <Ionicons name="person-circle" size={24} color="#4A90E2" />
                    <Text style={styles.personName}>{persona}</Text>
                  </View>
                  <View style={styles.personStats}>
                    <Text style={styles.personTotal}>
                      {formatearMoneda(total)}
                    </Text>
                    <Text style={styles.personLabel}>pagado</Text>
                  </View>
                </View>
              ));
          })()}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="calendar" size={20} /> Gastos Recientes
          </Text>
          {gastos.slice(0, 5).map(gasto => (
            <View key={gasto.id} style={styles.gastoCard}>
              <View style={styles.gastoHeader}>
                <Text style={styles.gastoDescripcion}>{gasto.descripcion}</Text>
                <Text style={styles.gastoMonto}>
                  {formatearMoneda(gasto.monto)}
                </Text>
              </View>
              <View style={styles.gastoFooter}>
                <Text style={styles.gastoFecha}>
                  {formatearFecha(gasto.fecha)}
                </Text>
                <Text style={styles.gastoPagador}>Por: {gasto.pagadoPor}</Text>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.pdfButton, loading && styles.pdfButtonDisabled]}
          onPress={generarPDF}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <>
              <Ionicons name="document-text" size={24} color="#FFF" />
              <Text style={styles.pdfButtonText}>Generar PDF y Compartir</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5F7FA',
  },
  emptyText: {
    fontSize: 20,
    color: '#999',
    marginTop: 20,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 16,
    color: '#BBB',
    marginTop: 10,
    textAlign: 'center',
  },
  header: {
    backgroundColor: '#4A90E2',
    padding: 20,
    paddingTop: 60,
    paddingBottom: 30,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E3F2FD',
  },
  content: {
    padding: 15,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    width: '48%',
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  personCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  personHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  personName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10,
  },
  personStats: {
    alignItems: 'flex-end',
  },
  personTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#27AE60',
  },
  personLabel: {
    fontSize: 12,
    color: '#999',
  },
  gastoCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  gastoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  gastoDescripcion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  gastoMonto: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#27AE60',
    marginLeft: 10,
  },
  gastoFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gastoFecha: {
    fontSize: 12,
    color: '#999',
  },
  gastoPagador: {
    fontSize: 12,
    color: '#4A90E2',
  },
  pdfButton: {
    backgroundColor: '#E74C3C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 30,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  pdfButtonDisabled: {
    backgroundColor: '#ECBCBC',
  },
  pdfButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
});