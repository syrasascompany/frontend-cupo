import { Component, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { forkJoin } from "rxjs";
import { ApiService } from "../core/api.service";
import { HorarioBase, Profesional, Servicio } from "../core/modelos";

interface FilaServicio {
  servicioId: number;
  nombre: string;
  normal: number;
  hace: boolean;
  /** Vacío significa que se demora lo normal. */
  ajuste: number | null;
}

interface FilaDia {
  diaSemana: number;
  nombre: string;
  trabaja: boolean;
  horaInicio: string;
  horaFin: string;
}

const DIAS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

@Component({
  selector: "cupo-equipo",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="cabezote">
      <h1>Mis manicuristas</h1>
      <button class="boton b-fucsia" (click)="abrirNueva()">＋ Agregar</button>
    </div>

    @if (error()) {
      <div class="error">{{ error() }}</div>
    }
    @if (aviso()) {
      <div class="ok">{{ aviso() }}</div>
    }

    <div class="dos-columnas">
      <div class="tarjeta">
        <div class="lista-tapa">
          <b>Equipo</b>
          <span>{{ profesionales().length }} activas</span>
        </div>
        @for (p of profesionales(); track p.id) {
          <button
            class="persona"
            [class.elegida]="elegida()?.id === p.id"
            (click)="elegir(p)"
          >
            <span class="avatar" [style.background]="p.color || '#FF1F6D'">
              {{ p.nombre.slice(0, 2).toUpperCase() }}
            </span>
            <span class="datos">
              <b>{{ p.nombre }}</b>
              <span>{{ p.telefono || "Sin teléfono" }}</span>
            </span>
          </button>
        }
        @if (profesionales().length === 0 && !cargando()) {
          <p class="vacio-chico">Todavía no hay nadie cargado.</p>
        }
      </div>

      <div class="tarjeta">
        @if (creando()) {
          <div class="editor">
            <h2>Nueva manicurista</h2>
            <div class="campo">
              <label for="n-nombre">Nombre</label>
              <input id="n-nombre" [(ngModel)]="nuevaNombre" />
            </div>
            <div class="campo">
              <label for="n-tel">Teléfono</label>
              <input id="n-tel" [(ngModel)]="nuevaTelefono" inputmode="tel" />
            </div>
            <div class="acciones">
              <button class="boton b-linea" (click)="creando.set(false)">
                Cancelar
              </button>
              <button
                class="boton b-fucsia"
                (click)="crear()"
                [disabled]="guardando()"
              >
                {{ guardando() ? "Creando…" : "Crear" }}
              </button>
            </div>
          </div>
        } @else {
          @if (elegida(); as p) {
            <div class="editor">
              <div class="editor-tapa">
                <span
                  class="avatar grande"
                  [style.background]="p.color || '#FF1F6D'"
                >
                  {{ p.nombre.slice(0, 2).toUpperCase() }}
                </span>
                @if (editandoDatos()) {
                  <div class="datos-edit">
                    <input
                      [(ngModel)]="nombreEdit"
                      placeholder="Nombre"
                      aria-label="Nombre"
                    />
                    <input
                      [(ngModel)]="telefonoEdit"
                      placeholder="Teléfono"
                      inputmode="tel"
                      aria-label="Teléfono"
                    />
                  </div>
                  <button
                    class="boton b-linea b-chico"
                    (click)="editandoDatos.set(false)"
                  >
                    Cancelar
                  </button>
                  <button
                    class="boton b-fucsia b-chico"
                    (click)="guardarDatos(p)"
                    [disabled]="guardando()"
                  >
                    Guardar
                  </button>
                } @else {
                  <div>
                    <h2>{{ p.nombre }}</h2>
                    <span class="tel-prof">{{
                      p.telefono || "Sin teléfono"
                    }}</span>
                  </div>
                  <button
                    class="boton b-linea b-chico"
                    (click)="editarDatos(p)"
                  >
                    Editar datos
                  </button>
                  <button
                    class="boton b-fucsia"
                    (click)="guardarTodo()"
                    [disabled]="guardando()"
                  >
                    {{ guardando() ? "Guardando…" : "Guardar cambios" }}
                  </button>
                }
              </div>

              <section>
                <h3>Qué servicios hace</h3>
                <p class="nota">
                  Marque los que atiende. Escriba un tiempo solo si ella se
                  demora distinto a lo normal; si lo deja vacío, se usa el
                  tiempo del servicio.
                </p>

                @for (f of filas(); track f.servicioId) {
                  <div class="fila-servicio">
                    <input
                      type="checkbox"
                      [(ngModel)]="f.hace"
                      [id]="'sv' + f.servicioId"
                      [attr.aria-label]="f.nombre"
                    />
                    <label class="nombre" [for]="'sv' + f.servicioId">{{
                      f.nombre
                    }}</label>
                    <span class="normal">Normal: {{ f.normal }} min</span>
                    <span class="ajuste">
                      <input
                        type="number"
                        min="5"
                        step="5"
                        [(ngModel)]="f.ajuste"
                        [disabled]="!f.hace"
                        placeholder="—"
                        [attr.aria-label]="'Minutos de ' + f.nombre"
                      />
                      <small>min</small>
                    </span>
                    @if (f.hace && f.ajuste && f.ajuste !== f.normal) {
                      <span class="etiqueta">Tarda distinto</span>
                    }
                  </div>
                }
              </section>

              <section>
                <h3>Horario de la semana</h3>
                <p class="nota">
                  Este es su horario normal. Los permisos de un día puntual se
                  marcan desde la agenda, sin tocar esto.
                </p>

                <div class="semana">
                  @for (d of dias(); track d.diaSemana) {
                    <div class="dia" [class.libre]="!d.trabaja">
                      <label class="dia-tapa">
                        <input type="checkbox" [(ngModel)]="d.trabaja" />
                        <b>{{ d.nombre }}</b>
                      </label>
                      @if (d.trabaja) {
                        <div class="rango">
                          <input
                            type="time"
                            [(ngModel)]="d.horaInicio"
                            aria-label="Desde"
                          />
                          <input
                            type="time"
                            [(ngModel)]="d.horaFin"
                            aria-label="Hasta"
                          />
                        </div>
                      } @else {
                        <span class="descansa">Descansa</span>
                      }
                    </div>
                  }
                </div>
              </section>

              <!--
                La comisión va aparte de "Guardar cambios" a propósito:
                es plata, y confundirla con un cambio de horario sería
                peligroso. Se guarda sola, con su propio botón.
              -->
              <section>
                <h3>Cuánto se le paga</h3>
                <p class="nota">
                  El porcentaje de lo que produce que le queda a ella. En la
                  mayoría de salones es el 50%, pero se ajusta por persona.
                </p>

                <div class="comision">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="5"
                    [(ngModel)]="comisionPct"
                    aria-label="Porcentaje de comisión"
                  />
                  <span class="signo">%</span>
                  <button
                    class="boton b-linea b-chico"
                    (click)="guardarComision(p)"
                    [disabled]="guardando()"
                  >
                    Guardar
                  </button>
                </div>

                <p class="ejemplo">
                  Si esta semana produce $400.000, se le pagan
                  <b>{{
                    (400000 * comisionPct) / 100
                      | currency: "COP" : "symbol-narrow" : "1.0-0"
                  }}</b>
                  y al salón le quedan
                  {{
                    (400000 * (100 - comisionPct)) / 100
                      | currency: "COP" : "symbol-narrow" : "1.0-0"
                  }}.
                </p>
              </section>

              <section>
                <h3>Acceso para {{ p.nombre }}</h3>
                <p class="nota">
                  Con esto ella entra desde su celular y ve solo sus citas del
                  día. No puede cambiar horarios ni ver la agenda de las demás.
                </p>

                @if (acceso().tiene) {
                  <p class="acceso-ok">
                    Ya tiene acceso con la cédula <b>{{ acceso().documento }}</b
                    >. Si la olvidó, póngale una contraseña nueva aquí.
                  </p>
                }

                <div class="dos-campos">
                  <div class="campo">
                    <label for="ced">Cédula</label>
                    <input
                      id="ced"
                      [(ngModel)]="documento"
                      inputmode="numeric"
                      placeholder="1094567890"
                    />
                  </div>
                  <div class="campo">
                    <label for="cla">Contraseña</label>
                    <input
                      id="cla"
                      [(ngModel)]="claveTrabajadora"
                      placeholder="mínimo 8 caracteres"
                    />
                  </div>
                </div>
                <button
                  class="boton b-linea"
                  (click)="guardarAcceso(p)"
                  [disabled]="guardando()"
                >
                  {{
                    acceso().tiene ? "Cambiar su contraseña" : "Crear acceso"
                  }}
                </button>
              </section>

              <section class="peligro">
                <h3>Ya no trabaja aquí</h3>
                <p>
                  Al retirarla deja de aparecer en la agenda y libera un puesto
                  de su plan. Sus citas pasadas y sus clientas quedan en el
                  historial.
                </p>

                @if (pendientes() > 0) {
                  <div class="bloqueo">
                    <b
                      >Tiene {{ pendientes() }} citas agendadas de aquí en
                      adelante.</b
                    >
                    Hay que pasarlas a otra manicurista antes de retirarla, o
                    esas clientas llegan y no hay quien las atienda.
                  </div>
                }
                <button
                  class="boton b-peligro"
                  (click)="retirar(p)"
                  [disabled]="pendientes() > 0"
                >
                  Retirar del equipo
                </button>
              </section>
            </div>
          } @else {
            <div class="vacio">
              Escoja a alguien de la lista para ver y editar sus datos.
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        max-width: 1180px;
        margin-inline: auto;
        padding: 18px 18px 80px;
      }
      .cabezote {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 16px;
      }
      h1 {
        font-size: 26px;
        margin-right: auto;
      }
      .ok {
        background: #e4f4ec;
        color: #0f6b49;
        border-radius: 10px;
        padding: 11px 14px;
        font-size: 14px;
        margin-bottom: 14px;
      }

      .dos-columnas {
        display: grid;
        grid-template-columns: 300px 1fr;
        gap: 16px;
        align-items: start;
      }
      .lista-tapa {
        padding: 13px 16px;
        border-bottom: 1px solid var(--borde);
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .lista-tapa b {
        font-size: 15px;
      }
      .lista-tapa span {
        font-size: 12.5px;
        color: var(--ciruela-3);
        margin-left: auto;
      }

      .persona {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 11px 16px;
        width: 100%;
        border-bottom: 1px solid var(--borde);
        text-align: left;
      }
      .persona:last-child {
        border-bottom: 0;
      }
      .persona:hover {
        background: var(--fondo);
      }
      .persona.elegida {
        background: var(--fucsia-claro);
      }
      .datos b {
        display: block;
        font-size: 14.5px;
      }
      .datos span {
        font-size: 12.5px;
        color: var(--ciruela-3);
      }
      .vacio-chico {
        padding: 22px;
        text-align: center;
        color: var(--ciruela-3);
        font-size: 14px;
      }

      .editor {
        padding: 18px;
      }
      .editor-tapa {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 22px;
      }
      .editor-tapa h2 {
        font-size: 21px;
      }
      .editor-tapa > div:not(.datos-edit) {
        margin-right: auto;
      }
      .avatar.grande {
        width: 42px;
        height: 42px;
        font-size: 15px;
      }
      .tel-prof {
        font-size: 13px;
        color: var(--ciruela-3);
      }
      .datos-edit {
        flex: 1;
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      .datos-edit input {
        flex: 1;
        min-width: 130px;
        padding: 8px 11px;
        border: 1.5px solid var(--borde);
        border-radius: 9px;
        font-size: 14.5px;
      }
      .datos-edit input:focus {
        outline: none;
        border-color: var(--fucsia);
      }
      @media (max-width: 620px) {
        .editor-tapa {
          flex-wrap: wrap;
        }
        .editor-tapa .boton {
          flex: 1;
          justify-content: center;
        }
      }

      section {
        margin-bottom: 26px;
      }
      h3 {
        font-size: 16px;
        margin-bottom: 6px;
      }
      .nota {
        font-size: 13.5px;
        color: var(--ciruela-3);
        margin-bottom: 12px;
        max-width: 62ch;
      }

      .fila-servicio {
        display: flex;
        align-items: center;
        gap: 11px;
        padding: 10px 0;
        border-bottom: 1px solid var(--borde);
        flex-wrap: wrap;
      }
      .fila-servicio:last-child {
        border-bottom: 0;
      }
      .fila-servicio input[type="checkbox"] {
        width: 17px;
        height: 17px;
        accent-color: var(--fucsia);
      }
      .nombre {
        flex: 1;
        font-size: 14.5px;
        min-width: 140px;
      }
      .normal {
        font-size: 12.5px;
        color: var(--ciruela-3);
        white-space: nowrap;
      }
      .ajuste {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .ajuste input {
        width: 66px;
        padding: 6px 8px;
        border: 1.5px solid var(--borde);
        border-radius: 8px;
        font-size: 13.5px;
        text-align: right;
      }
      .ajuste input:disabled {
        background: var(--fondo);
        opacity: 0.6;
      }
      .ajuste small {
        font-size: 12px;
        color: var(--ciruela-3);
      }
      .etiqueta {
        font-size: 11.5px;
        font-weight: 700;
        color: var(--fucsia-hondo);
        background: var(--fucsia-claro);
        padding: 3px 8px;
        border-radius: 6px;
      }

      .semana {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 9px;
      }
      .dia {
        border: 1px solid var(--borde);
        border-radius: 11px;
        padding: 11px;
      }
      .dia.libre {
        background: var(--fondo);
      }
      .dia-tapa {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        cursor: pointer;
      }
      .dia-tapa input {
        width: 16px;
        height: 16px;
        accent-color: var(--fucsia);
      }
      .dia-tapa b {
        font-size: 13.5px;
      }
      .rango {
        display: flex;
        gap: 6px;
      }
      .rango input {
        flex: 1;
        min-width: 0;
        padding: 6px;
        border: 1.5px solid var(--borde);
        border-radius: 8px;
        font-size: 13px;
      }
      .descansa {
        font-size: 13px;
        color: var(--ciruela-3);
      }

      .comision {
        display: flex;
        align-items: center;
        gap: 9px;
        margin-bottom: 10px;
      }
      .comision input {
        width: 92px;
        padding: 9px 11px;
        border: 1.5px solid var(--borde);
        border-radius: 9px;
        font-size: 17px;
        font-weight: 700;
        text-align: right;
      }
      .comision input:focus {
        outline: none;
        border-color: var(--fucsia);
      }
      .comision .signo {
        font-size: 17px;
        font-weight: 700;
        color: var(--ciruela-3);
      }
      .ejemplo {
        font-size: 13px;
        color: var(--ciruela-3);
        background: var(--fondo);
        border-radius: 9px;
        padding: 10px 13px;
        max-width: 60ch;
      }
      .ejemplo b {
        color: var(--ciruela);
      }

      .peligro {
        border: 1px solid #f0c7cf;
        background: #fdf4f5;
        border-radius: 12px;
        padding: 16px;
      }
      .peligro h3 {
        color: #8e1f32;
      }
      .peligro p {
        font-size: 13.5px;
        color: #8a5560;
        margin-bottom: 12px;
        max-width: 60ch;
      }
      .bloqueo {
        background: #fef7e8;
        border: 1px solid #f2dfaf;
        border-radius: 9px;
        padding: 11px 13px;
        font-size: 13.5px;
        color: #7a5406;
        margin-bottom: 12px;
      }

      .acciones {
        display: flex;
        gap: 8px;
        margin-top: 6px;
      }
      .dos-campos {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        max-width: 520px;
      }
      .acceso-ok {
        font-size: 13.5px;
        color: #0f6b49;
        background: #e4f4ec;
        border-radius: 9px;
        padding: 10px 13px;
        margin-bottom: 12px;
        max-width: 60ch;
      }
      @media (max-width: 620px) {
        .dos-campos {
          grid-template-columns: 1fr;
        }
      }
      @media (max-width: 860px) {
        .dos-columnas {
          grid-template-columns: 1fr;
        }
      }
      @media (max-width: 720px) {
        :host {
          padding: 14px 12px 80px;
        }
        h1 {
          font-size: 22px;
        }
        .cabezote {
          gap: 10px;
        }
        .cabezote .boton {
          flex: 1;
          justify-content: center;
        }
      }
    `,
  ],
})
export class EquipoComponent {
  private api = inject(ApiService);

  profesionales = signal<Profesional[]>([]);
  servicios = signal<Servicio[]>([]);
  elegida = signal<Profesional | null>(null);
  filas = signal<FilaServicio[]>([]);
  dias = signal<FilaDia[]>([]);
  pendientes = signal(0);

  cargando = signal(true);
  guardando = signal(false);
  creando = signal(false);
  error = signal<string | null>(null);
  aviso = signal<string | null>(null);

  nuevaNombre = "";
  nuevaTelefono = "";

  editandoDatos = signal(false);
  nombreEdit = "";
  telefonoEdit = "";

  acceso = signal<{ tiene: boolean; documento?: string }>({ tiene: false });
  documento = "";
  claveTrabajadora = "";

  /** Qué porcentaje se le paga a la profesional que está abierta. */
  comisionPct = 50;

  constructor() {
    this.cargar();
  }

  editarDatos(p: Profesional) {
    this.nombreEdit = p.nombre;
    this.telefonoEdit = p.telefono ?? "";
    this.editandoDatos.set(true);
  }

  guardarDatos(p: Profesional) {
    if (!this.nombreEdit.trim()) {
      this.error.set("El nombre no puede quedar vacío.");
      return;
    }
    this.guardando.set(true);
    this.error.set(null);

    this.api
      .actualizarProfesional(p.id, {
        nombre: this.nombreEdit.trim(),
        telefono: this.telefonoEdit.trim() || undefined,
      })
      .subscribe({
        next: (actualizada) => {
          this.guardando.set(false);
          this.editandoDatos.set(false);
          this.elegida.set(actualizada);
          this.aviso.set("Datos actualizados.");
          this.cargar();
        },
        error: (err) => {
          this.guardando.set(false);
          this.error.set(
            err?.error?.mensaje ?? "No se pudieron guardar los datos.",
          );
        },
      });
  }

  /**
   * La comisión se guarda sola, no con "Guardar cambios".
   *
   * Es plata: confundirla con un cambio de horario y guardarla sin
   * querer sería peligroso.
   */
  guardarComision(p: Profesional) {
    if (this.comisionPct < 0 || this.comisionPct > 100) {
      this.error.set("El porcentaje va entre 0 y 100.");
      return;
    }
    this.guardando.set(true);
    this.error.set(null);

    this.api.cambiarComision(p.id, this.comisionPct).subscribe({
      next: (actualizada) => {
        this.guardando.set(false);
        // Se toma lo que devolvió el backend, no lo que se escribió:
        // así se ve de una si el servidor lo ajustó o lo rechazó
        this.elegida.set(actualizada);
        this.comisionPct = Number(actualizada.comisionPct ?? 50);
        this.aviso.set(`A ${p.nombre} se le paga el ${this.comisionPct}%.`);
        this.cargar();
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(err?.error?.mensaje ?? "No se pudo guardar.");
      },
    });
  }

  cargar() {
    forkJoin({
      profesionales: this.api.profesionales(),
      servicios: this.api.servicios(),
    }).subscribe({
      next: (r) => {
        this.profesionales.set(r.profesionales);
        this.servicios.set(r.servicios);
        this.cargando.set(false);

        const abierta = this.elegida();
        if (abierta) {
          // Se refresca el objeto abierto con los datos recién traídos
          const puesta = r.profesionales.find((p) => p.id === abierta.id);
          if (puesta) {
            this.elegida.set(puesta);
            this.comisionPct = Number(puesta.comisionPct ?? 50);
          }
        } else if (r.profesionales.length) {
          this.elegir(r.profesionales[0]);
        }
      },
      error: () => {
        this.error.set("No se pudo cargar el equipo.");
        this.cargando.set(false);
      },
    });
  }

  elegir(p: Profesional) {
    this.creando.set(false);
    this.elegida.set(p);
    this.aviso.set(null);

    this.documento = "";
    this.claveTrabajadora = "";
    this.editandoDatos.set(false);
    this.comisionPct = Number(p.comisionPct ?? 50);

    this.api.verAcceso(p.id).subscribe((a) => {
      this.acceso.set(a);
      if (a.documento) this.documento = a.documento;
    });

    forkJoin({
      suyos: this.api.serviciosDe(p.id),
      horarios: this.api.horariosDe(p.id),
      pendientes: this.api.citasPendientesDe(p.id),
    }).subscribe({
      next: (r) => {
        this.filas.set(
          this.servicios().map((s) => {
            const suyo = r.suyos.find((x) => x.servicioId === s.id);
            return {
              servicioId: s.id,
              nombre: s.nombre,
              normal: s.duracionMin,
              hace: !!suyo,
              ajuste: suyo?.duracionMin ?? null,
            };
          }),
        );

        this.dias.set(
          DIAS.map((nombre, i) => {
            const dia = i + 1;
            const tramo = r.horarios.find(
              (h: HorarioBase) => h.diaSemana === dia,
            );
            return {
              diaSemana: dia,
              nombre,
              trabaja: !!tramo,
              horaInicio: tramo?.horaInicio?.slice(0, 5) ?? "09:00",
              horaFin: tramo?.horaFin?.slice(0, 5) ?? "18:00",
            };
          }),
        );

        this.pendientes.set(r.pendientes);
      },
      error: () => this.error.set("No se pudieron cargar sus datos."),
    });
  }

  abrirNueva() {
    this.nuevaNombre = "";
    this.nuevaTelefono = "";
    this.creando.set(true);
    this.elegida.set(null);
  }

  crear() {
    if (!this.nuevaNombre.trim()) {
      this.error.set("Escriba el nombre.");
      return;
    }
    this.guardando.set(true);
    this.api
      .crearProfesional({
        nombre: this.nuevaNombre.trim(),
        telefono: this.nuevaTelefono || undefined,
      })
      .subscribe({
        next: (p) => {
          this.guardando.set(false);
          this.creando.set(false);
          this.cargar();
          this.elegir(p);
        },
        error: (err) => {
          this.guardando.set(false);
          // El backend rechaza si ya se llegó al tope del plan
          this.error.set(err?.error?.mensaje ?? "No se pudo crear.");
        },
      });
  }

  guardarTodo() {
    const p = this.elegida();
    if (!p) return;

    this.guardando.set(true);
    this.error.set(null);

    const servicios = this.filas()
      .filter((f) => f.hace)
      .map((f) => ({
        servicioId: f.servicioId,
        // Si el ajuste coincide con lo normal, no se guarda como ajuste
        duracionMin: f.ajuste && f.ajuste !== f.normal ? f.ajuste : null,
      }));

    const tramos = this.dias()
      .filter((d) => d.trabaja)
      .map((d) => ({
        diaSemana: d.diaSemana,
        horaInicio: d.horaInicio,
        horaFin: d.horaFin,
      }));

    forkJoin({
      servicios: this.api.definirServiciosDe(p.id, servicios),
      horarios: this.api.guardarHorarios(p.id, tramos),
    }).subscribe({
      next: () => {
        this.guardando.set(false);
        this.aviso.set("Cambios guardados.");
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(
          err?.error?.mensaje ?? "No se pudieron guardar los cambios.",
        );
      },
    });
  }

  guardarAcceso(p: Profesional) {
    if (!this.documento.trim()) {
      this.error.set("Escriba la cédula.");
      return;
    }
    if (this.claveTrabajadora.length < 8) {
      this.error.set("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    this.guardando.set(true);
    this.error.set(null);

    this.api
      .crearAcceso(p.id, this.documento, this.claveTrabajadora)
      .subscribe({
        next: (r) => {
          this.guardando.set(false);
          this.claveTrabajadora = "";
          this.aviso.set(r.mensaje);
          this.api.verAcceso(p.id).subscribe((a) => this.acceso.set(a));
        },
        error: (err) => {
          this.guardando.set(false);
          this.error.set(err?.error?.mensaje ?? "No se pudo crear el acceso.");
        },
      });
  }

  retirar(p: Profesional) {
    if (!confirm(`¿Retirar a ${p.nombre} del equipo?`)) return;

    this.api.retirarProfesional(p.id).subscribe({
      next: () => {
        this.elegida.set(null);
        this.aviso.set(`${p.nombre} fue retirada del equipo.`);
        this.cargar();
      },
      error: (err) =>
        this.error.set(err?.error?.mensaje ?? "No se pudo retirar."),
    });
  }
}
