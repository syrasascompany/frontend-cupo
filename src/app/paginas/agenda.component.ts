import { Component, OnDestroy, computed, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { forkJoin } from "rxjs";
import { ApiService } from "../core/api.service";
import { Cita, Cupo, Profesional, Servicio } from "../core/modelos";

const INICIO_DIA = 7; // la grilla arranca a las 7 a.m.
const FIN_DIA = 21;
const ALTO_HORA = 62; // píxeles por hora

@Component({
  selector: "cupo-agenda",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="barra">
      <div class="fecha">
        <button class="flecha" (click)="mover(-1)" aria-label="Día anterior">
          ‹
        </button>
        <b>{{ titulo() }}</b>
        <button class="flecha" (click)="mover(1)" aria-label="Día siguiente">
          ›
        </button>
        <button class="boton b-linea b-chico" (click)="irHoy()">Hoy</button>
      </div>
      <button
        class="boton b-linea sonido-boton"
        (click)="alternarSonido()"
        [attr.aria-pressed]="sonido()"
        [title]="sonido() ? 'Sonido activado' : 'Sonido apagado'"
      >
        {{ sonido() ? "🔔" : "🔕" }}
      </button>
      <button class="boton b-linea" (click)="abrirPermiso()">
        Sellar permiso
      </button>
      <button class="boton b-fucsia" (click)="abrirNueva()">
        ＋ Agendar cita
      </button>
    </div>

    @if (error()) {
      <div class="error contenido">{{ error() }}</div>
    }

    @if (nuevas() > 0) {
      <div class="aviso-nuevas" (click)="verNuevas()">
        <span class="punto"></span>
        <b>{{ nuevas() }}</b>
        {{
          nuevas() === 1
            ? "cita nueva entró por WhatsApp"
            : "citas nuevas entraron por WhatsApp"
        }}
      </div>
    }

    @if (cargando()) {
      <div class="cargando">Cargando la agenda…</div>
    } @else if (profesionales().length === 0) {
      <div class="vacio">
        Todavía no hay manicuristas cargadas.<br />
        Agréguelas en «Mis manicuristas» para poder agendar.
      </div>
    } @else {
      <!-- Quién tiene hueco: la pregunta que el dueño hace todo el día -->
      <div class="tira">
        <button
          class="pastilla-prof"
          [class.activa]="soloProfesional() === null"
          (click)="soloProfesional.set(null)"
        >
          <span class="avatar todas">TODAS</span>
          <span
            ><b>Todas</b
            ><span class="dato">{{ citas().length }} citas</span></span
          >
        </button>

        @for (p of profesionales(); track p.id) {
          <button
            class="pastilla-prof"
            [class.activa]="soloProfesional() === p.id"
            (click)="alternar(p.id)"
          >
            <span class="avatar" [style.background]="color(p)">{{
              iniciales(p.nombre)
            }}</span>
            <span>
              <b>{{ p.nombre }}</b>
              <span class="dato" [class.lleno]="citasDe(p.id).length >= 6">
                {{ citasDe(p.id).length }}
                {{ citasDe(p.id).length === 1 ? "cita" : "citas" }}
              </span>
            </span>
          </button>
        }
      </div>

      <div class="contenido">
        <div class="tarjeta grilla">
          <div class="scroll">
            <div class="cuerpo-grilla">
              <div class="cabecera">
                <div class="hueco"></div>
                @for (p of visibles(); track p.id) {
                  <div class="col-cabeza">
                    <span class="avatar" [style.background]="color(p)">{{
                      iniciales(p.nombre)
                    }}</span>
                    <b>{{ p.nombre }}</b>
                  </div>
                }
              </div>

              <div class="cuadricula">
                <div class="horas">
                  @for (h of horas; track h) {
                    <div class="hora">{{ etiquetaHora(h) }}</div>
                  }
                </div>

                @for (p of visibles(); track p.id) {
                  <div class="columna">
                    @for (h of horas; track h) {
                      <div class="franja"></div>
                    }

                    @for (c of citasDe(p.id); track c.id) {
                      <button
                        class="cita"
                        [class.finalizada]="c.estado === 'FINALIZADA'"
                        [class.ausente]="c.estado === 'NO_ASISTIO'"
                        [style.top.px]="tope(c.inicio)"
                        [style.height.px]="alto(c.inicio, c.fin) - 3"
                        (click)="verCita(c)"
                      >
                        <b>{{ c.clienteNombre || "Sin nombre" }}</b>
                        <span>{{ nombreServicio(c.servicioId) }}</span>
                        <span class="hora-cita">{{
                          c.inicio | date: "h:mm a"
                        }}</span>
                      </button>
                    }
                  </div>
                }

                @if (esHoy()) {
                  <div class="ahora" [style.top.px]="topeAhora()">
                    <span>{{ ahora | date: "h:mm a" }}</span>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>

        <div class="leyenda">
          <span><i class="c1"></i>Confirmada</span>
          <span><i class="c2"></i>Finalizada</span>
          <span><i class="c3"></i>No llegó</span>
        </div>
      </div>
    }

    <!-- Panel lateral: agendar o ver una cita -->
    @if (panel() !== null) {
      <div class="velo" (click)="cerrarPanel()"></div>
      <aside class="hoja">
        <div class="hoja-tapa">
          <b>{{
            panel() === "nueva" ? "Agendar cita" : "Detalle de la cita"
          }}</b>
          <button class="cerrar" (click)="cerrarPanel()" aria-label="Cerrar">
            ✕
          </button>
        </div>

        <div class="hoja-cuerpo">
          @if (panel() === "permiso") {
            <p class="ayuda" style="margin-bottom:14px">
              Mientras el permiso esté puesto, esas horas no se ofrecen ni en el
              panel ni por WhatsApp.
            </p>
            <div class="campo">
              <label for="p-quien">Quién</label>
              <select id="p-quien" [(ngModel)]="permisoProfesional">
                <option [ngValue]="null">Escoja</option>
                @for (p of profesionales(); track p.id) {
                  <option [ngValue]="p.id">{{ p.nombre }}</option>
                }
              </select>
            </div>
            <div class="campo">
              <label for="p-tipo">Tipo</label>
              <select id="p-tipo" [(ngModel)]="permisoTipo">
                <option value="BLOQUEO">Permiso de unas horas</option>
                <option value="AUSENCIA">No viene en todo el día</option>
                <option value="CAMBIO_HORARIO">
                  Ese día trabaja en otro horario
                </option>
              </select>
            </div>
            @if (permisoTipo !== "AUSENCIA") {
              <div class="dos-horas">
                <div class="campo">
                  <label for="p-desde">Desde</label>
                  <input id="p-desde" type="time" [(ngModel)]="permisoDesde" />
                </div>
                <div class="campo">
                  <label for="p-hasta">Hasta</label>
                  <input id="p-hasta" type="time" [(ngModel)]="permisoHasta" />
                </div>
              </div>
            }
            <div class="campo">
              <label for="p-motivo">Motivo</label>
              <input
                id="p-motivo"
                [(ngModel)]="permisoMotivo"
                placeholder="Cita médica, permiso…"
              />
            </div>
          } @else if (panel() === "nueva") {
            <div class="campo">
              <label for="servicio">Servicio</label>
              <select
                id="servicio"
                [(ngModel)]="servicioElegido"
                (ngModelChange)="buscarCupos()"
              >
                <option [ngValue]="null">Escoja un servicio</option>
                @for (s of servicios(); track s.id) {
                  <option [ngValue]="s.id">
                    {{ s.nombre }} — {{ s.duracionMin }} min
                  </option>
                }
              </select>
            </div>

            @if (servicioElegido) {
              <div class="campo">
                <label>Horarios libres</label>
                @if (buscandoCupos()) {
                  <p class="ayuda">Buscando…</p>
                } @else if (cupos().length === 0) {
                  <p class="ayuda">
                    No quedan cupos para este servicio ese día.
                  </p>
                } @else {
                  <div class="cupos">
                    @for (c of cupos(); track c.inicio + c.profesionalId) {
                      <button
                        class="cupo"
                        [class.elegido]="cupoElegido === c"
                        (click)="cupoElegido = c"
                      >
                        <b>{{ c.inicio | date: "h:mm a" }}</b>
                        <span>{{ c.profesionalNombre }}</span>
                      </button>
                    }
                  </div>
                }
              </div>

              <div class="campo">
                <label for="nombre">Nombre de la clienta</label>
                <input id="nombre" [(ngModel)]="nombreCliente" />
              </div>

              <div class="campo">
                <label for="tel">WhatsApp</label>
                <input
                  id="tel"
                  [(ngModel)]="telefonoCliente"
                  inputmode="tel"
                  placeholder="3000000000"
                />
              </div>
            }
          } @else {
            @if (citaAbierta(); as c) {
              <p class="detalle-linea nombre-grande">
                {{ c.clienteNombre || "Sin nombre" }}
              </p>
              @if (c.clienteTelefono) {
                <p class="detalle-linea">
                  <a
                    class="tel"
                    [href]="'https://wa.me/' + c.clienteTelefono"
                    target="_blank"
                    rel="noopener"
                    >{{ c.clienteTelefono }}</a
                  >
                </p>
              }
              <p class="detalle-linea">
                <b>{{ nombreServicio(c.servicioId) }}</b>
              </p>
              <p class="detalle-linea">
                {{ c.inicio | date: "EEEE d, h:mm a" }} a
                {{ c.fin | date: "h:mm a" }}
              </p>
              <p class="detalle-linea">
                Con {{ nombreProfesional(c.profesionalId) }}
              </p>
              <p class="detalle-linea">
                <span class="pastilla" [class]="claseEstado(c.estado)">{{
                  etiquetaEstado(c.estado)
                }}</span>
              </p>

              @if (c.estado === "CONFIRMADA") {
                @if (!moviendo()) {
                  <div class="acciones-cita">
                    <button class="boton b-fucsia" (click)="abrirMover(c)">
                      Cambiar día u hora
                    </button>
                    <button
                      class="boton b-linea"
                      (click)="marcar(c, 'FINALIZADA')"
                    >
                      Marcar finalizada
                    </button>
                    <button
                      class="boton b-linea"
                      (click)="marcar(c, 'NO_ASISTIO')"
                    >
                      No llegó
                    </button>
                    <button
                      class="boton b-peligro"
                      (click)="marcar(c, 'CANCELADA')"
                    >
                      Cancelar cita
                    </button>
                  </div>
                  <p class="ayuda">
                    Al cancelar, Cupo le avisa a quien esté en lista de espera.
                  </p>
                } @else {
                  <div class="mover">
                    <div class="campo">
                      <label for="nuevo-dia">Nuevo día</label>
                      <input
                        id="nuevo-dia"
                        type="date"
                        [(ngModel)]="diaNuevo"
                        (ngModelChange)="buscarCuposMover(c)"
                      />
                    </div>

                    @if (buscandoCupos()) {
                      <p class="ayuda">Buscando horarios…</p>
                    } @else if (cupos().length === 0) {
                      <p class="ayuda">
                        No hay cupos libres ese día para este servicio.
                      </p>
                    } @else {
                      <label class="etiqueta-cupos">Horarios libres</label>
                      <div class="cupos">
                        @for (
                          cu of cupos();
                          track cu.inicio + cu.profesionalId
                        ) {
                          <button
                            class="cupo"
                            [class.elegido]="cupoElegido === cu"
                            (click)="cupoElegido = cu"
                          >
                            <b>{{ cu.inicio | date: "h:mm a" }}</b>
                            <span>{{ cu.profesionalNombre }}</span>
                          </button>
                        }
                      </div>
                    }

                    <div class="acciones-cita">
                      <button
                        class="boton b-fucsia"
                        (click)="confirmarMover(c)"
                        [disabled]="!cupoElegido || guardando()"
                      >
                        {{ guardando() ? "Moviendo…" : "Mover la cita" }}
                      </button>
                      <button
                        class="boton b-linea"
                        (click)="moviendo.set(false)"
                      >
                        Volver
                      </button>
                    </div>
                    <p class="ayuda">
                      El cupo viejo queda libre al instante y se le ofrece a la
                      lista de espera.
                    </p>
                  </div>
                }
              }
            }
          }
        </div>

        @if (panel() === "nueva") {
          <div class="hoja-pie">
            <button class="boton b-linea" (click)="cerrarPanel()">
              Cancelar
            </button>
            <button
              class="boton b-fucsia"
              (click)="guardar()"
              [disabled]="!cupoElegido || guardando()"
            >
              {{ guardando() ? "Guardando…" : "Guardar cita" }}
            </button>
          </div>
        }
        @if (panel() === "permiso") {
          <div class="hoja-pie">
            <button class="boton b-linea" (click)="cerrarPanel()">
              Cancelar
            </button>
            <button
              class="boton b-fucsia"
              (click)="guardarPermiso()"
              [disabled]="!permisoProfesional || guardando()"
            >
              {{ guardando() ? "Sellando…" : "Sellar" }}
            </button>
          </div>
        }
      </aside>
    }
  `,
  styles: [
    `
      .barra {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 14px 18px;
        flex-wrap: wrap;
        max-width: 1500px;
        margin-inline: auto;
      }
      .fecha {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-right: auto;
      }
      .fecha b {
        font-size: 17px;
        min-width: 190px;
      }
      .flecha {
        width: 30px;
        height: 30px;
        border-radius: 8px;
        font-size: 18px;
        color: var(--ciruela-2);
      }
      .flecha:hover {
        background: var(--papel);
      }

      .contenido {
        max-width: 1500px;
        margin-inline: auto;
        padding: 0 18px 80px;
      }

      .aviso-nuevas {
        max-width: 1500px;
        margin: 0 auto 12px;
        padding: 11px 16px;
        background: var(--wa);
        color: #fff;
        border-radius: 12px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 9px;
        font-size: 14.5px;
        width: calc(100% - 36px);
        animation: asomar 0.4s var(--curva) both;
      }
      .aviso-nuevas b {
        font-size: 16px;
        font-weight: 800;
      }
      .sonido-boton {
        padding: 10px 12px;
        font-size: 16px;
        line-height: 1;
      }
      .sonido-boton[aria-pressed="false"] {
        opacity: 0.5;
      }
      .aviso-nuevas:hover {
        filter: brightness(0.95);
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

      .tira {
        display: flex;
        gap: 8px;
        overflow-x: auto;
        padding: 0 18px 12px;
        max-width: 1500px;
        margin-inline: auto;
      }
      .pastilla-prof {
        display: flex;
        align-items: center;
        gap: 9px;
        padding: 7px 13px 7px 8px;
        background: var(--papel);
        border: 1.5px solid var(--borde);
        border-radius: 999px;
        white-space: nowrap;
        text-align: left;
        transition:
          border-color 0.2s,
          background 0.2s;
      }
      .pastilla-prof:hover {
        border-color: var(--fucsia);
      }
      .pastilla-prof.activa {
        border-color: var(--fucsia);
        background: var(--fucsia-claro);
      }
      .avatar.todas {
        background: var(--ciruela);
        font-size: 8.5px;
        letter-spacing: 0.03em;
      }
      .pastilla-prof b {
        font-size: 13.5px;
        display: block;
      }
      .dato {
        font-size: 12px;
        color: var(--ciruela-3);
      }
      .dato.lleno {
        color: var(--rojo);
        font-weight: 600;
      }

      .grilla {
        overflow: hidden;
      }
      .scroll {
        overflow-x: auto;
      }
      .cuerpo-grilla {
        min-width: max-content;
        position: relative;
        display: flex;
        flex-direction: column;
      }
      .scroll {
        width: 100%;
      }

      .cabecera {
        display: flex;
        position: sticky;
        top: 0;
        z-index: 20;
        background: var(--papel);
        border-bottom: 1px solid var(--borde);
        min-width: 100%;
      }
      .hueco {
        width: 58px;
        flex: none;
        border-right: 1px solid var(--borde);
        position: sticky;
        left: 0;
        background: var(--papel);
        z-index: 22;
      }
      .col-cabeza {
        flex: 1 1 158px;
        min-width: 158px;
        padding: 9px 11px;
        border-right: 1px solid var(--borde);
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .col-cabeza:last-child {
        border-right: 0;
      }
      .col-cabeza b {
        font-size: 13.5px;
      }

      .cuadricula {
        display: flex;
        position: relative;
        min-width: 100%;
      }
      .horas {
        width: 58px;
        flex: none;
        border-right: 1px solid var(--borde);
        position: sticky;
        left: 0;
        background: var(--papel);
        z-index: 15;
      }
      .hora {
        height: 62px;
        padding: 3px 8px;
        text-align: right;
        font-size: 11.5px;
        color: var(--ciruela-3);
        border-bottom: 1px solid var(--borde);
      }
      .columna {
        flex: 1 1 158px;
        min-width: 158px;
        border-right: 1px solid var(--borde);
        position: relative;
      }
      .columna:last-child {
        border-right: 0;
      }
      .franja {
        height: 62px;
        border-bottom: 1px solid var(--borde);
      }
      .franja:nth-child(odd) {
        background: rgba(255, 31, 109, 0.014);
      }

      .cita {
        position: absolute;
        left: 3px;
        right: 3px;
        border-radius: 8px;
        padding: 6px 8px;
        text-align: left;
        overflow: hidden;
        background: var(--fucsia-claro);
        border-left: 3px solid var(--fucsia);
        color: var(--fucsia-hondo);
        transition:
          transform 0.14s,
          box-shadow 0.14s;
      }
      .cita:hover {
        transform: translateY(-1px);
        box-shadow: 0 8px 18px -8px rgba(42, 10, 28, 0.4);
        z-index: 5;
      }
      .cita b {
        display: block;
        font-size: 12.5px;
        font-weight: 700;
        line-height: 1.25;
      }
      .cita span {
        display: block;
        font-size: 11.5px;
        opacity: 0.8;
        line-height: 1.3;
      }
      .cita .hora-cita {
        opacity: 0.62;
        font-weight: 600;
      }
      .cita.finalizada {
        background: #e4f4ec;
        border-left-color: var(--verde);
        color: #0f6b49;
      }
      .cita.ausente {
        background: #fdf3e3;
        border-left-color: var(--ambar);
        color: #7a4d06;
      }

      .ahora {
        position: absolute;
        left: 0;
        right: 0;
        height: 0;
        z-index: 12;
        pointer-events: none;
      }
      .ahora::before {
        content: "";
        position: absolute;
        left: 58px;
        right: 0;
        top: 0;
        height: 2px;
        background: var(--rojo);
      }
      .ahora span {
        position: absolute;
        left: 6px;
        top: -9px;
        font-size: 10.5px;
        font-weight: 700;
        color: #fff;
        background: var(--rojo);
        padding: 1px 5px;
        border-radius: 4px;
      }

      .leyenda {
        display: flex;
        gap: 16px;
        margin-top: 12px;
        font-size: 12.5px;
        color: var(--ciruela-2);
      }
      .leyenda i {
        width: 9px;
        height: 9px;
        border-radius: 3px;
        display: inline-block;
        margin-right: 5px;
      }
      .leyenda .c1 {
        background: var(--fucsia);
      }
      .leyenda .c2 {
        background: var(--verde);
      }
      .leyenda .c3 {
        background: var(--ambar);
      }

      .velo {
        position: fixed;
        inset: 0;
        background: rgba(42, 10, 28, 0.4);
        z-index: 150;
      }
      .hoja {
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        width: min(400px, 92vw);
        z-index: 160;
        background: var(--papel);
        box-shadow: -12px 0 40px rgba(42, 10, 28, 0.24);
        display: flex;
        flex-direction: column;
      }
      .hoja-tapa {
        padding: 16px 18px;
        border-bottom: 1px solid var(--borde);
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .hoja-tapa b {
        font-size: 17px;
        font-weight: 800;
      }
      .cerrar {
        margin-left: auto;
        width: 30px;
        height: 30px;
        border-radius: 8px;
        color: var(--ciruela-2);
      }
      .cerrar:hover {
        background: var(--fondo);
      }
      .hoja-cuerpo {
        padding: 16px 18px;
        overflow-y: auto;
        flex: 1;
      }
      .hoja-pie {
        padding: 14px 18px;
        border-top: 1px solid var(--borde);
        display: flex;
        gap: 8px;
      }
      .hoja-pie .b-fucsia {
        flex: 1;
      }

      .cupos {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(108px, 1fr));
        gap: 7px;
      }
      .cupo {
        border: 1.5px solid var(--borde);
        border-radius: 10px;
        padding: 8px;
        text-align: left;
        background: var(--papel);
      }
      .cupo:hover {
        border-color: var(--fucsia);
      }
      .cupo.elegido {
        border-color: var(--fucsia);
        background: var(--fucsia-claro);
      }
      .cupo b {
        display: block;
        font-size: 14px;
      }
      .cupo span {
        font-size: 12px;
        color: var(--ciruela-3);
      }

      .ayuda {
        font-size: 13px;
        color: var(--ciruela-3);
        margin-top: 6px;
      }
      .detalle-linea {
        margin-bottom: 9px;
        font-size: 15px;
      }
      .nombre-grande {
        font-size: 19px;
        font-weight: 800;
        letter-spacing: -0.02em;
        margin-bottom: 4px;
      }
      .tel {
        color: var(--wa);
        text-decoration: none;
        font-weight: 600;
      }
      .tel:hover {
        text-decoration: underline;
      }
      .acciones-cita {
        display: grid;
        gap: 8px;
        margin-top: 18px;
      }

      @media (max-width: 820px) {
        .barra {
          gap: 10px;
          padding: 12px 14px;
        }
        .fecha {
          width: 100%;
          order: -1;
        }
        .fecha b {
          font-size: 16px;
          min-width: auto;
          flex: 1;
          text-align: center;
        }
        .barra .boton {
          flex: 1;
          justify-content: center;
        }
        .tira {
          padding: 0 14px 12px;
        }
        .contenido {
          padding: 0 14px 80px;
        }

        /* Columnas más angostas y sin sombra pesada */
        .col-cabeza,
        .columna {
          flex: 0 0 132px;
          min-width: 132px;
        }
        .col-cabeza b {
          font-size: 12.5px;
        }
        .hora {
          font-size: 10.5px;
        }
        .grilla {
          border-radius: 12px;
        }

        /* La hoja lateral pasa a ser una hoja de abajo */
        .hoja {
          top: auto;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100%;
          max-height: 88vh;
          border-radius: 20px 20px 0 0;
          box-shadow: 0 -12px 40px rgba(42, 10, 28, 0.28);
        }
        .cupos {
          grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
        }
      }

      @media (max-width: 480px) {
        .lienzo {
          padding: 0;
        }
        .contenido {
          padding: 0 10px 80px;
        }
        .tira {
          padding: 0 10px 10px;
        }
      }
      .mover {
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid var(--borde);
      }
      .etiqueta-cupos {
        display: block;
        font-size: 13px;
        font-weight: 600;
        color: var(--ciruela-2);
        margin-bottom: 6px;
      }
      .dos-horas {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
    `,
  ],
})
export class AgendaComponent implements OnDestroy {
  private api = inject(ApiService);

  /**
   * El panel se refresca solo cada 30 segundos.
   *
   * Sin esto, si el bot agenda una cita mientras el dueño tiene la agenda
   * abierta, él no se entera hasta que recargue la página. Con un salón de
   * ocho personas y clientas escribiendo a toda hora, eso se nota el primer día.
   */
  private reloj?: ReturnType<typeof setInterval>;
  nuevas = signal(0);
  private idsConocidos = new Set<number>();

  /** El dueño no está mirando la pantalla todo el día: el sonido lo avisa. */
  sonido = signal(localStorage.getItem("cupo.sonido") !== "no");
  private audio?: AudioContext;

  alternarSonido() {
    const nuevo = !this.sonido();
    this.sonido.set(nuevo);
    localStorage.setItem("cupo.sonido", nuevo ? "si" : "no");
    if (nuevo) this.sonar(); // así comprueba que se oye
  }

  /**
   * Un timbre corto generado en el navegador, sin archivos de audio.
   * Dos notas ascendentes: suena a aviso, no a alarma.
   */
  private sonar() {
    if (!this.sonido()) return;

    try {
      this.audio ??= new AudioContext();
      const ctx = this.audio;

      // Los navegadores suspenden el audio hasta que el usuario interactúa
      if (ctx.state === "suspended") ctx.resume();

      [880, 1174].forEach((frecuencia, i) => {
        const osc = ctx.createOscillator();
        const vol = ctx.createGain();

        osc.type = "sine";
        osc.frequency.value = frecuencia;

        const inicio = ctx.currentTime + i * 0.13;
        vol.gain.setValueAtTime(0, inicio);
        vol.gain.linearRampToValueAtTime(0.18, inicio + 0.01);
        vol.gain.exponentialRampToValueAtTime(0.001, inicio + 0.3);

        osc.connect(vol).connect(ctx.destination);
        osc.start(inicio);
        osc.stop(inicio + 0.32);
      });
    } catch {
      // Si el navegador no deja, no pasa nada: queda el aviso en pantalla
    }
  }

  /** El título de la pestaña avisa aunque el dueño esté en otra ventana. */
  private actualizarTitulo() {
    const n = this.nuevas();
    document.title = n > 0 ? `(${n}) Cupo — Agenda` : "Cupo";
  }

  horas = Array.from(
    { length: FIN_DIA - INICIO_DIA },
    (_, i) => INICIO_DIA + i,
  );
  ahora = new Date();

  fecha = signal(new Date());
  profesionales = signal<Profesional[]>([]);
  servicios = signal<Servicio[]>([]);
  citas = signal<Cita[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);

  panel = signal<"nueva" | "cita" | "permiso" | null>(null);

  permisoProfesional: number | null = null;
  permisoTipo: "BLOQUEO" | "AUSENCIA" | "CAMBIO_HORARIO" = "BLOQUEO";
  permisoDesde = "12:00";
  permisoHasta = "14:00";
  permisoMotivo = "";
  citaAbierta = signal<Cita | null>(null);

  servicioElegido: number | null = null;
  cupos = signal<Cupo[]>([]);
  cupoElegido: Cupo | null = null;
  buscandoCupos = signal(false);
  guardando = signal(false);
  nombreCliente = "";
  telefonoCliente = "";

  /** En celular no caben cinco columnas: se puede ver una sola. */
  soloProfesional = signal<number | null>(null);

  visibles = computed(() => {
    const id = this.soloProfesional();
    return id === null
      ? this.profesionales()
      : this.profesionales().filter((p) => p.id === id);
  });

  alternar(id: number) {
    this.soloProfesional.set(this.soloProfesional() === id ? null : id);
  }

  esHoy = computed(
    () => this.fecha().toDateString() === new Date().toDateString(),
  );

  /** "Miércoles 9 de septiembre": solo la primera letra en mayúscula. */
  titulo = computed(() => {
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
    document.title = "Cupo";
    this.audio?.close();
  }

  /**
   * Vuelve a pedir las citas sin mostrar el «Cargando…» ni cerrar el panel
   * que el dueño tenga abierto. Si aparecieron citas que no estaban, avisa.
   */
  private refrescarEnSilencio() {
    // Si está agendando o mirando una cita, no se le mueve la pantalla debajo
    if (this.panel() !== null) return;

    this.api.citasDelDia(this.iso(this.fecha())).subscribe({
      next: (citas) => {
        const llegaron = citas.filter(
          (c) => !this.idsConocidos.has(c.id) && c.estado !== "CANCELADA",
        ).length;

        if (llegaron > 0 && this.idsConocidos.size > 0) {
          this.nuevas.update((n) => n + llegaron);
          this.sonar();
          this.actualizarTitulo();
        }

        citas.forEach((c) => this.idsConocidos.add(c.id));
        this.citas.set(citas);
      },
      error: () => {
        /* si falla una pasada, se reintenta en la siguiente */
      },
    });
  }

  verNuevas() {
    this.nuevas.set(0);
    this.actualizarTitulo();
    this.cargar();
  }

  /**
   * La fecha en local. Con toISOString, un día a las 7 p.m. en Bogotá
   * se convierte en el día siguiente y la agenda muestra otro día.
   */
  private iso(f: Date) {
    return (
      `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}` +
      `-${String(f.getDate()).padStart(2, "0")}`
    );
  }

  cargar() {
    this.cargando.set(true);
    this.error.set(null);

    forkJoin({
      profesionales: this.api.profesionales(),
      servicios: this.api.servicios(),
      citas: this.api.citasDelDia(this.iso(this.fecha())),
    }).subscribe({
      next: (r) => {
        this.profesionales.set(r.profesionales);
        this.servicios.set(r.servicios);
        this.citas.set(r.citas);

        // Se guarda qué citas ya se vieron, para detectar las que entren después
        this.idsConocidos = new Set(r.citas.map((c) => c.id));
        this.nuevas.set(0);
        this.actualizarTitulo();
        this.cargando.set(false);
      },
      error: () => {
        this.error.set("No se pudo cargar la agenda. Revise su conexión.");
        this.cargando.set(false);
      },
    });
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

  citasDe(profesionalId: number) {
    return this.citas().filter(
      (c) => c.profesionalId === profesionalId && c.estado !== "CANCELADA",
    );
  }

  // ---------------- Posición en la grilla ----------------

  private minutosDesdeInicio(iso: string) {
    const f = new Date(iso);
    return (f.getHours() - INICIO_DIA) * 60 + f.getMinutes();
  }

  tope(iso: string) {
    return (this.minutosDesdeInicio(iso) / 60) * ALTO_HORA;
  }

  alto(inicio: string, fin: string) {
    const minutos =
      (new Date(fin).getTime() - new Date(inicio).getTime()) / 60000;
    return Math.max((minutos / 60) * ALTO_HORA, 26);
  }

  topeAhora() {
    const f = new Date();
    return (
      (((f.getHours() - INICIO_DIA) * 60 + f.getMinutes()) / 60) * ALTO_HORA
    );
  }

  etiquetaHora(h: number) {
    const suf = h >= 12 ? "p.m." : "a.m.";
    const hh = h % 12 === 0 ? 12 : h % 12;
    return `${hh} ${suf}`;
  }

  // ---------------- Ayudas ----------------

  iniciales(nombre: string) {
    return nombre.slice(0, 2).toUpperCase();
  }

  color(p: Profesional) {
    return p.color || "#FF1F6D";
  }

  nombreServicio(id: number) {
    return this.servicios().find((s) => s.id === id)?.nombre ?? "Servicio";
  }

  nombreProfesional(id: number) {
    return this.profesionales().find((p) => p.id === id)?.nombre ?? "";
  }

  claseEstado(estado: string) {
    return (
      {
        CONFIRMADA: "p-confirmada",
        FINALIZADA: "p-finalizada",
        CANCELADA: "p-cancelada",
        NO_ASISTIO: "p-ausente",
      }[estado] ?? ""
    );
  }

  etiquetaEstado(estado: string) {
    return (
      {
        CONFIRMADA: "Confirmada",
        FINALIZADA: "Finalizada",
        CANCELADA: "Cancelada",
        NO_ASISTIO: "No llegó",
      }[estado] ?? estado
    );
  }

  // ---------------- Panel ----------------

  moviendo = signal(false);
  diaNuevo = "";

  /** Abre el cambio de día u hora sobre una cita existente. */
  abrirMover(c: Cita) {
    this.servicioElegido = c.servicioId;
    this.diaNuevo = this.iso(new Date(c.inicio));
    this.cupoElegido = null;
    this.cupos.set([]);
    this.moviendo.set(true);
    this.buscarCuposMover(c);
  }

  buscarCuposMover(c: Cita) {
    if (!this.diaNuevo) return;
    this.cupoElegido = null;
    this.buscandoCupos.set(true);

    this.api.cupos(c.servicioId, this.diaNuevo).subscribe({
      next: (r) => {
        this.cupos.set(r);
        this.buscandoCupos.set(false);
      },
      error: () => {
        this.cupos.set([]);
        this.buscandoCupos.set(false);
      },
    });
  }

  confirmarMover(c: Cita) {
    if (!this.cupoElegido) return;
    this.guardando.set(true);

    this.api
      .reprogramar(
        c.id,
        this.cupoElegido.profesionalId,
        this.cupoElegido.inicio,
      )
      .subscribe({
        next: () => {
          this.guardando.set(false);
          this.moviendo.set(false);
          this.cerrarPanel();
          this.cargar();
        },
        error: (err) => {
          this.guardando.set(false);
          this.error.set(
            err?.error?.mensaje ?? "Ese horario se acaba de ocupar.",
          );
          this.buscarCuposMover(c);
        },
      });
  }

  abrirNueva() {
    this.servicioElegido = null;
    this.cupoElegido = null;
    this.cupos.set([]);
    this.nombreCliente = "";
    this.telefonoCliente = "";
    this.panel.set("nueva");
  }

  verCita(c: Cita) {
    this.citaAbierta.set(c);
    this.panel.set("cita");
  }

  abrirPermiso() {
    this.permisoProfesional = null;
    this.permisoTipo = "BLOQUEO";
    this.permisoMotivo = "";
    this.panel.set("permiso");
  }

  /** Sella la agenda: esas horas dejan de ofrecerse en todos lados. */
  guardarPermiso() {
    if (!this.permisoProfesional) return;
    this.guardando.set(true);

    this.api
      .sellar(this.permisoProfesional, {
        fecha: this.iso(this.fecha()),
        tipo: this.permisoTipo,
        horaInicio: this.permisoTipo === "AUSENCIA" ? null : this.permisoDesde,
        horaFin: this.permisoTipo === "AUSENCIA" ? null : this.permisoHasta,
        motivo: this.permisoMotivo || undefined,
      })
      .subscribe({
        next: () => {
          this.guardando.set(false);
          this.cerrarPanel();
          this.cargar();
        },
        error: (err) => {
          this.guardando.set(false);
          this.error.set(err?.error?.mensaje ?? "No se pudo sellar.");
        },
      });
  }

  cerrarPanel() {
    this.panel.set(null);
    this.citaAbierta.set(null);
    this.moviendo.set(false);
  }

  buscarCupos() {
    if (!this.servicioElegido) return;
    this.cupoElegido = null;
    this.buscandoCupos.set(true);

    this.api.cupos(this.servicioElegido, this.iso(this.fecha())).subscribe({
      next: (c) => {
        this.cupos.set(c);
        this.buscandoCupos.set(false);
      },
      error: () => {
        this.cupos.set([]);
        this.buscandoCupos.set(false);
      },
    });
  }

  guardar() {
    if (!this.cupoElegido || !this.servicioElegido) return;
    this.guardando.set(true);

    this.api
      .crearCita({
        servicioId: this.servicioElegido,
        profesionalId: this.cupoElegido.profesionalId,
        inicio: this.cupoElegido.inicio,
        nombreCliente: this.nombreCliente || undefined,
        telefonoCliente: this.telefonoCliente || undefined,
      })
      .subscribe({
        next: () => {
          this.guardando.set(false);
          this.cerrarPanel();
          this.cargar();
        },
        error: () => {
          this.guardando.set(false);
          this.error.set("Ese horario se acaba de ocupar. Escoja otro.");
          this.buscarCupos();
        },
      });
  }

  marcar(c: Cita, estado: "FINALIZADA" | "CANCELADA" | "NO_ASISTIO") {
    this.api.cambiarEstado(c.id, estado).subscribe({
      next: () => {
        this.cerrarPanel();
        this.cargar();
      },
      error: () => this.error.set("No se pudo actualizar la cita."),
    });
  }
}
