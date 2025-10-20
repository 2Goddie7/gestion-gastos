import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { obtenerGastos, eliminarGasto } from '../storage/storage';
import { Gasto } from '../types';
import { Ionicons } from '@expo/vector-icons';

export default function ReciboScreen() {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [selectedGasto, setSelectedGasto] = useState<Gasto | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const cargarGastos = async () => {
    try {
      const gastosObtenidos = await obtenerGastos();
      // Ordenar por fecha más reciente
      const gastosOrdenados = gastosObtenidos.sort(
        (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      );
      setGastos(gastosOrdenados);
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

  const verDetalle = (gasto: Gasto) => {
    setSelectedGasto(gasto);
    setModalVisible(true);
  };

  const verImagenCompleta = () => {
    setModalVisible(false);
    setTimeout(() => {
      setImageModalVisible(true);
    }, 300);
  };

  const confirmarEliminar = () => {
    if (!selectedGasto) return;

    Alert.alert(
      'Eliminar Gasto',
      '¿Estás seguro de que deseas eliminar este gasto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await eliminarGasto(selectedGasto.id);
              await cargarGastos();
              setModalVisible(false);
              Alert.alert('Éxito', 'Gasto eliminado correctamente');
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el gasto');
            }
          },
        },
      ]
    );
  };

  const formatearFecha = (fecha: string): string => {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatearMoneda = (valor: number): string => {
    return `$${valor.toFixed(2)}`;
  };

  const renderGasto = ({ item }: { item: Gasto }) => (
    <TouchableOpacity
      style={styles.gastoCard}
      onPress={() => verDetalle(item)}
      activeOpacity={0.7}
    >
      <Image source={{ uri: item.fotoRecibo }} style={styles.thumbnail} />
      
      <View style={styles.gastoInfo}>
        <Text style={styles.descripcion} numberOfLines={1}>
          {item.descripcion}
        </Text>
        <Text style={styles.monto}>{formatearMoneda(item.monto)}</Text>
        <Text style={styles.fecha}>{formatearFecha(item.fecha)}</Text>
        <View style={styles.participantesContainer}>
          <Ionicons name="people" size={14} color="#666" />
          <Text style={styles.participantes} numberOfLines={1}>
            {item.participantes.length} persona{item.participantes.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      <View style={styles.pagadorContainer}>
        <Text style={styles.pagadorLabel}>Pagó:</Text>
        <Text style={styles.pagador} numberOfLines={1}>
          {item.pagadoPor}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={24} color="#CCC" />
    </TouchableOpacity>
  );

  if (gastos.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="receipt-outline" size={80} color="#CCC" />
        <Text style={styles.emptyText}>No hay recibos registrados</Text>
        <Text style={styles.emptySubtext}>
          Los gastos que registres aparecerán aquí
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Recibos</Text>
        <Text style={styles.headerSubtitle}>
          {gastos.length} recibo{gastos.length !== 1 ? 's' : ''} registrado{gastos.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={gastos}
        renderItem={renderGasto}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      {/* Modal de Detalle */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        {selectedGasto && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Detalle del Gasto</Text>
              <TouchableOpacity onPress={confirmarEliminar}>
                <Ionicons name="trash-outline" size={28} color="#E74C3C" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <TouchableOpacity
                onPress={verImagenCompleta}
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri: selectedGasto.fotoRecibo }}
                  style={styles.reciboImage}
                />
                <View style={styles.imageOverlay}>
                  <Ionicons name="expand" size={30} color="#FFF" />
                  <Text style={styles.imageOverlayText}>Toca para ampliar</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.detalleSection}>
                <View style={styles.detalleRow}>
                  <Ionicons name="document-text" size={24} color="#4A90E2" />
                  <View style={styles.detalleContent}>
                    <Text style={styles.detalleLabel}>Descripción</Text>
                    <Text style={styles.detalleValue}>{selectedGasto.descripcion}</Text>
                  </View>
                </View>

                <View style={styles.detalleRow}>
                  <Ionicons name="cash" size={24} color="#27AE60" />
                  <View style={styles.detalleContent}>
                    <Text style={styles.detalleLabel}>Monto Total</Text>
                    <Text style={styles.detalleValueBold}>
                      {formatearMoneda(selectedGasto.monto)}
                    </Text>
                  </View>
                </View>

                <View style={styles.detalleRow}>
                  <Ionicons name="person" size={24} color="#9B59B6" />
                  <View style={styles.detalleContent}>
                    <Text style={styles.detalleLabel}>Pagado por</Text>
                    <Text style={styles.detalleValue}>{selectedGasto.pagadoPor}</Text>
                  </View>
                </View>

                <View style={styles.detalleRow}>
                  <Ionicons name="people" size={24} color="#E67E22" />
                  <View style={styles.detalleContent}>
                    <Text style={styles.detalleLabel}>Participantes</Text>
                    <Text style={styles.detalleValue}>
                      {selectedGasto.participantes.join(', ')}
                    </Text>
                  </View>
                </View>

                <View style={styles.detalleRow}>
                  <Ionicons name="calculator" size={24} color="#34495E" />
                  <View style={styles.detalleContent}>
                    <Text style={styles.detalleLabel}>Costo por persona</Text>
                    <Text style={styles.detalleValueBold}>
                      {formatearMoneda(selectedGasto.monto / selectedGasto.participantes.length)}
                    </Text>
                  </View>
                </View>

                <View style={styles.detalleRow}>
                  <Ionicons name="calendar" size={24} color="#95A5A6" />
                  <View style={styles.detalleContent}>
                    <Text style={styles.detalleLabel}>Fecha</Text>
                    <Text style={styles.detalleValue}>
                      {formatearFecha(selectedGasto.fecha)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}
      </Modal>

      {/* Modal de Imagen Completa */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={imageModalVisible}
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.imageModalContainer}>
          <TouchableOpacity
            style={styles.closeImageButton}
            onPress={() => setImageModalVisible(false)}
          >
            <Ionicons name="close-circle" size={40} color="#FFF" />
          </TouchableOpacity>
          {selectedGasto && (
            <Image
              source={{ uri: selectedGasto.fotoRecibo }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </View>
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
  listContent: {
    padding: 15,
  },
  gastoCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  gastoInfo: {
    flex: 1,
  },
  descripcion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  monto: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#27AE60',
    marginBottom: 2,
  },
  fecha: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  participantesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantes: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  pagadorContainer: {
    alignItems: 'flex-end',
    marginRight: 10,
  },
  pagadorLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 2,
  },
  pagador: {
    fontSize: 13,
    color: '#4A90E2',
    fontWeight: '600',
    maxWidth: 80,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalContent: {
    flex: 1,
  },
  reciboImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#F0F0F0',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageOverlayText: {
    color: '#FFF',
    marginLeft: 5,
    fontSize: 12,
  },
  detalleSection: {
    padding: 20,
  },
  detalleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  detalleContent: {
    flex: 1,
    marginLeft: 15,
  },
  detalleLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  detalleValue: {
    fontSize: 16,
    color: '#333',
  },
  detalleValueBold: {
    fontSize: 18,
    color: '#333',
    fontWeight: 'bold',
  },
  imageModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeImageButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 1,
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
});