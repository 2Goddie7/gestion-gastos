import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { obtenerGastos } from '../storage/storage';
import { Gasto, Balance, Deuda } from '../types';
import { Ionicons } from '@expo/vector-icons';
import Layout from '../components/Layout';
import ScreenHeader from '../components/ScreenHeader';
import EmptyState from '../components/EmptyState';

const PRIMARY_COLOR = '#FF6B9D';
const SECONDARY_COLOR = '#F5F7FA';

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
    return `${valor.toFixed(2)}`;
  };

  if (gastos.length === 0) {
    return (
      <Layout backgroundColor={SECONDARY_COLOR} headerColor={PRIMARY_COLOR}>
        <ScreenHeader
          title="Balance General"
          subtitle="Calcula quién debe a quién"
          backgroundColor={PRIMARY_COLOR}
        />
        <EmptyState
          icon="calculator-outline"
          title="No hay gastos registrados"
          subtitle="Agrega gastos desde la pantalla de Inicio"
          iconColor="#CCC"
        />
      </Layout>
    );
  }

  return (
    <Layout backgroundColor={SECONDARY_COLOR} headerColor={PRIMARY_COLOR}>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <ScreenHeader
          title="Balance General"
          subtitle={`Total de gastos: ${formatearMoneda(gastos.reduce((sum, g) => sum + g.monto, 0))}`}
          backgroundColor={PRIMARY_COLOR}
        />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="swap-horizontal" size={20} /> Resumen de Deudas
          </Text>
          {deudas.length > 0 ? (
            deudas.map((deuda, index) => (
              <View key={index} style={styles.deudaCard}>
                <View style={styles.deudaHeader}>
                  <Ionicons name="person" size={20} color="#E74C3C" />
                  <Text style={styles.deudorText}>{deuda.deudor}</Text>
                </View>
                <View style={styles.deudaArrow}>
                  <Ionicons name="arrow-forward" size={24} color="#999" />
                  <Text style={[styles.montoDeuda, { color: PRIMARY_COLOR }]}>
                    {formatearMoneda(deuda.monto)}
                  </Text>
                </View>
                <View style={styles.deudaHeader}>
                  <Ionicons name="person" size={20} color="#27AE60" />
                  <Text style={styles.acreedorText}>{deuda.acreedor}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noDeudas}>✓ Todas las cuentas están saldadas</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="people" size={20} /> Balance por Persona
          </Text>
          {balances.map((balance, index) => (
            <View key={index} style={styles.balanceCard}>
              <View style={styles.balanceHeader}>
                <Ionicons
                  name="person-circle"
                  size={24}
                  color={balance.total >= 0 ? '#27AE60' : '#E74C3C'}
                />
                <Text style={styles.personaText}>{balance.persona}</Text>
              </View>

              <View style={styles.balanceTotal}>
                <Text
                  style={[
                    styles.totalText,
                    balance.total >= 0 ? styles.positivo : styles.negativo,
                  ]}
                >
                  {balance.total >= 0 ? '+' : ''}
                  {formatearMoneda(balance.total)}
                </Text>
                <Text style={styles.totalLabel}>
                  {balance.total > 0 ? 'Le deben' : balance.total < 0 ? 'Debe' : 'Saldado'}
                </Text>
              </View>

              {Object.keys(balance.lesDeben).length > 0 && (
                <View style={styles.detalle}>
                  <Text style={styles.detalleTitle}>Le deben:</Text>
                  {Object.entries(balance.lesDeben).map(([persona, monto]) => (
                    <Text key={persona} style={styles.detalleText}>
                      • {persona}: {formatearMoneda(monto)}
                    </Text>
                  ))}
                </View>
              )}

              {Object.keys(balance.debe).length > 0 && (
                <View style={styles.detalle}>
                  <Text style={styles.detalleTitle}>Debe a:</Text>
                  {Object.entries(balance.debe).map(([persona, monto]) => (
                    <Text key={persona} style={styles.detalleText}>
                      • {persona}: {formatearMoneda(monto)}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  deudaCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deudaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  deudorText: {
    fontSize: 16,
    color: '#E74C3C',
    fontWeight: '600',
    marginLeft: 8,
  },
  acreedorText: {
    fontSize: 16,
    color: '#27AE60',
    fontWeight: '600',
    marginLeft: 8,
  },
  deudaArrow: {
    alignItems: 'center',
    marginHorizontal: 10,
  },
  montoDeuda: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  noDeudas: {
    fontSize: 16,
    color: '#27AE60',
    textAlign: 'center',
    padding: 20,
    backgroundColor: '#E8F8F5',
    borderRadius: 8,
  },
  balanceCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  personaText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  balanceTotal: {
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#EEE',
    marginBottom: 10,
  },
  totalText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  positivo: {
    color: '#27AE60',
  },
  negativo: {
    color: '#E74C3C',
  },
  totalLabel: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  detalle: {
    marginTop: 8,
  },
  detalleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 5,
  },
  detalleText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    marginTop: 2,
  },
});