export interface Gasto {
  id: string;
  descripcion: string;
  monto: number;
  pagadoPor: string;
  participantes: string[];
  fotoRecibo: string; // URI de la imagen
  fecha: string;
}

export interface Balance {
  persona: string;
  debe: { [persona: string]: number };
  lesDeben: { [persona: string]: number };
  total: number; // negativo si debe, positivo si le deben
}

export interface Deuda {
  deudor: string;
  acreedor: string;
  monto: number;
}

export type RootTabParamList = {
  Inicio: undefined;
  Balance: undefined;
  Recibos: undefined;
  Reporte: undefined;
};