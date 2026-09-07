import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { entorno } from '../../environments/environment';
import {
  Cita, Cupo, Empresa, EstadoCita, ExcepcionHorario, HorarioBase,
  Profesional, Servicio, ServicioProfesional, TipoExcepcion
} from './modelos';

@Injectable({ providedIn: 'root' })
export class ApiService {

  constructor(private http: HttpClient) {}

  private url(ruta: string) { return `${entorno.api}${ruta}`; }

  // ---------------- Agenda ----------------

  citasDelDia(fecha: string, profesionalId?: number) {
    let params = new HttpParams().set('fecha', fecha);
    if (profesionalId) params = params.set('profesionalId', profesionalId);
    return this.http.get<Cita[]>(this.url('/citas'), { params });
  }

  cupos(servicioId: number, fecha: string, profesionalId?: number) {
    let params = new HttpParams().set('servicioId', servicioId).set('fecha', fecha);
    if (profesionalId) params = params.set('profesionalId', profesionalId);
    return this.http.get<Cupo[]>(this.url('/disponibilidad'), { params });
  }

  crearCita(cuerpo: {
    servicioId: number; profesionalId: number; inicio: string;
    nombreCliente?: string; telefonoCliente?: string; notas?: string;
  }) {
    return this.http.post<Cita>(this.url('/citas'), cuerpo);
  }

  reprogramar(citaId: number, profesionalId: number, inicio: string) {
    return this.http.patch<Cita>(this.url(`/citas/${citaId}/reprogramar`),
      { profesionalId, inicio });
  }

  cambiarEstado(citaId: number, valor: EstadoCita) {
    return this.http.patch<void>(this.url(`/citas/${citaId}/estado`), {},
      { params: new HttpParams().set('valor', valor) });
  }

  // ---------------- Catálogo ----------------

  profesionales(soloActivos = true) {
    return this.http.get<Profesional[]>(this.url('/profesionales'),
      { params: new HttpParams().set('soloActivos', soloActivos) });
  }

  crearProfesional(cuerpo: { nombre: string; telefono?: string; color?: string }) {
    return this.http.post<Profesional>(this.url('/profesionales'), cuerpo);
  }

  actualizarProfesional(id: number, cuerpo: Partial<Profesional>) {
    return this.http.put<Profesional>(this.url(`/profesionales/${id}`), cuerpo);
  }

  citasPendientesDe(id: number) {
    return this.http.get<number>(this.url(`/profesionales/${id}/citas-pendientes`));
  }

  retirarProfesional(id: number, forzar = false) {
    return this.http.delete<void>(this.url(`/profesionales/${id}`),
      { params: new HttpParams().set('forzar', forzar) });
  }

  servicios(soloActivos = true) {
    return this.http.get<Servicio[]>(this.url('/servicios'),
      { params: new HttpParams().set('soloActivos', soloActivos) });
  }

  crearServicio(cuerpo: { nombre: string; precioCentavos?: number; duracionMin?: number }) {
    return this.http.post<Servicio>(this.url('/servicios'), cuerpo);
  }

  serviciosDe(profesionalId: number) {
    return this.http.get<ServicioProfesional[]>(
      this.url(`/profesionales/${profesionalId}/servicios`));
  }

  /** Define de una vez qué hace la profesional y dónde se demora distinto. */
  definirServiciosDe(profesionalId: number,
                     lista: { servicioId: number; duracionMin: number | null }[]) {
    return this.http.put<ServicioProfesional[]>(
      this.url(`/profesionales/${profesionalId}/servicios`), lista);
  }

  // ---------------- Horarios ----------------

  horariosDe(profesionalId: number) {
    return this.http.get<HorarioBase[]>(this.url(`/profesionales/${profesionalId}/horarios`));
  }

  guardarHorarios(profesionalId: number,
                  tramos: { diaSemana: number; horaInicio: string; horaFin: string }[]) {
    return this.http.put<HorarioBase[]>(
      this.url(`/profesionales/${profesionalId}/horarios`), tramos);
  }

  excepcionesDe(profesionalId: number, desde: string, hasta: string) {
    return this.http.get<ExcepcionHorario[]>(
      this.url(`/profesionales/${profesionalId}/excepciones`),
      { params: new HttpParams().set('desde', desde).set('hasta', hasta) });
  }

  /** Sellar la agenda: permiso, ausencia o cambio de horario de un día. */
  sellar(profesionalId: number, cuerpo: {
    fecha: string; tipo: TipoExcepcion;
    horaInicio?: string | null; horaFin?: string | null; motivo?: string;
  }) {
    return this.http.post<ExcepcionHorario>(
      this.url(`/profesionales/${profesionalId}/excepciones`), cuerpo);
  }

  // ---------------- Reasignación ----------------

  revisarReasignacion(profesionalId: number, fecha: string) {
    return this.http.get<any[]>(this.url('/reasignacion'),
      { params: new HttpParams().set('profesionalId', profesionalId).set('fecha', fecha) });
  }

  reasignar(citaId: number, profesionalId: number, inicio: string) {
    return this.http.post<Cita>(this.url(`/reasignacion/${citaId}`), { profesionalId, inicio });
  }

  // ---------------- Acceso de las personas ----------------

  verAcceso(profesionalId: number) {
    return this.http.get<{ tiene: boolean; documento?: string }>(
      this.url(`/usuarios/profesionales/${profesionalId}/acceso`));
  }

  /** Le crea (o le renueva) el acceso a una manicurista: cédula y contraseña. */
  crearAcceso(profesionalId: number, documento: string, clave: string) {
    return this.http.post<{ mensaje: string }>(
      this.url(`/usuarios/profesionales/${profesionalId}/acceso`), { documento, clave });
  }

  cambiarMiClave(actual: string, nueva: string) {
    return this.http.post<{ mensaje: string }>(this.url('/usuarios/mi-clave'), { actual, nueva });
  }

  // ---------------- Superadministrador ----------------

  empresas() {
    return this.http.get<Empresa[]>(this.url('/superadmin/empresas'));
  }

  crearEmpresa(cuerpo: {
    nombre: string; slug: string; telefonoWa?: string; plan: string;
    maxProfesionales: number; emailAdmin: string; nombreAdmin: string; claveAdmin: string;
  }) {
    return this.http.post<Empresa>(this.url('/superadmin/empresas'), cuerpo);
  }

  cambiarPlan(id: number, plan: string, maxProfesionales: number) {
    return this.http.patch<Empresa>(this.url(`/superadmin/empresas/${id}/plan`),
      { plan, maxProfesionales });
  }
}
