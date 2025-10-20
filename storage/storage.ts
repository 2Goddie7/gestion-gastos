import AsyncStorage from '@react-native-async-storage/async-storage';
import { Gasto } from '../types';

const GASTOS_KEY = '@gastos_compartidos';

export const guardarGastos = async (gastos: Gasto[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(GASTOS_KEY, JSON.stringify(gastos));
  } catch (error) {
    console.error('Error al guardar gastos:', error);
    throw error;
  }
};

export const obtenerGastos = async (): Promise<Gasto[]> => {
  try {
    const gastosString = await AsyncStorage.getItem(GASTOS_KEY);
    return gastosString ? JSON.parse(gastosString) : [];
  } catch (error) {
    console.error('Error al obtener gastos:', error);
    return [];
  }
};

export const agregarGasto = async (gasto: Gasto): Promise<void> => {
  try {
    const gastos = await obtenerGastos();
    gastos.push(gasto);
    await guardarGastos(gastos);
  } catch (error) {
    console.error('Error al agregar gasto:', error);
    throw error;
  }
};

export const eliminarGasto = async (id: string): Promise<void> => {
  try {
    const gastos = await obtenerGastos();
    const gastosActualizados = gastos.filter(g => g.id !== id);
    await guardarGastos(gastosActualizados);
  } catch (error) {
    console.error('Error al eliminar gasto:', error);
    throw error;
  }
};

export const limpiarGastos = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(GASTOS_KEY);
  } catch (error) {
    console.error('Error al limpiar gastos:', error);
    throw error;
  }
};