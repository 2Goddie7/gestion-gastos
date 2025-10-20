import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { agregarGasto, obtenerGastos } from '../storage/storage';
import { Gasto } from '../types';
import { Ionicons } from '@expo/vector-icons';
import Layout from '../components/Layout';

const PRIMARY_COLOR = '#2563EB';
const BACKGROUND_COLOR = '#F8FAFC';

export default function HomeScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');
  const [pagadoPor, setPagadoPor] = useState('');
  const [participantesSeleccionados, setParticipantesSeleccionados] = useState<string[]>([]);
  const [fotoRecibo, setFotoRecibo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Lista de participantes predefinidos
  const participantesDisponibles = ['Juan', 'María', 'Pedro'];

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

  const calcularTotalMes = () => {
    const ahora = new Date();
    const mesActual = ahora.getMonth();
    const añoActual = ahora.getFullYear();
    
    return gastos
      .filter(gasto => {
        const fechaGasto = new Date(gasto.fecha);
        return fechaGasto.getMonth() === mesActual && fechaGasto.getFullYear() === añoActual;
      })
      .reduce((sum, g) => sum + g.monto, 0);
  };

  const toggleParticipante = (nombre: string) => {
    if (participantesSeleccionados.includes(nombre)) {
      setParticipantesSeleccionados(participantesSeleccionados.filter(p => p !== nombre));
    } else {
      setParticipantesSeleccionados([...participantesSeleccionados, nombre]);
    }
  };

  const validarFormulario = (): boolean => {
    if (!descripcion.trim()) {
      Alert.alert('Error', 'Ingresa una descripción');
      return false;
    }
    if (!monto || parseFloat(monto) <= 0) {
      Alert.alert('Error', 'Ingresa un monto válido');
      return false;
    }
    if (!pagadoPor.trim()) {
      Alert.alert('Error', 'Selecciona quién pagó');
      return false;
    }
    if (participantesSeleccionados.length === 0) {
      Alert.alert('Error', 'Selecciona al menos un participante');
      return false;
    }
    if (!fotoRecibo) {
      Alert.alert('Error', 'Debes adjuntar una foto del recibo');
      return false;
    }
    return true;
  };

  const tomarFoto = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso Denegado', 'Necesitamos acceso a la cámara');
        return;
      }
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setFotoRecibo(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  const seleccionarFoto = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso Denegado', 'Necesitamos acceso a la galería');
        return;
      }
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setFotoRecibo(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar la foto');
    }
  };

  const guardarGasto = async () => {
    if (!validarFormulario()) return;

    setLoading(true);
    try {
      const nuevoGasto: Gasto = {
        id: Date.now().toString(),
        descripcion: descripcion.trim(),
        monto: parseFloat(monto),
        pagadoPor: pagadoPor.trim(),
        participantes: participantesSeleccionados,
        fotoRecibo: fotoRecibo!,
        fecha: new Date().toISOString(),
      };

      await agregarGasto(nuevoGasto);
      
      Alert.alert('Éxito', 'Gasto registrado correctamente');
      limpiarFormulario();
      setModalVisible(false);
      await cargarGastos();
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar el gasto');
    } finally {
      setLoading(false);
    }
  };

  const limpiarFormulario = () => {
    setDescripcion('');
    setMonto('');
    setPagadoPor('');
    setParticipantesSeleccionados([]);
    setFotoRecibo(null);
  };

  const formatearMoneda = (valor: number): string => {
    return `$${valor.toFixed(2)}`;
  };

  const formatearFecha = (fecha: string): string => {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
    });
  };

  const obtenerMesActual = () => {
    return new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  };

  return (
    <Layout backgroundColor={BACKGROUND_COLOR} headerColor={PRIMARY_COLOR}>
      <View style={styles.container}>
        {/* Header con Total */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Gastos Compartidos</Text>
          <View style={styles.totalCard}>
            <View style={styles.totalCardHeader}>
              <Text style={styles.totalLabel}>Total gastado</Text>
              <Ionicons name="people" size={20} color="rgba(255,255,255,0.9)" />
            </View>
            <Text style={styles.totalAmount}>{formatearMoneda(calcularTotalMes())}</Text>
            <Text style={styles.totalMonth}>{obtenerMesActual()}</Text>
          </View>
        </View>

        {/* Lista de Gastos */}
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Gastos</Text>
          
          <ScrollView 
            style={styles.gastosList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.gastosListContent}
          >
            {gastos.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="receipt-outline" size={60} color="#CBD5E1" />
                <Text style={styles.emptyText}>No hay gastos registrados</Text>
              </View>
            ) : (
              gastos.map((gasto) => (
                <View key={gasto.id} style={styles.gastoCard}>
                  <View style={styles.gastoInfo}>
                    <View style={styles.gastoHeader}>
                      <Text style={styles.gastoDescripcion}>{gasto.descripcion}</Text>
                      <Text style={styles.gastoMonto}>{formatearMoneda(gasto.monto)}</Text>
                    </View>
                    <View style={styles.gastoMeta}>
                      <Text style={styles.gastoPagador}>Pagado por {gasto.pagadoPor}</Text>
                      <Text style={styles.gastoFecha}>{formatearFecha(gasto.fecha)}</Text>
                    </View>
                    <View style={styles.participantesBadges}>
                      {gasto.participantes.map((p, idx) => (
                        <View key={idx} style={styles.participanteBadge}>
                          <Text style={styles.participanteInicial}>{p.charAt(0)}</Text>
                        </View>
                      ))}
                      <View style={styles.verificadoBadge}>
                        <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                        <Text style={styles.verificadoText}>Recibo verificado</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>

        {/* Botón Flotante */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={28} color="#FFF" />
        </TouchableOpacity>

        {/* Modal Nuevo Gasto */}
        <Modal
          animationType="slide"
          transparent={false}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nuevo Gasto</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Descripción</Text>
              <TextInput
                style={styles.input}
                value={descripcion}
                onChangeText={setDescripcion}
                placeholder="Ej: Cena con amigos"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.label}>Monto</Text>
              <View style={styles.montoInputContainer}>
                <Text style={styles.montoPrefix}>$</Text>
                <TextInput
                  style={styles.montoInput}
                  value={monto}
                  onChangeText={setMonto}
                  placeholder="0.00"
                  placeholderTextColor="#94A3B8"
                  keyboardType="decimal-pad"
                />
              </View>

              <Text style={styles.label}>¿Quién pagó?</Text>
              <View style={styles.pagadorSelector}>
                {participantesDisponibles.map((nombre) => (
                  <TouchableOpacity
                    key={nombre}
                    style={[
                      styles.pagadorOption,
                      pagadoPor === nombre && styles.pagadorOptionSelected
                    ]}
                    onPress={() => setPagadoPor(nombre)}
                  >
                    <Text style={[
                      styles.pagadorOptionText,
                      pagadoPor === nombre && styles.pagadorOptionTextSelected
                    ]}>
                      {nombre}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Participantes</Text>
              <View style={styles.participantesSelector}>
                {participantesDisponibles.map((nombre) => (
                  <TouchableOpacity
                    key={nombre}
                    style={[
                      styles.participanteChip,
                      participantesSeleccionados.includes(nombre) && styles.participanteChipSelected
                    ]}
                    onPress={() => toggleParticipante(nombre)}
                  >
                    <Text style={[
                      styles.participanteChipText,
                      participantesSeleccionados.includes(nombre) && styles.participanteChipTextSelected
                    ]}>
                      {nombre}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.fotoSection}>
                <View style={styles.fotoHeader}>
                  <Text style={styles.label}>Foto del Recibo</Text>
                  <View style={styles.obligatorioBadge}>
                    <Text style={styles.obligatorioText}>* Obligatorio</Text>
                  </View>
                </View>

                {fotoRecibo ? (
                  <TouchableOpacity onPress={() => Alert.alert(
                    'Foto del Recibo',
                    'Elige una opción',
                    [
                      { text: 'Tomar nueva foto', onPress: tomarFoto },
                      { text: 'Seleccionar de galería', onPress: seleccionarFoto },
                      { text: 'Cancelar', style: 'cancel' },
                    ]
                  )}>
                    <Image source={{ uri: fotoRecibo }} style={styles.photoPreview} />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.photoPlaceholder}
                    onPress={() => Alert.alert(
                      'Foto del Recibo',
                      'Elige una opción',
                      [
                        { text: 'Tomar Foto', onPress: tomarFoto },
                        { text: 'Seleccionar de Galería', onPress: seleccionarFoto },
                        { text: 'Cancelar', style: 'cancel' },
                      ]
                    )}
                  >
                    <Ionicons name="camera-outline" size={48} color="#94A3B8" />
                    <Text style={styles.photoPlaceholderTitle}>Tomar Foto del Recibo</Text>
                    <Text style={styles.photoPlaceholderSubtitle}>Es necesario para registrar el gasto</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                onPress={guardarGasto}
                disabled={loading}
              >
                <Ionicons name="camera" size={20} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.saveButtonText}>
                  {loading ? 'Guardando...' : 'Guardar Gasto con Recibo'}
                </Text>
              </TouchableOpacity>

              <View style={styles.modalFooter}>
                <Ionicons name="information-circle-outline" size={16} color="#64748B" />
                <Text style={styles.modalFooterText}>
                  Todos los gastos deben incluir foto del recibo
                </Text>
              </View>
            </ScrollView>
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
    paddingBottom: 30,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 16,
  },
  totalCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 20,
    backdropFilter: 'blur(10px)',
  },
  totalCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  totalAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  totalMonth: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'capitalize',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  gastosList: {
    flex: 1,
  },
  gastosListContent: {
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#94A3B8',
    marginTop: 16,
  },
  gastoCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  gastoInfo: {
    flex: 1,
  },
  gastoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  gastoDescripcion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  gastoMonto: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginLeft: 12,
  },
  gastoMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  gastoPagador: {
    fontSize: 13,
    color: '#64748B',
  },
  gastoFecha: {
    fontSize: 13,
    color: '#94A3B8',
  },
  participantesBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  participanteBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: PRIMARY_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
  },
  participanteInicial: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  verificadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 8,
  },
  verificadoText: {
    fontSize: 12,
    color: '#10B981',
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: PRIMARY_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  montoInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingLeft: 16,
  },
  montoPrefix: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748B',
    marginRight: 8,
  },
  montoInput: {
    flex: 1,
    padding: 16,
    paddingLeft: 0,
    fontSize: 16,
    color: '#1E293B',
  },
  pagadorSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  pagadorOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  pagadorOptionSelected: {
    backgroundColor: PRIMARY_COLOR,
    borderColor: PRIMARY_COLOR,
  },
  pagadorOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  pagadorOptionTextSelected: {
    color: '#FFF',
  },
  participantesSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  participanteChip: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#DBEAFE',
    borderWidth: 2,
    borderColor: '#DBEAFE',
  },
  participanteChipSelected: {
    backgroundColor: '#BFDBFE',
    borderColor: PRIMARY_COLOR,
  },
  participanteChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: PRIMARY_COLOR,
  },
  participanteChipTextSelected: {
    color: PRIMARY_COLOR,
  },
  fotoSection: {
    marginTop: 8,
  },
  fotoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  obligatorioBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  obligatorioText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#DC2626',
  },
  photoPlaceholder: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  photoPlaceholderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
    marginTop: 12,
  },
  photoPlaceholderSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  saveButton: {
    backgroundColor: PRIMARY_COLOR,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 12,
    marginTop: 32,
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 24,
    marginBottom: 40,
  },
  modalFooterText: {
    fontSize: 12,
    color: '#64748B',
  },
});