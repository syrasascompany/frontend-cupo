import { Component, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { HttpClient, HttpParams } from "@angular/common/http";
import { entorno } from "../../environments/environment";

interface OcupacionProfesional {
  profesionalId: number;
  nombre: string;
  minutosDisponibles: number;
  minutosOcupados: number;
  porcentaje: number;
  citas: number;
}

interface ClienteFallon {
  nombre: string;
  telefono: string;
  faltas: number;
}

interface Reporte {
  desde: string;
  hasta: string;
  citasTotales: number;
  finalizadas: number;
  canceladas: number;
  noAsistio: number;
  porWhatsapp: number;
  porPanel: number;
  porcentajeNoShow: number;
  ocupacionGeneral: number;
  minutosVendidos: number;
  cuposRecuperados: number;
  porProfesional: OcupacionProfesional[];
  masFallan: ClienteFallon[];
}

/**
 * Los números del mes. Es la pantalla que sirve para justificar la
 * mensualidad: sin esto, la conversación del cobro es a punta de opinión.
 */
@Component({
  selector: "cupo-reportes",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="cabezote">
      <h1>Reportes</h1>
      <div class="rango">
        <input
          type="date"
          [(ngModel)]="desde"
          (ngModelChange)="cargar()"
          aria-label="Desde"
        />
        <span>a</span>
        <input
          type="date"
          [(ngModel)]="hasta"
          (ngModelChange)="cargar()"
          aria-label="Hasta"
        />
      </div>
    </div>

    <div class="atajos">
      <button class="boton b-linea b-chico" (click)="ultimos(7)">
        Últimos 7 días
      </button>
      <button class="boton b-linea b-chico" (click)="ultimos(30)">
        Últimos 30 días
      </button>
      <button class="boton b-linea b-chico" (click)="esteMes()">
        Este mes
      </button>
    </div>

    @if (error()) {
      <div class="error">{{ error() }}</div>
    }

    @if (cargando()) {
      <div class="cargando">Calculando…</div>
    } @else {
      @if (datos(); as d) {
        <div class="tarjetas">
          <div class="tarjeta dato">
            <span>Ocupación</span>
            <b>{{ d.ocupacionGeneral }}%</b>
            <small>{{ horas(d.minutosVendidos) }} vendidas</small>
          </div>
          <div class="tarjeta dato">
            <span>Citas atendidas</span>
            <b>{{ d.finalizadas }}</b>
            <small>de {{ d.citasTotales }} agendadas</small>
          </div>
          <div class="tarjeta dato" [class.alerta]="d.porcentajeNoShow >= 15">
            <span>No llegaron</span>
            <b>{{ d.porcentajeNoShow }}%</b>
            <small>{{ d.noAsistio }} clientas</small>
          </div>
          <div class="tarjeta dato bueno">
            <span>Por WhatsApp</span>
            <b>{{ d.porWhatsapp }}</b>
            <small>sin que nadie contestara</small>
          </div>
        </div>

        @if (d.cuposRecuperados > 0) {
          <div class="recuperados">
            <b>{{ d.cuposRecuperados }}</b> cupos cancelados se volvieron a
            llenar gracias a la lista de espera.
          </div>
        }

        <div class="tarjeta seccion">
          <h2>Ocupación por manicurista</h2>
          @if (d.porProfesional.length === 0) {
            <p class="nada">Todavía no hay datos en este rango.</p>
          } @else {
            @for (p of d.porProfesional; track p.profesionalId) {
              <div class="fila-ocupacion">
                <span class="quien">{{ p.nombre }}</span>
                <div class="barra">
                  <div
                    class="relleno"
                    [style.width.%]="p.porcentaje"
                    [class.baja]="p.porcentaje < 40"
                    [class.llena]="p.porcentaje >= 80"
                  ></div>
                </div>
                <span class="pct">{{ p.porcentaje }}%</span>
                <span class="detalle"
                  >{{ p.citas }} citas · {{ horas(p.minutosOcupados) }}</span
                >
              </div>
            }
            <p class="nota">
              La ocupación compara las horas vendidas contra las horas que cada
              una tuvo disponibles, descontando permisos y ausencias.
            </p>
          }
        </div>

        @if (d.masFallan.length) {
          <div class="tarjeta seccion">
            <h2>Las que más faltan</h2>
            <p class="nota">
              A estas clientas puede pedirles abono para separar.
            </p>
            @for (c of d.masFallan; track c.telefono) {
              <div class="fila-fallon">
                <span class="quien">{{ c.nombre }}</span>
                <a
                  class="tel"
                  [href]="'https://wa.me/' + c.telefono"
                  target="_blank"
                  rel="noopener"
                  >{{ c.telefono }}</a
                >
                <span class="faltas"
                  >{{ c.faltas }}
                  {{ c.faltas === 1 ? "falta" : "faltas" }}</span
                >
              </div>
            }
          </div>
        }

        <div class="tarjeta seccion">
          <h2>De dónde entraron las citas</h2>
          <div class="origenes">
            <div class="origen">
              <b>{{ d.porWhatsapp }}</b>
              <span>Por WhatsApp, solas</span>
            </div>
            <div class="origen">
              <b>{{ d.porPanel }}</b>
              <span>Agendadas por ustedes</span>
            </div>
            <div class="origen">
              <b>{{ d.canceladas }}</b>
              <span>Canceladas</span>
            </div>
          </div>
        </div>
      }
    }
  `,
  styles: [
    `
      :host {
        display: block;
        max-width: 1100px;
        margin-inline: auto;
        padding: 18px 18px 80px;
      }
      .cabezote {
        display: flex;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;
        margin-bottom: 12px;
      }
      h1 {
        font-size: 26px;
        margin-right: auto;
      }
      .rango {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .rango input {
        padding: 8px 11px;
        border: 1.5px solid var(--borde);
        border-radius: 9px;
        font-size: 14px;
      }
      .rango span {
        color: var(--ciruela-3);
        font-size: 14px;
      }
      .atajos {
        display: flex;
        gap: 7px;
        flex-wrap: wrap;
        margin-bottom: 18px;
      }

      .tarjetas {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
        gap: 13px;
        margin-bottom: 16px;
      }
      .dato {
        padding: 18px;
      }
      .dato span {
        font-size: 13px;
        color: var(--ciruela-3);
        display: block;
      }
      .dato b {
        font-size: 34px;
        font-weight: 800;
        letter-spacing: -0.03em;
        display: block;
        line-height: 1.1;
        margin: 4px 0 2px;
      }
      .dato small {
        font-size: 12.5px;
        color: var(--ciruela-3);
      }
      .dato.alerta b {
        color: var(--rojo);
      }
      .dato.bueno b {
        color: var(--wa);
      }

      .recuperados {
        background: #e4f4ec;
        color: #0f6b49;
        border-radius: 12px;
        padding: 14px 16px;
        font-size: 15px;
        margin-bottom: 16px;
      }
      .recuperados b {
        font-size: 19px;
        font-weight: 800;
      }

      .seccion {
        padding: 20px;
        margin-bottom: 16px;
      }
      .seccion h2 {
        font-size: 18px;
        margin-bottom: 14px;
      }
      .nota {
        font-size: 13px;
        color: var(--ciruela-3);
        margin-top: 12px;
        max-width: 66ch;
      }
      .nada {
        font-size: 14px;
        color: var(--ciruela-3);
      }

      .fila-ocupacion {
        display: grid;
        grid-template-columns: 130px 1fr 46px 150px;
        gap: 12px;
        align-items: center;
        padding: 9px 0;
        border-bottom: 1px solid var(--borde);
      }
      .fila-ocupacion:last-of-type {
        border-bottom: 0;
      }
      .quien {
        font-size: 14.5px;
        font-weight: 600;
      }
      .barra {
        height: 9px;
        background: var(--fondo);
        border-radius: 999px;
        overflow: hidden;
      }
      .relleno {
        height: 100%;
        background: var(--fucsia);
        border-radius: 999px;
        transition: width 0.5s var(--curva);
      }
      .relleno.baja {
        background: var(--ambar);
      }
      .relleno.llena {
        background: var(--verde);
      }
      .pct {
        font-size: 14px;
        font-weight: 700;
        text-align: right;
      }
      .detalle {
        font-size: 12.5px;
        color: var(--ciruela-3);
      }

      .fila-fallon {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 9px 0;
        border-bottom: 1px solid var(--borde);
      }
      .fila-fallon:last-of-type {
        border-bottom: 0;
      }
      .tel {
        color: var(--wa);
        text-decoration: none;
        font-size: 13.5px;
        font-weight: 600;
        margin-right: auto;
      }
      .faltas {
        font-size: 13px;
        color: var(--rojo);
        font-weight: 600;
      }

      .origenes {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 16px;
      }
      .origen b {
        font-size: 28px;
        font-weight: 800;
        display: block;
      }
      .origen span {
        font-size: 13px;
        color: var(--ciruela-3);
      }

      @media (max-width: 720px) {
        .fila-ocupacion {
          grid-template-columns: 1fr 46px;
          grid-template-areas: "quien pct" "barra barra" "detalle detalle";
        }
        .quien {
          grid-area: quien;
        }
        .pct {
          grid-area: pct;
        }
        .barra {
          grid-area: barra;
        }
        .detalle {
          grid-area: detalle;
        }
      }
    `,
  ],
})
export class ReportesComponent {
  private http = inject(HttpClient);

  desde = "";
  hasta = "";
  datos = signal<Reporte | null>(null);
  cargando = signal(false);
  error = signal<string | null>(null);

  constructor() {
    this.ultimos(30);
  }

  private iso(f: Date) {
    return (
      `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}` +
      `-${String(f.getDate()).padStart(2, "0")}`
    );
  }

  ultimos(dias: number) {
    const hoy = new Date();
    const antes = new Date();
    antes.setDate(antes.getDate() - dias + 1);
    this.desde = this.iso(antes);
    this.hasta = this.iso(hoy);
    this.cargar();
  }

  esteMes() {
    const hoy = new Date();
    this.desde = this.iso(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
    this.hasta = this.iso(hoy);
    this.cargar();
  }

  cargar() {
    if (!this.desde || !this.hasta) return;
    this.cargando.set(true);
    this.error.set(null);

    const params = new HttpParams()
      .set("desde", this.desde)
      .set("hasta", this.hasta);

    this.http.get<Reporte>(`${entorno.api}/reportes`, { params }).subscribe({
      next: (r) => {
        this.datos.set(r);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set("No se pudieron calcular los reportes.");
        this.cargando.set(false);
      },
    });
  }

  /** 315 minutos se lee mejor como "5 h 15 min". */
  horas(minutos: number) {
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    if (h === 0) return `${m} min`;
    return m === 0 ? `${h} h` : `${h} h ${m} min`;
  }
}
