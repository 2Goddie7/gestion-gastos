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
import Layout from '../components/Layout';

const PRIMARY_COLOR = '#EA580C';
const BACKGROUND_COLOR = '#F8FAFC';

export default function ReciboScreen() {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [selectedGasto, setSelectedGasto] = useState<Gasto | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const cargarGastos = async () => {
    try {
      const gastosObtenidos = await obtenerGastos();
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
      day: 'numeric',
      month: 'short',
    });
  };

  const formatearMoneda = (valor: number): string => {
    return `$${valor.toFixed(0)}`;
  };

  const renderGasto = ({ item }: { item: Gasto }) => (
    <TouchableOpacity
      style={styles.reciboCard}
      onPress={() => verDetalle(item)}
      activeOpacity={0.7}
    >
      <Image source={{ uri: item.fotoRecibo }} style={styles.reciboImage} />
      <TouchableOpacity style={styles.zoomIcon}>
        <Ionicons name="search" size={20} color="#FFF" />
      </TouchableOpacity>
      <View style={styles.reciboInfo}>
        <Text style={styles.reciboNombre}>{item.descripcion}</Text>
        <View style={styles.reciboFooter}>
          <Text style={styles.reciboFecha}>{formatearFecha(item.fecha)}</Text>
          <Text style={styles.reciboMonto}>{formatearMoneda(item.monto)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (gastos.length === 0) {
    return (
      <Layout backgroundColor={BACKGROUND_COLOR} headerColor={PRIMARY_COLOR}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Galería de Recibos</Text>
            <Text style={styles.headerSubtitle}>0 recibos registrados</Text>
          </View>
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={80} color="#CBD5E1" />
            <Text style={styles.emptyText}>No hay recibos registrados</Text>
            <Text style={styles.emptySubtext}>Los gastos que registres aparecerán aquí</Text>
          </View>
        </View>
      </Layout>
    );
  }

  return (
    <Layout backgroundColor={BACKGROUND_COLOR} headerColor={PRIMARY_COLOR}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Galería de Recibos</Text>
          <Text style={styles.headerSubtitle}>{gastos.length} recibos registrados</Text>
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="camera" size={20} color={PRIMARY_COLOR} />
          <Text style={styles.infoText}>
            Recibos Verificados
          </Text>
        </View>
        <Text style={styles.infoSubtext}>
          Todos los gastos incluyen foto del recibo para mayor control
        </Text>

        <FlatList
          data={gastos}
          renderItem={renderGasto}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[PRIMARY_COLOR]} />
          }
        />

        <View style={styles.footer}>
          <Text style={styles.footerNumber}>{gastos.length}</Text>
          <Text style={styles.footerLabel}>Total Recibos</Text>
        </View>

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
                  <Ionicons name="close" size={28} color="#64748B" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Detalle del Gasto</Text>
                <TouchableOpacity onPress={confirmarEliminar}>
                  <Ionicons name="trash-outline" size={28} color="#DC2626" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalContent}>
                <TouchableOpacity
                  onPress={verImagenCompleta}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{ uri: selectedGasto.fotoRecibo }}
                    style={styles.reciboImageLarge}
                  />
                  <View style={styles.imageOverlay}>
                    <Ionicons name="expand" size={24} color="#FFF" />
                    <Text style={styles.imageOverlayText}>Toca para ampliar</Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.detalleSection}>
                  <View style={styles.detalleRow}>
                    <Ionicons name="document-text" size={24} color={PRIMARY_COLOR} />
                    <View style={styles.detalleContent}>
                      <Text style={styles.detalleLabel}>Descripción</Text>
                      <Text style={styles.detalleValue}>{selectedGasto.descripcion}</Text>
                    </View>
                  </View>

                  <View style={styles.detalleRow}>
                    <Ionicons name="cash" size={24} color="#10B981" />
                    <View style={styles.detalleContent}>
                      <Text style={styles.detalleLabel}>Monto Total</Text>
                      <Text style={styles.detalleValueBold}>
                        {formatearMoneda(selectedGasto.monto)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detalleRow}>
                    <Ionicons name="person" size={24} color="#8B5CF6" />
                    <View style={styles.detalleContent}>
                      <Text style={styles.detalleLabel}>Pagado por</Text>
                      <Text style={styles.detalleValue}>{selectedGasto.pagadoPor}</Text>
                    </View>
                  </View>

                  <View style={styles.detalleRow}>
                    <Ionicons name="people" size={24} color="#F59E0B" />
                    <View style={styles.detalleContent}>
                      <Text style={styles.detalleLabel}>Participantes</Text>
                      <Text style={styles.detalleValue}>
                        {selectedGasto.participantes.join(', ')}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detalleRow}>
                    <Ionicons name="calculator" size={24} color="#64748B" />
                    <View style={styles.detalleContent}>
                      <Text style={styles.detalleLabel}>Costo por persona</Text>
                      <Text style={styles.detalleValueBold}>
                        {formatearMoneda(selectedGasto.monto / selectedGasto.participantes.length)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detalleRow}>
                    <Ionicons name="calendar" size={24} color="#94A3B8" />
                    <View style={styles.detalleContent}>
                      <Text style={styles.detalleLabel}>Fecha</Text>
                      <Text style={styles.detalleValue}>
                        {new Date(selectedGasto.fecha).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  </View>
                </View>
              </ScrollView>
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
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  infoText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  infoSubtext: {
    fontSize: 13,
    color: '#64748B',
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 16,
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
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  reciboCard: {
    width: '48%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  reciboImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#F1F5F9',
  },
  zoomIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reciboInfo: {
    padding: 12,
  },
  reciboNombre: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  reciboFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reciboFecha: {
    fontSize: 12,
    color: '#64748B',
  },
  reciboMonto: {
    fontSize: 16,
    fontWeight: '700',
    color: PRIMARY_COLOR,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    padding: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  footerNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1E293B',
  },
  footerLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  modalContent: {
    flex: 1,
  },
  reciboImageLarge: {
    width: '100%',
    height: 300,
    backgroundColor: '#F1F5F9',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  imageOverlayText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  detalleSection: {
    padding: 20,
  },
  detalleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  detalleContent: {
    flex: 1,
    marginLeft: 16,
  },
  detalleLabel: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 4,
  },
  detalleValue: {
    fontSize: 16,
    color: '#1E293B',
  },
  detalleValueBold: {
    fontSize: 18,
    color: '#1E293B',
    fontWeight: '700',
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