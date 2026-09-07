export type Rol = 'SUPERADMIN' | 'ADMIN' | 'TRABAJADORA';
export type EstadoCita = 'CONFIRMADA' | 'FINALIZADA' | 'CANCELADA' | 'NO_ASISTIO';
export type TipoExcepcion = 'AUSENCIA' | 'BLOQUEO' | 'CAMBIO_HORARIO';

export interface Sesion {
  token: string;
  nombre: string;
  rol: Rol;
  empresaId: number | null;
  profesionalId: number | null;
}

export interface Profesional {
  id: number;
  nombre: string;
  telefono?: string;
  color?: string;
  activo: boolean;
}

export interface Servicio {
  id: number;
  nombre: string;
  precioCentavos: number;
  duracionMin: number;
  activo: boolean;
}

export interface ServicioProfesional {
  id?: number;
  servicioId: number;
  profesionalId: number;
  /** Nulo significa que se demora lo normal del servicio. */
  duracionMin: number | null;
}

export interface HorarioBase {
  id?: number;
  profesionalId: number;
  diaSemana: number;      // 1 = lunes
  horaInicio: string;     // "09:00"
  horaFin: string;
}

export interface ExcepcionHorario {
  id?: number;
  profesionalId: number;
  fecha: string;
  tipo: TipoExcepcion;
  horaInicio?: string | null;
  horaFin?: string | null;
  motivo?: string;
}

export interface Cita {
  id: number;
  profesionalId: number;
  servicioId: number;
  inicio: string;
  fin: string;
  estado: EstadoCita;
  origen: 'PANEL' | 'WHATSAPP' | 'WEB';
  /** Vienen resueltos del backend, no hay que buscarlos aparte. */
  clienteNombre?: string;
  clienteTelefono?: string;
  notas?: string;
}

export interface Cupo {
  profesionalId: number;
  profesionalNombre: string;
  inicio: string;
  fin: string;
  duracionMin: number;
}

export interface Empresa {
  id: number;
  nombre: string;
  slug: string;
  telefonoWa?: string;
  plan: string;
  maxProfesionales: number;
  activa: boolean;
  profesionalesUsados: number;
}
