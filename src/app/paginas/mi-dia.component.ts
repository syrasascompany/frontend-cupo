import { Component, OnDestroy, computed, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { forkJoin } from "rxjs";
import { ApiService } from "../core/api.service";
import { AuthService } from "../core/auth.service";
import { Cita, Servicio } from "../core/modelos";

/**
 * Lo que ve la manicurista en su celular: sus citas y un botón para
 * marcarlas. Puede moverse entre días, porque su semana no termina hoy.
 * No puede editar horarios ni ver la agenda de las demás.
 */
@Component({
  selector: "cupo-mi-dia",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tapa-dia">
      <h1>Hola, {{ auth.sesion()?.nombre }}</h1>

      <div class="dias">
        <button class="flecha" (click)="mover(-1)" aria-label="Día anterior">
          ‹
        </button>
        <span class="cual">{{ titulo() }}</span>
        <button class="flecha" (click)="mover(1)" aria-label="Día siguiente">
          ›
        </button>
        @if (!esHoy()) {
          <button class="hoy-boton" (click)="irHoy()">Hoy</button>
        }
      </div>

      <div class="resumen">
        <div>
          <span>Citas</span>
          <b>{{ pendientes().length + hechas().length }}</b>
        </div>
        <div>
          <span>Terminadas</span>
          <b>{{ hechas().length }}</b>
        </div>
      </div>
    </div>

    @if (error()) {
      <div class="error caja">{{ error() }}</div>
    }

    @if (nuevas() > 0) {
      <div class="aviso-nuevas" (click)="verNuevas()">
        <span class="punto"></span>
        <b>{{ nuevas() }}</b>
        {{ nuevas() === 1 ? "cita nueva" : "citas nuevas" }}
      </div>
    }

    @if (cargando()) {
      <div class="cargando">Cargando…</div>
    } @else if (pendientes().length === 0 && hechas().length === 0) {
      <div class="vacio">
        {{
          esHoy() ? "Hoy no tiene citas agendadas." : "Ese día no tiene citas."
        }}
      </div>
    } @else {
      <div class="lista">
        @if (pendientes().length) {
          <div class="separador">Lo que viene</div>
          @for (c of pendientes(); track c.id) {
            <div class="tarjeta-cita">
              <div class="hora">
                {{ c.inicio | date: "h:mm a" }}
                <small>{{ duracion(c) }} min</small>
              </div>
              <div class="medio">
                <b>{{ c.clienteNombre || "Sin nombre" }}</b>
                <span
                  >{{ nombreServicio(c.servicioId) }} · hasta
                  {{ c.fin | date: "h:mm a" }}</span
                >
                @if (c.clienteTelefono) {
                  <a
                    class="tel"
                    [href]="'https://wa.me/' + c.clienteTelefono"
                    target="_blank"
                    rel="noopener"
                    >{{ c.clienteTelefono }}</a
                  >
                }
              </div>
              <button
                class="boton b-fucsia b-chico"
                (click)="finalizar(c)"
                [disabled]="marcando() === c.id"
              >
                {{ marcando() === c.id ? "…" : "Finalizar" }}
              </button>
            </div>
          }
        }

        @if (hechas().length) {
          <div class="separador">Terminadas</div>
          @for (c of hechas(); track c.id) {
            <div class="tarjeta-cita hecha">
              <div class="hora">{{ c.inicio | date: "h:mm a" }}</div>
              <div class="medio">
                <b>{{ c.clienteNombre || "Sin nombre" }}</b>
                <span>{{ nombreServicio(c.servicioId) }}</span>
              </div>
              <span class="pastilla p-finalizada">Hecha</span>
            </div>
          }
        }
      </div>
    }
  `,
  styles: [
    `
      .tapa-dia {
        background: var(--fucsia);
        color: #fff;
        padding: 18px 18px 16px;
      }
      h1 {
        font-size: 24px;
        margin-bottom: 12px;
      }

      .dias {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .dias .cual {
        font-size: 14.5px;
        flex: 1;
        text-align: center;
      }
      .flecha {
        width: 30px;
        height: 30px;
        border-radius: 9px;
        color: #fff;
        font-size: 19px;
        background: rgba(255, 255, 255, 0.16);
        display: grid;
        place-items: center;
        flex: none;
      }
      .flecha:hover {
        background: rgba(255, 255, 255, 0.28);
      }
      .hoy-boton {
        font-size: 12.5px;
        font-weight: 600;
        color: var(--fucsia);
        background: #fff;
        padding: 5px 11px;
        border-radius: 8px;
        flex: none;
      }

      .resumen {
        display: flex;
        gap: 22px;
        margin-top: 14px;
        padding-top: 13px;
        border-top: 1px solid rgba(255, 255, 255, 0.22);
      }
      .resumen span {
        display: block;
        font-size: 12px;
        opacity: 0.78;
      }
      .resumen b {
        font-size: 20px;
        font-weight: 800;
      }

      .caja {
        margin: 14px 18px;
      }
      .aviso-nuevas {
        margin: 14px 18px;
        padding: 11px 15px;
        background: var(--wa);
        color: #fff;
        border-radius: 12px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 9px;
        font-size: 14.5px;
        animation: asomar 0.4s ease both;
      }
      .aviso-nuevas b {
        font-size: 16px;
        font-weight: 800;
      }
      .punto {
        width: 9px;
        height: 9px;
        border-radius: 50%;
        background: #fff;
        flex: none;
        animation: latido 1.6s ease-in-out infinite;
      }
      @keyframes asomar {
        from {
          opacity: 0;
          transform: translateY(-8px);
        }
        to {
          opacity: 1;
          transform: none;
        }
      }
      @keyframes latido {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.35;
        }
      }
      .lista {
        padding: 12px 14px 90px;
        max-width: 560px;
        margin-inline: auto;
      }
      .separador {
        font-size: 12.5px;
        font-weight: 600;
        color: var(--ciruela-3);
        margin: 16px 0 9px;
      }

      .tarjeta-cita {
        background: var(--papel);
        border: 1px solid var(--borde);
        border-radius: 14px;
        padding: 13px;
        margin-bottom: 9px;
        display: flex;
        gap: 12px;
        align-items: center;
      }
      .tarjeta-cita.hecha {
        background: var(--fondo);
        border-color: transparent;
      }
      .hora {
        width: 74px;
        flex: none;
        font-size: 15px;
        font-weight: 700;
        color: var(--fucsia);
        line-height: 1.2;
      }
      .hora small {
        display: block;
        font-size: 11.5px;
        font-weight: 400;
        color: var(--ciruela-3);
      }
      .tarjeta-cita.hecha .hora {
        color: var(--ciruela-3);
      }
      .medio {
        flex: 1;
        min-width: 0;
      }
      .medio b {
        display: block;
        font-size: 15px;
      }
      .medio span {
        font-size: 13px;
        color: var(--ciruela-3);
      }
      .medio .tel {
        display: inline-block;
        margin-top: 3px;
        font-size: 12.5px;
        color: var(--wa);
        text-decoration: none;
        font-weight: 600;
      }
    `,
  ],
})
export class MiDiaComponent implements OnDestroy {
  private api = inject(ApiService);
  auth = inject(AuthService);

  /** Se refresca sola cada 30 segundos, igual que la agenda del dueño. */
  private reloj?: ReturnType<typeof setInterval>;
  nuevas = signal(0);
  private idsConocidos = new Set<number>();

  fecha = signal(new Date());
  citas = signal<Cita[]>([]);
  servicios = signal<Servicio[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);
  marcando = signal<number | null>(null);

  pendientes = computed(() =>
    this.citas().filter((c) => c.estado === "CONFIRMADA"),
  );
  hechas = computed(() =>
    this.citas().filter((c) => c.estado === "FINALIZADA"),
  );

  esHoy = computed(
    () => this.fecha().toDateString() === new Date().toDateString(),
  );

  titulo = computed(() => {
    if (this.esHoy()) return "Hoy";
    const texto = new Intl.DateTimeFormat("es-CO", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(this.fecha());
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  });

  constructor() {
    this.cargar();
    this.reloj = setInterval(() => this.refrescarEnSilencio(), 30000);
  }

  ngOnDestroy() {
    if (this.reloj) clearInterval(this.reloj);
  }

  private refrescarEnSilencio() {
    this.api.citasDelDia(this.iso(this.fecha())).subscribe({
      next: (citas) => {
        const llegaron = citas.filter(
          (c) => !this.idsConocidos.has(c.id) && c.estado !== "CANCELADA",
        ).length;

        if (llegaron > 0 && this.idsConocidos.size > 0) {
          this.nuevas.update((n) => n + llegaron);
        }
        citas.forEach((c) => this.idsConocidos.add(c.id));
        this.citas.set(citas);
      },
      error: () => {
        /* se reintenta en la siguiente pasada */
      },
    });
  }

  verNuevas() {
    this.nuevas.set(0);
    this.cargar();
  }

  mover(dias: number) {
    const f = new Date(this.fecha());
    f.setDate(f.getDate() + dias);
    this.fecha.set(f);
    this.nuevas.set(0);
    this.cargar();
  }

  irHoy() {
    this.fecha.set(new Date());
    this.cargar();
  }

  cargar() {
    this.cargando.set(true);
    this.error.set(null);

    forkJoin({
      citas: this.api.citasDelDia(this.iso(this.fecha())),
      servicios: this.api.servicios(),
    }).subscribe({
      next: (r) => {
        // El backend ya filtra por la profesional cuando el rol es TRABAJADORA
        this.citas.set(r.citas);
        this.servicios.set(r.servicios);
        this.idsConocidos = new Set(r.citas.map((c) => c.id));
        this.nuevas.set(0);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set("No se pudo cargar su día.");
        this.cargando.set(false);
      },
    });
  }

  /**
   * La fecha en local. Con toISOString, un día a las 7 p.m. en Bogotá
   * se convierte en el día siguiente y se muestran las citas equivocadas.
   */
  private iso(f: Date) {
    return (
      `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}` +
      `-${String(f.getDate()).padStart(2, "0")}`
    );
  }

  nombreServicio(id: number) {
    return this.servicios().find((s) => s.id === id)?.nombre ?? "Servicio";
  }

  duracion(c: Cita) {
    return Math.round(
      (new Date(c.fin).getTime() - new Date(c.inicio).getTime()) / 60000,
    );
  }

  finalizar(c: Cita) {
    this.marcando.set(c.id);
    this.api.cambiarEstado(c.id, "FINALIZADA").subscribe({
      next: () => {
        this.marcando.set(null);
        this.cargar();
      },
      error: () => {
        this.marcando.set(null);
        this.error.set("No se pudo marcar la cita.");
      },
    });
  }
}
