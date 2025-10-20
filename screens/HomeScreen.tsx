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
  FlatList,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { agregarGasto, obtenerGastos } from '../storage/storage';
import { Gasto } from '../types';
import { Ionicons } from '@expo/vector-icons';
import Layout from '../components/Layout';

export default function HomeScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');
  const [pagadoPor, setPagadoPor] = useState('');
  const [participantesInput, setParticipantesInput] = useState('');
  const [fotoRecibo, setFotoRecibo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      Alert.alert('Error', 'Ingresa quién pagó');
      return false;
    }
    if (!participantesInput.trim()) {
      Alert.alert('Error', 'Ingresa los participantes');
      return false;
    }
    if (!fotoRecibo) {
      Alert.alert('Error', 'Debes adjuntar una foto del recibo');
      return false;
    }
    return true;
  };

  const solicitarPermisoCamara = async (): Promise<boolean> => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permiso Denegado',
          'Necesitamos acceso a la cámara para tomar fotos de los recibos'
        );
        return false;
      }
    }
    return true;
  };

  const solicitarPermisoGaleria = async (): Promise<boolean> => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permiso Denegado',
          'Necesitamos acceso a la galería para seleccionar fotos de los recibos'
        );
        return false;
      }
    }
    return true;
  };

  const tomarFoto = async () => {
    const tienePermiso = await solicitarPermisoCamara();
    if (!tienePermiso) return;

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
      console.error('Error al tomar foto:', error);
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  const seleccionarFoto = async () => {
    const tienePermiso = await solicitarPermisoGaleria();
    if (!tienePermiso) return;

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
      console.error('Error al seleccionar foto:', error);
      Alert.alert('Error', 'No se pudo seleccionar la foto');
    }
  };

  const mostrarOpcionesFoto = () => {
    Alert.alert(
      'Foto del Recibo',
      'Elige una opción',
      [
        { text: 'Tomar Foto', onPress: tomarFoto },
        { text: 'Seleccionar de Galería', onPress: seleccionarFoto },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const guardarGasto = async () => {
    if (!validarFormulario()) return;

    setLoading(true);
    try {
      const participantes = participantesInput
        .split(',')
        .map(p => p.trim())
        .filter(p => p.length > 0);

      const nuevoGasto: Gasto = {
        id: Date.now().toString(),
        descripcion: descripcion.trim(),
        monto: parseFloat(monto),
        pagadoPor: pagadoPor.trim(),
        participantes,
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
    setParticipantesInput('');
    setFotoRecibo(null);
  };

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

  const renderGasto = ({ item }: { item: Gasto }) => (
    <View style={styles.gastoCard}>
      <Image source={{ uri: item.fotoRecibo }} style={styles.gastoThumbnail} />
      <View style={styles.gastoInfo}>
        <Text style={styles.gastoDescripcion} numberOfLines={1}>
          {item.descripcion}
        </Text>
        <Text style={styles.gastoMonto}>{formatearMoneda(item.monto)}</Text>
        <View style={styles.gastoMeta}>
          <Ionicons name="person" size={12} color="#6C63FF" />
          <Text style={styles.gastoMetaText}>{item.pagadoPor}</Text>
          <Ionicons name="time-outline" size={12} color="#999" style={{ marginLeft: 8 }} />
          <Text style={styles.gastoMetaText}>{formatearFecha(item.fecha)}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <Layout backgroundColor="#6C63FF">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>💰 Mis Gastos</Text>
          <Text style={styles.headerSubtitle}>
            {gastos.length} gasto{gastos.length !== 1 ? 's' : ''} registrado{gastos.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {gastos.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={80} color="#B8B3FF" />
            <Text style={styles.emptyText}>No hay gastos registrados</Text>
            <Text style={styles.emptySubtext}>
              Comienza agregando tu primer gasto
            </Text>
          </View>
        ) : (
          <FlatList
            data={gastos}
            renderItem={renderGasto}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={32} color="#FFF" />
        </TouchableOpacity>

        <Modal
          animationType="slide"
          transparent={false}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <Layout backgroundColor="#FFF">
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={28} color="#6C63FF" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Nuevo Gasto</Text>
                <View style={{ width: 28 }} />
              </View>

              <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.label}>Descripción *</Text>
                <TextInput
                  style={styles.input}
                  value={descripcion}
                  onChangeText={setDescripcion}
                  placeholder="Ej: Cena en restaurante"
                  placeholderTextColor="#999"
                />

                <Text style={styles.label}>Monto ($) *</Text>
                <TextInput
                  style={styles.input}
                  value={monto}
                  onChangeText={setMonto}
                  placeholder="0.00"
                  placeholderTextColor="#999"
                  keyboardType="decimal-pad"
                />

                <Text style={styles.label}>Pagado por *</Text>
                <TextInput
                  style={styles.input}
                  value={pagadoPor}
                  onChangeText={setPagadoPor}
                  placeholder="Nombre de quien pagó"
                  placeholderTextColor="#999"
                />

                <Text style={styles.label}>Participantes * (separados por coma)</Text>
                <TextInput
                  style={[styles.input, styles.inputMultiline]}
                  value={participantesInput}
                  onChangeText={setParticipantesInput}
                  placeholder="Ej: Juan, María, Pedro"
                  placeholderTextColor="#999"
                  multiline
                />

                <Text style={styles.label}>Foto del Recibo *</Text>
                <TouchableOpacity
                  style={styles.photoButton}
                  onPress={mostrarOpcionesFoto}
                >
                  {fotoRecibo ? (
                    <Image source={{ uri: fotoRecibo }} style={styles.photoPreview} />
                  ) : (
                    <View style={styles.photoPlaceholder}>
                      <Ionicons name="camera" size={40} color="#6C63FF" />
                      <Text style={styles.photoPlaceholderText}>
                        Toca para agregar foto
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                  onPress={guardarGasto}
                  disabled={loading}
                >
                  <Text style={styles.saveButtonText}>
                    {loading ? 'Guardando...' : 'Guardar Gasto'}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </Layout>
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
    backgroundColor: '#6C63FF',
    padding: 20,
    paddingBottom: 25,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#E8E6FF',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 20,
    color: '#FFF',
    marginTop: 20,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 16,
    color: '#E8E6FF',
    marginTop: 10,
    textAlign: 'center',
  },
  listContent: {
    padding: 15,
    paddingBottom: 100,
  },
  gastoCard: {
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
  gastoThumbnail: {
    width: 70,
    height: 70,
    borderRadius: 12,
    marginRight: 12,
  },
  gastoInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  gastoDescripcion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  gastoMonto: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6C63FF',
    marginBottom: 4,
  },
  gastoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gastoMetaText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF6B9D',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#6C63FF',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    borderWidth: 2,
    borderColor: '#E8E6FF',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#FFF',
    color: '#333',
  },
  inputMultiline: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  photoButton: {
    marginTop: 10,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  photoPreview: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
    borderRadius: 12,
  },
  photoPlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#F8F7FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E8E6FF',
    borderStyle: 'dashed',
    borderRadius: 12,
  },
  photoPlaceholderText: {
    marginTop: 10,
    color: '#6C63FF',
    fontSize: 14,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#6C63FF',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
    elevation: 3,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  saveButtonDisabled: {
    backgroundColor: '#B8B3FF',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
});