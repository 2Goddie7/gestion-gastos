import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Gasto } from '../types';

interface GastoCardProps {
  gasto: Gasto;
  accentColor?: string;
}

export default function GastoCard({ gasto, accentColor = '#6C63FF' }: GastoCardProps) {
  const formatearMoneda = (valor: number): string => {
    return `$${valor.toFixed(2)}`;
  };

  const formatearFecha = (fecha: string): string => {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.card}>
      <Image source={{ uri: gasto.fotoRecibo }} style={styles.thumbnail} />
      <View style={styles.info}>
        <Text style={styles.descripcion} numberOfLines={1}>
          {gasto.descripcion}
        </Text>
        <Text style={[styles.monto, { color: accentColor }]}>
          {formatearMoneda(gasto.monto)}
        </Text>
        <View style={styles.meta}>
          <Ionicons name="person" size={12} color={accentColor} />
          <Text style={styles.metaText}>{gasto.pagadoPor}</Text>
          <Ionicons name="time-outline" size={12} color="#999" style={{ marginLeft: 8 }} />
          <Text style={styles.metaText}>{formatearFecha(gasto.fecha)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  thumbnail: {
    width: 70,
    height: 70,
    borderRadius: 12,
    marginRight: 12,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  descripcion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  monto: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
});