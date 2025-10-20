import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { obtenerGastos } from '../storage/storage';
import { Gasto, Balance, Deuda } from '../types';
import { Ionicons } from '@expo/vector-icons';
import Layout from '../components/Layout';

const PRIMARY_COLOR = '#9333EA';
const BACKGROUND_COLOR = '#F8FAFC';

export default function BalancesScreen() {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [deudas, setDeudas] = useState<Deuda[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const cargarGastos = async () => {
    try {
      const gastosObtenidos = await obtenerGastos();
      setGastos(gastosObtenidos);
      calcularBalances(gastosObtenidos);
    } catch (error) {
      console.error('Error al cargar gastos:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarGastos();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarGastos();
    setRefreshing(false);
  };

  const calcularBalances = (gastos: Gasto[]) => {
    const balanceMap: { [persona: string]: Balance } = {};

    gastos.forEach(gasto => {
      const costoPorPersona = gasto.monto / gasto.participantes.length;

      [gasto.pagadoPor, ...gasto.participantes].forEach(persona => {
        if (!balanceMap[persona]) {
          balanceMap[persona] = {
            persona,
            debe: {},
            lesDeben: {},
            total: 0,
          };
        }
      });

      gasto.participantes.forEach(participante => {
        if (participante !== gasto.pagadoPor) {
          if (!balanceMap[participante].debe[gasto.pagadoPor]) {
            balanceMap[participante].debe[gasto.pagadoPor] = 0;
          }
          balanceMap[participante].debe[gasto.pagadoPor] += costoPorPersona;

          if (!balanceMap[gasto.pagadoPor].lesDeben[participante]) {
            balanceMap[gasto.pagadoPor].lesDeben[participante] = 0;
          }
          balanceMap[gasto.pagadoPor].lesDeben[participante] += costoPorPersona;
        }
      });
    });

    Object.values(balanceMap).forEach(balance => {
      const totalLesDeben = Object.values(balance.lesDeben).reduce((sum, val) => sum + val, 0);
      const totalDebe = Object.values(balance.debe).reduce((sum, val) => sum + val, 0);
      balance.total = totalLesDeben - totalDebe;
    });

    const deudasSimplificadas = simplificarDeudas(balanceMap);

    setBalances(Object.values(balanceMap));
    setDeudas(deudasSimplificadas);
  };

  const simplificarDeudas = (balanceMap: { [persona: string]: Balance }): Deuda[] => {
    const deudores = Object.values(balanceMap)
      .filter(b => b.total < 0)
      .map(b => ({ persona: b.persona, monto: -b.total }))
      .sort((a, b) => b.monto - a.monto);

    const acreedores = Object.values(balanceMap)
      .filter(b => b.total > 0)
      .map(b => ({ persona: b.persona, monto: b.total }))
      .sort((a, b) => b.monto - a.monto);

    const deudasSimplificadas: Deuda[] = [];
    let i = 0;
    let j = 0;

    while (i < deudores.length && j < acreedores.length) {
      const montoAPagar = Math.min(deudores[i].monto, acreedores[j].monto);

      deudasSimplificadas.push({
        deudor: deudores[i].persona,
        acreedor: acreedores[j].persona,
        monto: montoAPagar,
      });

      deudores[i].monto -= montoAPagar;
      acreedores[j].monto -= montoAPagar;

      if (deudores[i].monto === 0) i++;
      if (acreedores[j].monto === 0) j++;
    }

    return deudasSimplificadas;
  };

  const formatearMoneda = (valor: number): string => {
    return `${valor.toFixed(0)}`;
  };

  if (gastos.length === 0) {
    return (
      <Layout backgroundColor={BACKGROUND_COLOR} headerColor={PRIMARY_COLOR}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Balance de Cuentas</Text>
            <Text style={styles.headerSubtitle}>¿Quién debe a quién?</Text>
          </View>
          <View style={styles.emptyState}>
            <Ionicons name="calculator-outline" size={80} color="#CBD5E1" />
            <Text style={styles.emptyText}>No hay gastos registrados</Text>
            <Text style={styles.emptySubtext}>Agrega gastos para ver el balance</Text>
          </View>
        </View>
      </Layout>
    );
  }

  return (
    <Layout backgroundColor={BACKGROUND_COLOR} headerColor={PRIMARY_COLOR}>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[PRIMARY_COLOR]} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Balance de Cuentas</Text>
          <Text style={styles.headerSubtitle}>¿Quién debe a quién?</Text>
        </View>

        <View style={styles.content}>
          {/* Resumen de Deudas */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="swap-horizontal" size={20} color="#1E293B" />
              <Text style={styles.sectionTitle}>Resumen de Deudas</Text>
            </View>

            {deudas.length > 0 ? (
              deudas.map((deuda, index) => (
                <View key={index} style={styles.deudaCard}>
                  <View style={styles.deudaLeft}>
                    <View style={styles.avatarDeudor}>
                      <Text style={styles.avatarText}>{deuda.deudor.charAt(0)}</Text>
                    </View>
                    <View>
                      <Text style={styles.deudorNombre}>{deuda.deudor}</Text>
                      <Text style={styles.deudaMeta}>debe a {deuda.acreedor}</Text>
                    </View>
                  </View>
                  <View style={styles.deudaRight}>
                    <Text style={styles.deudaMonto}>{formatearMoneda(deuda.monto)}</Text>
                    <TouchableOpacity style={styles.marcarPagadoBtn}>
                      <Text style={styles.marcarPagadoText}>Marcar pagado</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.noDeudas}>
                <Ionicons name="checkmark-circle" size={48} color="#10B981" />
                <Text style={styles.noDeudasText}>Todas las cuentas están saldadas</Text>
              </View>
            )}
          </View>

          {/* Algoritmo de División */}
          <View style={styles.algoritmoCard}>
            <Text style={styles.algoritmoTitle}>Algoritmo de División</Text>
            <Text style={styles.algoritmoSubtitle}>Método: Simplificación de deudas</Text>
            <View style={styles.algoritmoDivider} />
            {Object.values(
              gastos.reduce((acc, gasto) => {
                if (!acc[gasto.pagadoPor]) {
                  acc[gasto.pagadoPor] = 0;
                }
                acc[gasto.pagadoPor] += gasto.monto;
                return acc;
              }, {} as { [key: string]: number })
            ).length > 0 && (
              <>
                {Object.entries(
                  gastos.reduce((acc, gasto) => {
                    if (!acc[gasto.pagadoPor]) {
                      acc[gasto.pagadoPor] = 0;
                    }
                    acc[gasto.pagadoPor] += gasto.monto;
                    return acc;
                  }, {} as { [key: string]: number })
                ).map(([persona, total]) => (
                  <Text key={persona} style={styles.algoritmoLine}>
                    {persona} gastó: {formatearMoneda(total)}
                  </Text>
                ))}
                <View style={styles.algoritmoDivider} />
                <Text style={styles.algoritmoLine}>
                  Promedio por persona: {formatearMoneda(
                    gastos.reduce((sum, g) => sum + g.monto, 0) / 
                    new Set(gastos.flatMap(g => [g.pagadoPor, ...g.participantes])).size
                  )}
                </Text>
              </>
            )}
          </View>
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
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  deudaCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  deudaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarDeudor: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#DC2626',
  },
  deudorNombre: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  deudaMeta: {
    fontSize: 13,
    color: '#64748B',
  },
  deudaRight: {
    alignItems: 'flex-end',
  },
  deudaMonto: {
    fontSize: 20,
    fontWeight: '700',
    color: '#DC2626',
    marginBottom: 4,
  },
  marcarPagadoBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  marcarPagadoText: {
    fontSize: 12,
    fontWeight: '600',
    color: PRIMARY_COLOR,
  },
  noDeudas: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  noDeudasText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
    marginTop: 12,
  },
  algoritmoCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 20,
  },
  algoritmoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  algoritmoSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
  },
  algoritmoDivider: {
    height: 1,
    backgroundColor: '#D1FAE5',
    marginVertical: 12,
  },
  algoritmoLine: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 8,
  },
});