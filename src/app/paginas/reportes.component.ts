import { Component, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { HttpClient, HttpParams } from "@angular/common/http";
import { ApiService } from "../core/api.service";
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

interface Liquidacion {
  profesionalId: number;
  nombre: string;
  citas: number;
  produccion: number;
  comisionPct: number;
  comision: number;
  paraElSalon: number;
}

interface Comisiones {
  produccionTotal: number;
  comisionesTotal: number;
  paraElSalon: number;
  citasCobradas: number;
  sinMetodoPago: number;
  porProfesional: Liquidacion[];
  porMetodoPago: [string, number][];
}

/**
 * Los números del mes. Es la pantalla que sirve para justificar la
 * mensualidad: sin esto, la conversación del cobro es a punta de opinión.
 *
 * Tiene dos caras: la operación (ocupación, no-shows) y la plata
 * (producción, comisiones, cómo pagaron). La segunda es la que la dueña
 * le pasa al contador.
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

    <div class="pestanas" role="group" aria-label="Qué ver">
      <button
        [attr.aria-pressed]="vista() === 'operacion'"
        (click)="vista.set('operacion')"
      >
        Cómo va el salón
      </button>
      <button
        [attr.aria-pressed]="vista() === 'plata'"
        (click)="vista.set('plata')"
      >
        Producción y comisiones
      </button>
    </div>

    @if (error()) {
      <div class="error">{{ error() }}</div>
    }

    @if (cargando()) {
      <div class="cargando">Calculando…</div>
    } @else if (vista() === "operacion") {
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

        <button
          class="boton b-linea descargar-abajo"
          (click)="descargarCitas()"
          [disabled]="descargando()"
        >
          {{
            descargando() ? "Preparando…" : "⬇ Descargar las citas para Excel"
          }}
        </button>
      }
    } @else {
      @if (comisiones(); as c) {
        <div class="tarjetas">
          <div class="tarjeta dato destacada">
            <span>Produjo el salón</span>
            <b>{{
              c.produccionTotal / 100
                | currency: "COP" : "symbol-narrow" : "1.0-0"
            }}</b>
            <small>{{ c.citasCobradas }} citas atendidas</small>
          </div>
          <div class="tarjeta dato">
            <span>Para las manicuristas</span>
            <b>{{
              c.comisionesTotal / 100
                | currency: "COP" : "symbol-narrow" : "1.0-0"
            }}</b>
            <small>en comisiones</small>
          </div>
          <div class="tarjeta dato bueno">
            <span>Queda al salón</span>
            <b>{{
              c.paraElSalon / 100 | currency: "COP" : "symbol-narrow" : "1.0-0"
            }}</b>
            <small>antes de gastos</small>
          </div>
        </div>

        @if (c.sinMetodoPago > 0) {
          <div class="alerta-pago">
            <b>{{ c.sinMetodoPago }}</b>
            {{ c.sinMetodoPago === 1 ? "cita quedó" : "citas quedaron" }}
            sin marcar con qué pagaron. Búsquelas en la agenda y márquelas, o la
            caja no le va a cuadrar.
          </div>
        }

        <div class="tarjeta seccion">
          <h2>Liquidación por manicurista</h2>

          @if (c.porProfesional.length === 0) {
            <p class="nada">Todavía no hay citas atendidas en este rango.</p>
          } @else {
            <div class="tabla">
              <div class="fila cabecera">
                <span class="quien">Quién</span>
                <span class="num">Citas</span>
                <span class="num">Produjo</span>
                <span class="num">%</span>
                <span class="num">Se le paga</span>
                <span class="num">Queda</span>
              </div>

              @for (l of c.porProfesional; track l.profesionalId) {
                <div class="fila">
                  <span class="quien">{{ l.nombre }}</span>
                  <span class="num">{{ l.citas }}</span>
                  <span class="num">{{
                    l.produccion / 100
                      | currency: "COP" : "symbol-narrow" : "1.0-0"
                  }}</span>
                  <span class="num pct-col">{{ l.comisionPct }}%</span>
                  <span class="num paga">{{
                    l.comision / 100
                      | currency: "COP" : "symbol-narrow" : "1.0-0"
                  }}</span>
                  <span class="num">{{
                    l.paraElSalon / 100
                      | currency: "COP" : "symbol-narrow" : "1.0-0"
                  }}</span>
                </div>
              }

              <div class="fila total">
                <span class="quien">Total</span>
                <span class="num">{{ c.citasCobradas }}</span>
                <span class="num">{{
                  c.produccionTotal / 100
                    | currency: "COP" : "symbol-narrow" : "1.0-0"
                }}</span>
                <span class="num"></span>
                <span class="num paga">{{
                  c.comisionesTotal / 100
                    | currency: "COP" : "symbol-narrow" : "1.0-0"
                }}</span>
                <span class="num">{{
                  c.paraElSalon / 100
                    | currency: "COP" : "symbol-narrow" : "1.0-0"
                }}</span>
              </div>
            </div>

            <p class="nota">
              Solo cuentan las citas que se marcaron como atendidas. El valor es
              el que se cobró ese día, así que si mañana suben los precios, esta
              liquidación no se mueve.
            </p>
          }
        </div>

        @if (c.porMetodoPago.length) {
          <div class="tarjeta seccion">
            <h2>Cómo pagaron</h2>
            @for (m of c.porMetodoPago; track m[0]) {
              <div class="fila-metodo">
                <span class="quien">{{ m[0] }}</span>
                <div class="barra">
                  <div
                    class="relleno"
                    [style.width.%]="porcentaje(m[1], c.produccionTotal)"
                  ></div>
                </div>
                <span class="pct"
                  >{{ porcentaje(m[1], c.produccionTotal) }}%</span
                >
                <span class="detalle">{{
                  m[1] / 100 | currency: "COP" : "symbol-narrow" : "1.0-0"
                }}</span>
              </div>
            }
          </div>
        }

        <button
          class="boton b-fucsia descargar-abajo"
          (click)="descargarLiquidacion()"
          [disabled]="descargando()"
        >
          {{
            descargando()
              ? "Preparando…"
              : "⬇ Descargar la liquidación para el contador"
          }}
        </button>
        <p class="nota centrada">
          Trae el resumen por persona, cómo pagaron y el detalle de cada cita.
          Se abre en Excel con doble clic.
        </p>
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
        margin-bottom: 14px;
      }

      .pestanas {
        display: flex;
        gap: 3px;
        padding: 3px;
        background: var(--fondo);
        border-radius: 12px;
        margin-bottom: 18px;
        width: fit-content;
        max-width: 100%;
        overflow-x: auto;
      }
      .pestanas button {
        padding: 9px 16px;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 600;
        color: var(--ciruela-3);
        white-space: nowrap;
      }
      .pestanas button[aria-pressed="true"] {
        background: var(--papel);
        color: var(--ciruela);
        box-shadow: 0 2px 8px -3px rgba(42, 10, 28, 0.25);
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
        font-size: 30px;
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
      .dato.destacada b {
        color: var(--fucsia);
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
      .alerta-pago {
        background: #fdf3e3;
        color: #7a4d06;
        border-radius: 12px;
        padding: 14px 16px;
        font-size: 14.5px;
        margin-bottom: 16px;
        max-width: 72ch;
      }
      .alerta-pago b {
        font-size: 18px;
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
      .nota.centrada {
        text-align: center;
        margin-inline: auto;
        margin-top: 10px;
      }
      .nada {
        font-size: 14px;
        color: var(--ciruela-3);
      }

      /* ---- Tabla de liquidación ---- */
      .tabla {
        overflow-x: auto;
      }
      .fila {
        display: grid;
        grid-template-columns: 1.4fr 56px 1fr 52px 1fr 1fr;
        gap: 10px;
        align-items: center;
        padding: 10px 0;
        border-bottom: 1px solid var(--borde);
        min-width: 560px;
      }
      .fila:last-child {
        border-bottom: 0;
      }
      .fila.cabecera {
        font-size: 12px;
        color: var(--ciruela-3);
        font-weight: 600;
        padding-bottom: 7px;
      }
      .fila.total {
        border-top: 2px solid var(--borde);
        border-bottom: 0;
        font-weight: 700;
        margin-top: 4px;
      }
      .fila .num {
        text-align: right;
        font-size: 14px;
        font-variant-numeric: tabular-nums;
      }
      .fila .pct-col {
        color: var(--ciruela-3);
      }
      .fila .paga {
        color: var(--fucsia-hondo);
        font-weight: 700;
      }

      .fila-ocupacion,
      .fila-metodo {
        display: grid;
        grid-template-columns: 130px 1fr 46px 150px;
        gap: 12px;
        align-items: center;
        padding: 9px 0;
        border-bottom: 1px solid var(--borde);
      }
      .fila-ocupacion:last-of-type,
      .fila-metodo:last-of-type {
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

      .descargar-abajo {
        width: 100%;
        justify-content: center;
        padding: 14px;
      }

      @media (max-width: 720px) {
        .fila-ocupacion,
        .fila-metodo {
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
        .fila .quien {
          grid-area: auto;
        }
      }
    `,
  ],
})
export class ReportesComponent {
  private http = inject(HttpClient);
  private api = inject(ApiService);

  desde = "";
  hasta = "";

  /** La operación o la plata: son dos conversaciones distintas. */
  vista = signal<"operacion" | "plata">("operacion");

  datos = signal<Reporte | null>(null);
  comisiones = signal<Comisiones | null>(null);
  cargando = signal(false);
  descargando = signal(false);
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

  /**
   * Se piden las dos cosas de una. Son dos llamadas, pero el dueño cambia
   * de pestaña seguido y esperar cada vez se siente lento.
   */
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

    this.api.comisiones(this.desde, this.hasta).subscribe({
      next: (c) => this.comisiones.set(c),
      error: () => {
        /* si falla, la pestaña de plata queda vacía y la otra sigue */
      },
    });
  }

  porcentaje(parte: number, total: number) {
    return total === 0 ? 0 : Math.round((parte / total) * 100);
  }

  /**
   * Baja un archivo para Excel.
   *
   * Se pide como blob porque no es JSON, y se arma un enlace temporal para
   * disparar la descarga: así el navegador la trata como un archivo normal
   * y el token de la sesión viaja en la petición.
   */
  private bajar(archivo: Blob, nombre: string) {
    const url = URL.createObjectURL(archivo);
    const a = document.createElement("a");
    a.href = url;
    a.download = nombre;
    a.click();
    URL.revokeObjectURL(url);
    this.descargando.set(false);
  }

  descargarCitas() {
    if (!this.desde || !this.hasta) return;
    this.descargando.set(true);
    this.error.set(null);

    this.api.exportarCitas(this.desde, this.hasta).subscribe({
      next: (archivo) =>
        this.bajar(archivo, `citas-${this.desde}-a-${this.hasta}.csv`),
      error: () => {
        this.descargando.set(false);
        this.error.set("No se pudo generar el archivo.");
      },
    });
  }

  descargarLiquidacion() {
    if (!this.desde || !this.hasta) return;
    this.descargando.set(true);
    this.error.set(null);

    this.api.exportarComisiones(this.desde, this.hasta).subscribe({
      next: (archivo) =>
        this.bajar(archivo, `liquidacion-${this.desde}-a-${this.hasta}.csv`),
      error: () => {
        this.descargando.set(false);
        this.error.set("No se pudo generar la liquidación.");
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
