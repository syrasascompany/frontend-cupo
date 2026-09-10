import { Component, HostListener, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { AuthService } from "../core/auth.service";

/**
 * La página pública de Cupo. Vive en la raíz del mismo despliegue que el
 * panel: un solo proyecto, un solo servidor. El botón «Entrar» lleva a
 * /entrar y de ahí cada quien cae en su pantalla según su rol.
 */
@Component({
  selector: "cupo-landing",
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <header class="tapa" [class.pegada]="pegada">
      <div class="envoltura">
        <a class="logo" href="#">
          <svg viewBox="0 0 200 200" aria-hidden="true">
            <rect width="200" height="200" rx="46" fill="#FF1F6D" />
            <g fill="#fff">
              <rect
                x="46"
                y="46"
                width="108"
                height="22"
                rx="11"
                opacity=".42"
              />
              <rect
                x="46"
                y="80"
                width="108"
                height="22"
                rx="11"
                opacity=".42"
              />
              <rect
                x="46"
                y="148"
                width="108"
                height="22"
                rx="11"
                opacity=".42"
              />
            </g>
            <rect
              x="46"
              y="114"
              width="108"
              height="22"
              rx="11"
              fill="none"
              stroke="#fff"
              stroke-width="3.4"
              stroke-dasharray="9 7"
            />
          </svg>
          <b>Cupo</b>
        </a>
        <nav class="menu">
          <a href="#como">Cómo funciona</a>
          <a href="#agenda">La agenda</a>
          <a href="#planes">Planes</a>
          <a href="#preguntas">Preguntas</a>
        </nav>
        <button class="boton b-ciruela" (click)="abrir()">Entrar</button>
      </div>
    </header>

    <main>
      <section class="portada">
        <div class="envoltura">
          <div class="bloque-portada">
            <div class="portada-rejilla">
              <div>
                <h1>Su agenda no se cruza nunca más</h1>
                <p class="entrada">
                  Sus clientas reservan por el WhatsApp de siempre. Usted ve
                  todo el salón desde el celular, esté donde esté.
                </p>
                <div class="acciones">
                  <a class="boton b-blanco" href="#planes"
                    >Probar un mes gratis</a
                  >
                  <a class="boton b-fantasma" href="#como">Ver cómo funciona</a>
                </div>
                <p class="bajo">
                  Le cargamos sus servicios y horarios sin costo. Sin
                  permanencia.
                </p>
              </div>

              <div class="telefono" aria-hidden="true">
                <span class="hora-chat">11:04 p.m.</span>
                <div class="burbuja ellos">
                  Hola 🙋‍♀️ ¿tienen campo mañana para semipermanente?
                </div>
                <div class="burbuja yo">
                  ¡Hola! Mañana tenemos estos horarios 👇
                </div>
                <div class="opciones">
                  <div class="opcion">9:00 a.m. <span>Con Ana</span></div>
                  <div class="opcion">
                    10:30 a.m. <span>Con Katherine</span>
                  </div>
                  <div class="opcion">2:15 p.m. <span>Con Ana</span></div>
                </div>
                <div class="burbuja ellos">La de 10:30 porfa</div>
                <div class="burbuja yo">
                  Lista ✅<br />Miércoles 9, 10:30 a.m.<br />Con Katherine
                  <small>11:05 p.m.</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="cifras">
        <div class="envoltura cifras-rejilla">
          <div class="cifra">
            <b>2 horas al día</b>
            <span
              >contestando «¿hay campo mañana?» una y otra vez, incluso de
              noche.</span
            >
          </div>
          <div class="cifra">
            <b>El cupo que se cae</b>
            <span
              >queda vacío porque no hay tiempo de avisarle a quien estaba
              esperando.</span
            >
          </div>
          <div class="cifra">
            <b>Dos citas a la vez</b>
            <span
              >y una clienta a la que toca cancelarle veinte minutos
              antes.</span
            >
          </div>
        </div>
      </section>

      <section class="seccion" id="como">
        <div class="envoltura">
          <div class="cabeza">
            <h2>Una sola agenda para todo el salón</h2>
            <p>
              No importa si la cita entró por WhatsApp, por teléfono o en
              persona: termina en el mismo lugar y el cupo se bloquea al
              instante.
            </p>
          </div>

          <div class="pasos">
            <div class="paso">
              <span class="num">1</span>
              <h3>La clienta escribe</h3>
              <p>
                Al mismo número de siempre. No descarga nada ni crea cuentas.
              </p>
            </div>
            <div class="paso">
              <span class="num">2</span>
              <h3>Ve los horarios reales</h3>
              <p>
                Solo los que están libres de verdad, según el servicio y quién
                lo hace.
              </p>
            </div>
            <div class="paso">
              <span class="num">3</span>
              <h3>El cupo se bloquea</h3>
              <p>
                Al instante. Nadie más lo toma, ni por chat ni desde el
                mostrador.
              </p>
            </div>
            <div class="paso">
              <span class="num">4</span>
              <h3>Usted lo ve todo</h3>
              <p>
                La agenda del día completa, desde el celular, aunque esté fuera
                del local.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section class="seccion" id="agenda" style="padding-top:0">
        <div class="envoltura">
          <div class="agenda-bloque">
            <div>
              <h2>Quién tiene hueco a las 3, sin preguntarle a nadie</h2>
              <p>
                Cada persona con su horario, sus servicios y su propio ritmo. Si
                una se demora más en las acrílicas, la agenda ya lo sabe.
              </p>
              <p>
                Y cuando alguien pide permiso, usted le sella el día en dos
                toques.
              </p>
            </div>

            <div class="maqueta" aria-hidden="true">
              <div class="mq-tapa">
                <i></i><i></i><i></i><span>Martes 8 de septiembre</span>
              </div>
              <div class="mq-cuerpo">
                <div class="mq-horas">
                  <div class="mq-cabeza" style="border-right:0"></div>
                  @for (h of horas; track h) {
                    <div class="mq-hora">{{ h }}</div>
                  }
                </div>
                @for (c of chicas; track c.nombre; let i = $index) {
                  <div class="mq-col">
                    <div class="mq-cabeza">
                      <span class="mq-punto" [style.background]="c.color"></span
                      >{{ c.nombre }}
                    </div>
                    @for (h of horas; track h) {
                      <div class="mq-franja"></div>
                    }
                    @for (x of citasDe(i); track x.cliente) {
                      <div
                        class="mq-cita"
                        [class.hecha]="x.hecha"
                        [style.top.px]="x.top + 34"
                        [style.height.px]="x.alto - 4"
                      >
                        <b>{{ x.cliente }}</b
                        >{{ x.serv }}
                      </div>
                    }
                    @for (l of libresDe(i); track l.top) {
                      <div
                        class="mq-libre"
                        [style.top.px]="l.top + 36"
                        [style.height.px]="l.alto"
                      >
                        Libre
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="seccion" id="planes" style="padding-top:0">
        <div class="envoltura">
          <div class="planes">
            <div class="cabeza">
              <h2>Planes según su equipo</h2>
              <p>
                El primer mes va sin costo y con la configuración incluida. Sin
                cláusula de permanencia.
              </p>
            </div>

            <div class="planes-rejilla">
              <div class="plan">
                <h3>Esencial</h3>
                <p class="para">Para quien trabaja sola o con una ayudante</p>
                <div class="precio">$79.900 <small>al mes</small></div>
                <ul>
                  <li><b>·</b>Hasta 2 personas</li>
                  <li><b>·</b>Agenda compartida en el celular</li>
                  <li><b>·</b>Reservas por WhatsApp</li>
                  <li><b>·</b>Confirmaciones y recordatorios</li>
                  <li><b>·</b>Lista de espera</li>
                </ul>
                <a class="boton b-linea" href="#contacto">Empezar</a>
              </div>

              <div class="plan top">
                <span class="sello">El más pedido</span>
                <h3>Salón</h3>
                <p class="para">Para salones con equipo y varios servicios</p>
                <div class="precio">
                  $149.900
                  <small style="color:rgba(255,255,255,.75)">al mes</small>
                </div>
                <ul>
                  <li><b>·</b>Hasta 6 personas</li>
                  <li><b>·</b>Todo lo del plan Esencial</li>
                  <li><b>·</b>Cada persona ve su día en su celular</li>
                  <li><b>·</b>Reprogramación automática</li>
                  <li><b>·</b>Reportes de ocupación y ausencias</li>
                  <li><b>·</b>Historial de clientas</li>
                </ul>
                <a class="boton b-blanco" href="#contacto">Empezar</a>
              </div>

              <div class="plan">
                <h3>Spa</h3>
                <p class="para">Para spas grandes y varias sedes</p>
                <div class="precio">$249.900 <small>al mes</small></div>
                <ul>
                  <li><b>·</b>Hasta 12 personas</li>
                  <li><b>·</b>Todo lo del plan Salón</li>
                  <li><b>·</b>Reasignar citas cuando alguien falta</li>
                  <li><b>·</b>Varias sedes</li>
                  <li><b>·</b>Comisiones por persona</li>
                  <li><b>·</b>Soporte prioritario</li>
                </ul>
                <a class="boton b-linea" href="#contacto">Empezar</a>
              </div>
            </div>

            <div class="puesta">
              <b>La puesta en marcha</b>
              <p>
                Antes de que usted toque nada, nosotros dejamos el sistema
                listo: cargamos sus servicios con sus precios y sus tiempos, el
                horario de cada persona, creamos los accesos del equipo y los
                acompañamos toda la primera semana.
              </p>
              <p>
                Es un único pago al inicio, desde $150.000 según el tamaño del
                equipo.
                <span class="destacado"
                  >Durante el mes de prueba no se cobra.</span
                >
              </p>
            </div>

            <div class="referidos">
              <div class="referidos-texto">
                <b>Programa de recomendación</b>
                <p>
                  Si otro negocio contrata Cupo por recomendación suya, se le
                  obsequia un mes de servicio. Aplica por cada negocio que
                  permanezca activo, sin límite de recomendaciones.
                </p>
              </div>
              <span class="referidos-sello"
                >1 mes<small>de cortesía</small></span
              >
            </div>
          </div>
        </div>
      </section>

      <section class="seccion" id="preguntas" style="padding-top:0">
        <div class="envoltura" style="max-width:880px">
          <div class="cabeza"><h2>Lo que siempre preguntan</h2></div>

          <details class="pregunta" open>
            <summary>¿Mis clientas tienen que descargar algo?</summary>
            <p>
              No. Escriben al mismo WhatsApp de siempre y ahí mismo reservan. No
              crean cuentas, no bajan aplicaciones, no cambian nada de lo que ya
              hacen.
            </p>
          </details>

          <details class="pregunta">
            <summary>¿Puedo seguir agendando yo directamente?</summary>
            <p>
              Sí, y es importante que lo haga. Cuando una clienta llega al local
              o lo llama, usted registra la cita desde el celular en dos toques
              y el cupo queda bloqueado igual que si lo hubiera hecho el
              sistema. Da lo mismo por dónde entró: la agenda es una sola.
            </p>
          </details>

          <details class="pregunta">
            <summary>Mis chicas no se demoran lo mismo. ¿Eso importa?</summary>
            <p>
              Importa, y mucho: es la razón más común por la que se cruzan las
              citas. Cada servicio tiene su tiempo normal, y donde alguien se
              demore distinto se ajusta solo para ella. Así el sistema nunca
              ofrece una hora que en realidad no cabe.
            </p>
          </details>

          <details class="pregunta">
            <summary>¿Qué pasa si alguien cancela?</summary>
            <p>
              El cupo se libera y Cupo le avisa por WhatsApp a las clientas que
              estaban en lista de espera, en orden de llegada. Un espacio de dos
              horas recuperado paga varios meses del plan.
            </p>
          </details>

          <details class="pregunta">
            <summary>¿Y si una de mis chicas se va?</summary>
            <p>
              Se retira del sistema y libera un puesto de su plan. Sus citas
              pasadas y sus clientas quedan en el historial, y Cupo no la deja
              retirar hasta que las citas que ya tenía agendadas queden en manos
              de otra persona.
            </p>
          </details>

          <details class="pregunta">
            <summary>¿Tengo que cambiar de número?</summary>
            <p>
              No. Se trabaja sobre el número que ya usa el negocio. Nosotros
              hacemos la conexión con WhatsApp y lo acompañamos en todo el
              proceso.
            </p>
          </details>
        </div>
      </section>

      <section class="envoltura" id="contacto">
        <div class="cierre">
          <h2>Pruébelo un mes. Si no le ordena la agenda, no siga.</h2>
          <p>
            Le cargamos sus servicios, los tiempos de cada persona y los
            horarios, y usted solo mira si le sirve.
          </p>
          <a
            class="boton b-ciruela"
            href="https://wa.me/573182747662"
            target="_blank"
            rel="noopener"
          >
            Escribirnos por WhatsApp</a
          >
        </div>
      </section>
    </main>

    <footer class="pie">
      <div class="envoltura">
        <div class="pie-rejilla">
          <div class="pie-marca">
            <div class="pie-logo">
              <svg viewBox="0 0 200 200" aria-hidden="true">
                <rect width="200" height="200" rx="46" fill="#FF1F6D" />
                <g fill="#fff">
                  <rect
                    x="46"
                    y="46"
                    width="108"
                    height="22"
                    rx="11"
                    opacity=".42"
                  />
                  <rect
                    x="46"
                    y="80"
                    width="108"
                    height="22"
                    rx="11"
                    opacity=".42"
                  />
                  <rect
                    x="46"
                    y="148"
                    width="108"
                    height="22"
                    rx="11"
                    opacity=".42"
                  />
                </g>
                <rect
                  x="46"
                  y="114"
                  width="108"
                  height="22"
                  rx="11"
                  fill="none"
                  stroke="#fff"
                  stroke-width="3.4"
                  stroke-dasharray="9 7"
                />
              </svg>
              <b>Cupo</b>
            </div>
            <p>
              La agenda de su spa, sin cruces ni cupos perdidos. Hecho en el
              Valle del Cauca.
            </p>
          </div>

          <div class="pie-columna">
            <b>El producto</b>
            <a href="#como">Cómo funciona</a>
            <a href="#agenda">La agenda</a>
            <a href="#planes">Planes y precios</a>
            <a href="#preguntas">Preguntas frecuentes</a>
          </div>

          <div class="pie-columna">
            <b>Para clientes</b>
            <button class="enlace-pie" (click)="abrir()">
              Entrar a mi agenda
            </button>
            <a routerLink="/recuperar">Olvidé mi contraseña</a>
            <a href="https://wa.me/573182747662" target="_blank" rel="noopener"
              >Soporte por WhatsApp</a
            >
          </div>

          <div class="pie-columna">
            <b>Contacto</b>
            <a href="https://wa.me/573182747662" target="_blank" rel="noopener"
              >318 274 7662</a
            >
            <a href="mailto:hola&#64;cupo.app">hola&#64;cupo.app</a>
            <span>Lun a Sáb · 8 a.m. a 7 p.m.</span>
            <a href="/privacidad.html">Política de privacidad</a>
          </div>
        </div>

        <div class="pie-abajo">
          <span>© 2026 Cupo. Todos los derechos reservados.</span>
          <span>Agenda para spas y salones de belleza</span>
        </div>
      </div>
    </footer>

    <a
      class="flotante"
      href="https://wa.me/573182747662"
      target="_blank"
      rel="noopener"
      aria-label="Escribirnos por WhatsApp"
    >
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path
          d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m0 1.67c2.2 0 4.28.86 5.84 2.42a8.2 8.2 0 0 1 2.42 5.83c0 4.54-3.7 8.24-8.25 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.25 8.24-8.25M8.53 7.33c-.16 0-.43.06-.66.31-.22.25-.87.85-.87 2.07 0 1.22.89 2.39 1 2.56.14.17 1.72 2.75 4.23 3.74 2.09.82 2.52.66 2.97.62.46-.05 1.46-.6 1.67-1.18.2-.58.2-1.07.14-1.18-.06-.1-.22-.16-.47-.28-.24-.12-1.46-.72-1.69-.8-.22-.09-.39-.13-.55.12-.16.25-.63.79-.77.95-.14.17-.28.19-.53.07-.24-.13-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.24-.02-.38.11-.5.11-.11.24-.29.37-.44.12-.14.16-.25.24-.41.08-.17.04-.31-.02-.44-.06-.12-.53-1.35-.75-1.84-.17-.38-.35-.4-.5-.4-.13 0-.28-.01-.42-.01"
        />
      </svg>
    </a>

    @if (abierto()) {
      <div class="velo-login" (click)="cerrar()"></div>

      <div
        class="modal-login"
        role="dialog"
        aria-modal="true"
        aria-label="Entrar a Cupo"
      >
        <button class="cerrar-login" (click)="cerrar()" aria-label="Cerrar">
          ✕
        </button>

        <div class="login-marca">
          <svg viewBox="0 0 200 200" aria-hidden="true">
            <rect width="200" height="200" rx="46" fill="#FF1F6D" />
            <g fill="#fff">
              <rect
                x="46"
                y="46"
                width="108"
                height="22"
                rx="11"
                opacity=".42"
              />
              <rect
                x="46"
                y="80"
                width="108"
                height="22"
                rx="11"
                opacity=".42"
              />
              <rect
                x="46"
                y="148"
                width="108"
                height="22"
                rx="11"
                opacity=".42"
              />
            </g>
            <rect
              x="46"
              y="114"
              width="108"
              height="22"
              rx="11"
              fill="none"
              stroke="#fff"
              stroke-width="3.4"
              stroke-dasharray="9 7"
            />
          </svg>
          <b>Cupo</b>
        </div>

        <h2 class="login-titulo">Entre a su agenda</h2>

        @if (errorLogin()) {
          <div class="login-error">{{ errorLogin() }}</div>
        }

        <div class="login-campo">
          <label for="lg-usuario">Correo o cédula</label>
          <input
            id="lg-usuario"
            [(ngModel)]="usuario"
            autocomplete="username"
            placeholder="correo@ejemplo.com o 1094..."
            (keyup.enter)="entrar()"
          />
          <small>Las manicuristas entran con su número de cédula.</small>
        </div>

        <div class="login-campo">
          <label for="lg-clave">Contraseña</label>
          <input
            id="lg-clave"
            type="password"
            [(ngModel)]="clave"
            autocomplete="current-password"
            (keyup.enter)="entrar()"
          />
        </div>

        <button
          class="boton b-fucsia login-boton"
          (click)="entrar()"
          [disabled]="entrando()"
        >
          {{ entrando() ? "Entrando…" : "Entrar" }}
        </button>

        <a class="login-olvide" routerLink="/recuperar">Olvidé mi contraseña</a>
      </div>
    }
  `,
  styles: [
    `
      :host {
        --fucsia: #ff1f6d;
        --fucsia-hondo: #d6004e;
        --mandarina: #ff7a1a;
        --ciruela: #2a0a1c;
        --lila: #ffe8f0;
        --crema: #fff5ef;
        --papel: #ffffff;
        --gris: #7a6a72;
        --wa: #1fa855;

        --fuente: "Archivo", system-ui, sans-serif;
        --curva: cubic-bezier(0.16, 1, 0.3, 1);
      }
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      html {
        scroll-behavior: smooth;
      }
      body {
        font-family: var(--fuente);
        background: var(--crema);
        color: var(--ciruela);
        font-size: 16px;
        line-height: 1.5;
        -webkit-font-smoothing: antialiased;
        overflow-x: hidden;
      }
      a,
      button {
        font: inherit;
      }
      .envoltura {
        width: min(1180px, 90vw);
        margin-inline: auto;
      }

      h1,
      h2,
      h3 {
        font-weight: 900;
        line-height: 0.94;
        letter-spacing: -0.045em;
      }

      .boton {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 9px;
        padding: 15px 26px;
        border-radius: 999px;
        text-decoration: none;
        font-size: 16px;
        font-weight: 600;
        border: 2px solid transparent;
        transition:
          transform 0.22s var(--curva),
          background 0.22s,
          color 0.22s,
          box-shadow 0.22s;
      }
      .boton:hover {
        transform: translateY(-2px);
      }
      .b-fucsia {
        background: var(--fucsia);
        color: #fff;
        box-shadow: 0 10px 0 -2px var(--fucsia-hondo);
      }
      .b-fucsia:hover {
        box-shadow: 0 14px 0 -2px var(--fucsia-hondo);
      }
      .b-ciruela {
        background: var(--ciruela);
        color: #fff;
      }
      .b-ciruela:hover {
        background: #45102d;
      }
      .b-linea {
        border-color: var(--ciruela);
        color: var(--ciruela);
      }
      .b-linea:hover {
        background: var(--ciruela);
        color: #fff;
      }
      .b-blanco {
        background: #fff;
        color: var(--ciruela);
      }
      .b-fantasma {
        background: transparent;
        border-color: rgba(255, 255, 255, 0.65);
        color: #fff;
      }
      .b-fantasma:hover {
        background: #fff;
        border-color: #fff;
        color: var(--fucsia);
      }
      .b-wa {
        background: var(--wa);
        color: #fff;
      }

      /* ---------------- Encabezado ---------------- */
      .tapa {
        position: sticky;
        top: 0;
        z-index: 80;
        background: var(--crema);
        transition: box-shadow 0.3s;
      }
      .tapa.pegada {
        box-shadow: 0 2px 20px rgba(42, 10, 28, 0.09);
      }
      .tapa .envoltura {
        display: flex;
        align-items: center;
        gap: 26px;
        padding: 14px 0;
      }
      .logo {
        display: flex;
        align-items: center;
        gap: 10px;
        text-decoration: none;
        color: inherit;
        margin-right: auto;
      }
      .logo svg {
        width: 38px;
        height: 38px;
      }
      .logo b {
        font-size: 26px;
        font-weight: 900;
        letter-spacing: -0.06em;
      }
      .menu {
        display: flex;
        gap: 26px;
      }
      .menu a {
        color: var(--ciruela);
        text-decoration: none;
        font-size: 15.5px;
        font-weight: 500;
        opacity: 0.72;
      }
      .menu a:hover {
        opacity: 1;
        color: var(--fucsia);
      }

      /* ---------------- Portada ---------------- */
      .portada {
        padding: clamp(28px, 5vw, 52px) 0 clamp(40px, 6vw, 70px);
      }
      .bloque-portada {
        background: var(--fucsia);
        border-radius: 34px;
        padding: clamp(30px, 4.6vw, 58px);
        color: #fff;
        position: relative;
        overflow: hidden;
      }
      .bloque-portada::after {
        content: "";
        position: absolute;
        right: -90px;
        bottom: -140px;
        width: 420px;
        height: 420px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.09);
      }
      .portada-rejilla {
        display: grid;
        grid-template-columns: 1.08fr 0.92fr;
        gap: clamp(26px, 4vw, 52px);
        align-items: center;
        position: relative;
        z-index: 1;
      }
      .portada h1 {
        font-size: clamp(42px, 7vw, 86px);
        margin-bottom: 20px;
      }
      .portada .entrada {
        font-size: clamp(17px, 1.9vw, 20px);
        opacity: 0.9;
        max-width: 40ch;
        margin-bottom: 28px;
        font-weight: 400;
      }
      .portada .acciones {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        margin-bottom: 16px;
      }
      .portada .bajo {
        font-size: 14.5px;
        opacity: 0.75;
      }

      /* Chat como protagonista */
      .telefono {
        background: #f3eae3;
        border-radius: 26px;
        padding: 16px 14px;
        box-shadow: 0 30px 60px -22px rgba(42, 10, 28, 0.55);
        transform: rotate(1.6deg);
      }
      .burbuja {
        max-width: 88%;
        padding: 9px 12px;
        border-radius: 14px;
        font-size: 14.5px;
        margin-bottom: 9px;
        line-height: 1.4;
        box-shadow: 0 1px 1px rgba(0, 0, 0, 0.07);
        color: var(--ciruela);
      }
      .burbuja.ellos {
        background: #fff;
        border-top-left-radius: 4px;
      }
      .burbuja.yo {
        background: #d9fbc6;
        margin-left: auto;
        border-top-right-radius: 4px;
      }
      .burbuja small {
        display: block;
        font-size: 11px;
        opacity: 0.5;
        margin-top: 3px;
        text-align: right;
      }
      .opciones {
        background: #fff;
        border-radius: 14px;
        padding: 5px;
        margin-bottom: 9px;
        max-width: 88%;
      }
      .opcion {
        padding: 9px 11px;
        font-size: 14px;
        border-bottom: 1px solid #f0eaec;
        display: flex;
        justify-content: space-between;
        gap: 10px;
        color: var(--ciruela);
      }
      .opcion:last-child {
        border-bottom: 0;
      }
      .opcion span {
        opacity: 0.55;
        font-size: 13px;
      }
      .hora-chat {
        display: inline-block;
        background: rgba(42, 10, 28, 0.1);
        color: var(--ciruela);
        font-size: 12px;
        font-weight: 600;
        padding: 3px 11px;
        border-radius: 999px;
        margin-bottom: 12px;
      }

      /* ---------------- Cifras ---------------- */
      .cifras {
        padding: clamp(34px, 5vw, 58px) 0;
      }
      .cifras-rejilla {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 16px;
      }
      .cifra {
        background: var(--papel);
        border-radius: 24px;
        padding: 26px;
      }
      .cifra:nth-child(2) {
        background: var(--mandarina);
        color: #fff;
      }
      .cifra:nth-child(3) {
        background: var(--ciruela);
        color: #fff;
      }
      .cifra b {
        display: block;
        font-size: clamp(30px, 3.6vw, 42px);
        font-weight: 900;
        letter-spacing: -0.04em;
        margin-bottom: 6px;
      }
      .cifra span {
        font-size: 15.5px;
        opacity: 0.78;
        font-weight: 400;
      }

      /* ---------------- Cómo funciona ---------------- */
      .seccion {
        padding: clamp(40px, 6vw, 76px) 0;
      }
      .cabeza {
        margin-bottom: 34px;
      }
      .cabeza h2 {
        font-size: clamp(32px, 5vw, 58px);
        margin-bottom: 14px;
        max-width: 16ch;
      }
      .cabeza p {
        font-size: 17.5px;
        color: var(--gris);
        max-width: 54ch;
        font-weight: 400;
      }

      .pasos {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(232px, 1fr));
        gap: 16px;
      }
      .paso {
        background: var(--papel);
        border-radius: 24px;
        padding: 26px;
        position: relative;
      }
      .paso:nth-child(2) {
        background: var(--lila);
      }
      .paso:nth-child(3) {
        background: var(--lila);
      }
      .paso .num {
        font-size: 52px;
        font-weight: 900;
        letter-spacing: -0.06em;
        color: var(--fucsia);
        line-height: 0.8;
        margin-bottom: 14px;
        display: block;
      }
      .paso h3 {
        font-size: 20px;
        margin-bottom: 8px;
        letter-spacing: -0.03em;
      }
      .paso p {
        font-size: 15.5px;
        color: var(--gris);
        font-weight: 400;
      }

      /* ---------------- Agenda ---------------- */
      .agenda-bloque {
        background: var(--ciruela);
        color: #fff;
        border-radius: 34px;
        padding: clamp(28px, 4.4vw, 54px);
        display: grid;
        grid-template-columns: 0.92fr 1.08fr;
        gap: clamp(26px, 4vw, 50px);
        align-items: center;
      }
      .agenda-bloque h2 {
        font-size: clamp(30px, 4.4vw, 50px);
        margin-bottom: 14px;
        max-width: 15ch;
      }
      .agenda-bloque p {
        color: rgba(255, 255, 255, 0.72);
        font-size: 17.5px;
        max-width: 44ch;
        font-weight: 400;
        margin-bottom: 12px;
      }

      .maqueta {
        background: #fff;
        border-radius: 18px;
        overflow: hidden;
        box-shadow: 0 26px 50px -20px rgba(0, 0, 0, 0.5);
      }
      .mq-tapa {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 11px 14px;
        border-bottom: 1px solid #f0eaec;
      }
      .mq-tapa i {
        width: 9px;
        height: 9px;
        border-radius: 50%;
        background: #e7dfe2;
      }
      .mq-tapa span {
        font-size: 12.5px;
        color: var(--gris);
        margin-left: 5px;
        font-weight: 500;
      }
      .mq-cuerpo {
        display: flex;
        height: 300px;
      }
      .mq-horas {
        width: 42px;
        flex: none;
        border-right: 1px solid #f0eaec;
      }
      .mq-hora {
        height: 50px;
        font-size: 10px;
        color: var(--gris);
        padding: 2px 6px;
        text-align: right;
        border-bottom: 1px solid #f5f0f1;
      }
      .mq-col {
        flex: 1;
        min-width: 88px;
        border-right: 1px solid #f0eaec;
        position: relative;
      }
      .mq-col:last-child {
        border-right: 0;
      }
      .mq-cabeza {
        height: 32px;
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 0 8px;
        border-bottom: 1px solid #f0eaec;
        font-size: 11.5px;
        font-weight: 600;
      }
      .mq-punto {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        flex: none;
      }
      .mq-franja {
        height: 50px;
        border-bottom: 1px solid #f5f0f1;
      }
      .mq-cita {
        position: absolute;
        left: 3px;
        right: 3px;
        border-radius: 7px;
        padding: 4px 6px;
        font-size: 10px;
        line-height: 1.25;
        overflow: hidden;
        color: #fff;
        background: var(--fucsia);
      }
      .mq-cita b {
        display: block;
        font-weight: 700;
      }
      .mq-cita.hecha {
        background: var(--mandarina);
      }
      .mq-libre {
        position: absolute;
        left: 3px;
        right: 3px;
        border-radius: 7px;
        border: 2px dashed var(--fucsia);
        color: var(--fucsia);
        font-size: 10.5px;
        font-weight: 700;
        display: grid;
        place-items: center;
        background: #fff0f5;
      }

      /* ---------------- Planes ---------------- */
      .planes {
        background: var(--lila);
        border-radius: 34px;
        padding: clamp(30px, 4.6vw, 56px);
      }
      .planes-rejilla {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(268px, 1fr));
        gap: 16px;
        align-items: stretch;
      }
      .plan {
        background: var(--papel);
        border-radius: 26px;
        padding: 28px;
        display: flex;
        flex-direction: column;
      }
      .plan.top {
        background: var(--fucsia);
        color: #fff;
        position: relative;
      }
      .plan.top .precio small,
      .plan.top li,
      .plan.top .para {
        color: rgba(255, 255, 255, 0.82);
      }
      .sello {
        position: absolute;
        top: 20px;
        right: 20px;
        background: #fff;
        color: var(--fucsia);
        font-size: 12px;
        font-weight: 700;
        padding: 5px 12px;
        border-radius: 999px;
      }
      .plan h3 {
        font-size: 24px;
        margin-bottom: 4px;
        letter-spacing: -0.035em;
      }
      .plan .para {
        font-size: 14.5px;
        color: var(--gris);
        margin-bottom: 18px;
        font-weight: 400;
      }
      .precio {
        font-size: 44px;
        font-weight: 900;
        letter-spacing: -0.05em;
        line-height: 1;
      }
      .precio small {
        font-size: 15px;
        font-weight: 400;
        color: var(--gris);
        letter-spacing: 0;
      }
      .plan ul {
        list-style: none;
        margin: 20px 0;
        display: grid;
        gap: 10px;
      }
      .plan li {
        font-size: 15px;
        color: var(--gris);
        display: flex;
        gap: 9px;
        align-items: flex-start;
        font-weight: 400;
      }
      .plan li b {
        color: var(--fucsia);
        font-weight: 900;
        flex: none;
      }
      .plan.top li b {
        color: #fff;
      }
      .plan .boton {
        margin-top: auto;
        width: 100%;
      }
      .nota {
        margin-top: 22px;
        font-size: 15px;
        color: var(--gris);
        max-width: 64ch;
        font-weight: 400;
      }

      .puesta {
        margin-top: 22px;
        background: #fff;
        border-radius: 22px;
        padding: 24px 28px;
      }
      .puesta b {
        font-size: 19px;
        font-weight: 900;
        letter-spacing: -0.03em;
        display: block;
        margin-bottom: 8px;
      }
      .puesta p {
        font-size: 15.5px;
        color: var(--gris);
        font-weight: 400;
        max-width: 62ch;
        margin-bottom: 10px;
      }
      .puesta .valor {
        color: var(--ciruela);
        margin-bottom: 0;
      }
      .puesta .valor b {
        display: inline;
        font-size: inherit;
        font-weight: 700;
        letter-spacing: 0;
      }

      .puesta {
        margin-top: 22px;
        background: #fff;
        border-radius: 20px;
        padding: 24px 28px;
      }
      .puesta b {
        display: block;
        font-size: 19px;
        font-weight: 900;
        letter-spacing: -0.03em;
        margin-bottom: 8px;
      }
      .puesta p {
        font-size: 15px;
        color: var(--gris);
        font-weight: 400;
        max-width: 70ch;
        margin-bottom: 10px;
      }
      .puesta p:last-child {
        margin-bottom: 0;
      }
      .destacado {
        color: var(--ciruela);
        font-weight: 600;
      }

      .referidos {
        margin-top: 14px;
        background: var(--ciruela);
        color: #fff;
        border-radius: 22px;
        padding: 24px 28px;
        display: flex;
        align-items: center;
        gap: 24px;
      }
      .referidos-texto b {
        display: block;
        font-size: 19px;
        font-weight: 900;
        letter-spacing: -0.03em;
        margin-bottom: 7px;
      }
      .referidos-texto p {
        font-size: 15px;
        color: rgba(255, 255, 255, 0.72);
        font-weight: 400;
        max-width: 56ch;
      }
      .referidos-sello {
        flex: none;
        background: var(--mandarina);
        color: #fff;
        border-radius: 16px;
        padding: 14px 20px;
        text-align: center;
        font-size: 22px;
        font-weight: 900;
        letter-spacing: -0.03em;
        line-height: 1;
      }
      .referidos-sello small {
        display: block;
        font-size: 11.5px;
        font-weight: 500;
        opacity: 0.92;
        letter-spacing: 0.01em;
        margin-top: 4px;
        white-space: nowrap;
      }
      @media (max-width: 640px) {
        .referidos {
          flex-direction: column;
          align-items: flex-start;
          gap: 16px;
          padding: 22px;
        }
      }

      /* ---------------- Preguntas ---------------- */
      .pregunta {
        background: var(--papel);
        border-radius: 18px;
        margin-bottom: 10px;
        overflow: hidden;
      }
      .pregunta summary {
        padding: 19px 22px;
        font-size: 17.5px;
        font-weight: 600;
        cursor: pointer;
        list-style: none;
        display: flex;
        justify-content: space-between;
        gap: 16px;
        align-items: center;
        letter-spacing: -0.02em;
      }
      .pregunta summary::-webkit-details-marker {
        display: none;
      }
      .pregunta summary::after {
        content: "+";
        font-size: 26px;
        font-weight: 400;
        color: var(--fucsia);
        flex: none;
        transition: transform 0.25s;
      }
      .pregunta[open] summary::after {
        transform: rotate(45deg);
      }
      .pregunta p {
        padding: 0 22px 20px;
        color: var(--gris);
        font-size: 16px;
        max-width: 70ch;
        font-weight: 400;
      }

      /* ---------------- Cierre ---------------- */
      .cierre {
        background: var(--mandarina);
        border-radius: 34px;
        padding: clamp(38px, 6vw, 72px);
        text-align: center;
        color: #fff;
        margin-bottom: 34px;
      }
      .cierre h2 {
        font-size: clamp(32px, 5.4vw, 62px);
        margin-bottom: 16px;
        max-width: 17ch;
        margin-inline: auto;
      }
      .cierre p {
        font-size: 18px;
        opacity: 0.9;
        max-width: 46ch;
        margin: 0 auto 28px;
        font-weight: 400;
      }

      .pie {
        padding: 44px 0 34px;
        border-top: 1px solid rgba(42, 10, 28, 0.1);
        margin-top: 20px;
      }
      .pie-rejilla {
        display: grid;
        grid-template-columns: 1.6fr 1fr 1fr 1fr;
        gap: 32px;
        margin-bottom: 32px;
      }
      .pie-logo {
        display: flex;
        align-items: center;
        gap: 9px;
        margin-bottom: 12px;
      }
      .pie-logo svg {
        width: 32px;
        height: 32px;
      }
      .pie-logo b {
        font-size: 22px;
        font-weight: 900;
        letter-spacing: -0.06em;
      }
      .pie-marca p {
        font-size: 14.5px;
        color: var(--gris);
        font-weight: 400;
        max-width: 32ch;
      }
      .pie-columna {
        display: flex;
        flex-direction: column;
        gap: 9px;
      }
      .pie-columna b {
        font-size: 14px;
        font-weight: 700;
        margin-bottom: 3px;
      }
      .pie-columna a,
      .pie-columna span {
        font-size: 14.5px;
        color: var(--gris);
        text-decoration: none;
        font-weight: 400;
      }
      .pie-columna a:hover {
        color: var(--fucsia);
      }
      .pie-abajo {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        flex-wrap: wrap;
        padding-top: 22px;
        border-top: 1px solid rgba(42, 10, 28, 0.08);
        font-size: 13.5px;
        color: var(--gris);
      }
      @media (max-width: 760px) {
        .pie-rejilla {
          grid-template-columns: 1fr 1fr;
          gap: 26px;
        }
        .pie-marca {
          grid-column: 1 / -1;
        }
      }

      .flotante {
        position: fixed;
        right: 18px;
        bottom: 18px;
        z-index: 90;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: var(--wa);
        color: #fff;
        display: grid;
        place-items: center;
        text-decoration: none;
        box-shadow: 0 12px 28px rgba(31, 168, 85, 0.42);
        transition: transform 0.25s var(--curva);
      }
      .flotante:hover {
        transform: scale(1.08);
      }
      .flotante svg {
        width: 29px;
        height: 29px;
      }

      /* ---------------- Entrar ---------------- */
      .velo-login {
        position: fixed;
        inset: 0;
        background: rgba(42, 10, 28, 0.55);
        z-index: 200;
        backdrop-filter: blur(3px);
        animation: aparecerVelo 0.25s ease both;
      }
      @keyframes aparecerVelo {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      .modal-login {
        position: fixed;
        z-index: 210;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        width: min(420px, 92vw);
        background: #fff;
        border-radius: 24px;
        padding: 32px;
        box-shadow: 0 30px 70px -20px rgba(42, 10, 28, 0.5);
        animation: entrarModal 0.32s cubic-bezier(0.16, 1, 0.3, 1) both;
      }
      @keyframes entrarModal {
        from {
          opacity: 0;
          transform: translate(-50%, -46%) scale(0.96);
        }
        to {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
        }
      }

      .cerrar-login {
        position: absolute;
        top: 14px;
        right: 14px;
        width: 32px;
        height: 32px;
        border-radius: 10px;
        color: var(--gris);
        font-size: 15px;
      }
      .cerrar-login:hover {
        background: #f5f0f2;
        color: var(--ciruela);
      }

      .login-marca {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 20px;
      }
      .login-marca svg {
        width: 38px;
        height: 38px;
      }
      .login-marca b {
        font-size: 26px;
        font-weight: 900;
        letter-spacing: -0.06em;
      }
      .login-titulo {
        font-size: 23px;
        margin-bottom: 20px;
        letter-spacing: -0.03em;
      }

      .login-error {
        background: #fdecef;
        color: #a3172f;
        border-radius: 11px;
        padding: 11px 14px;
        font-size: 14px;
        margin-bottom: 16px;
        font-weight: 400;
      }

      .login-campo {
        margin-bottom: 15px;
      }
      .login-campo label {
        display: block;
        font-size: 13.5px;
        font-weight: 600;
        margin-bottom: 6px;
      }
      .login-campo input {
        width: 100%;
        padding: 12px 14px;
        border: 1.5px solid #e7dde2;
        border-radius: 12px;
        font-size: 15.5px;
        font-family: var(--fuente);
        background: #fff;
      }
      .login-campo input:focus {
        outline: none;
        border-color: var(--fucsia);
        box-shadow: 0 0 0 3px rgba(255, 31, 109, 0.14);
      }
      .login-campo small {
        display: block;
        font-size: 12.5px;
        color: var(--gris);
        margin-top: 6px;
      }

      .login-boton {
        width: 100%;
        margin-top: 6px;
        padding: 14px;
      }
      .login-olvide {
        display: block;
        text-align: center;
        margin-top: 16px;
        font-size: 14px;
        color: var(--gris);
        text-decoration: none;
      }
      .login-olvide:hover {
        color: var(--fucsia);
      }

      .enlace-pie {
        font-size: 14.5px;
        color: var(--gris);
        text-align: left;
        padding: 0;
        font-weight: 400;
        font-family: var(--fuente);
      }
      .enlace-pie:hover {
        color: var(--fucsia);
      }

      /* En celular entra desde abajo, que es donde está el pulgar */
      @media (max-width: 560px) {
        .modal-login {
          top: auto;
          bottom: 0;
          left: 0;
          transform: none;
          width: 100%;
          border-radius: 24px 24px 0 0;
          padding: 26px 22px 32px;
          animation: subirModal 0.32s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes subirModal {
          from {
            transform: translateY(100%);
          }
          to {
            transform: none;
          }
        }
      }

      @media (prefers-reduced-motion: reduce) {
        * {
          transition: none !important;
        }
      }
      @media (max-width: 920px) {
        .portada-rejilla,
        .agenda-bloque {
          grid-template-columns: 1fr;
        }
        .menu {
          display: none;
        }
        .telefono {
          transform: none;
        }
        .mq-col:nth-child(n + 4) {
          display: none;
        }
      }
    `,
  ],
})
export class LandingComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  pegada = false;

  // ---------- Entrar sin salir de la página ----------
  abierto = signal(false);
  entrando = signal(false);
  errorLogin = signal<string | null>(null);
  usuario = "";
  clave = "";

  abrir() {
    this.usuario = "";
    this.clave = "";
    this.errorLogin.set(null);
    this.abierto.set(true);
  }

  cerrar() {
    this.abierto.set(false);
  }

  @HostListener("document:keydown.escape")
  alEscape() {
    if (this.abierto()) this.cerrar();
  }

  entrar() {
    if (!this.usuario || !this.clave) {
      this.errorLogin.set("Escriba sus datos y su contraseña");
      return;
    }
    this.entrando.set(true);
    this.errorLogin.set(null);

    this.auth.entrar(this.usuario, this.clave).subscribe({
      next: (sesion) => {
        this.entrando.set(false);
        this.abierto.set(false);
        const destino =
          sesion.rol === "TRABAJADORA"
            ? "/mi-dia"
            : sesion.rol === "SUPERADMIN"
              ? "/empresas"
              : "/agenda";
        this.router.navigate([destino]);
      },
      error: () => {
        this.entrando.set(false);
        this.errorLogin.set(
          "Los datos no coinciden. Revise e intente de nuevo.",
        );
      },
    });
  }

  @HostListener("window:scroll")
  alBajar() {
    this.pegada = window.scrollY > 8;
  }

  horas = ["9:00", "10:00", "11:00", "12:00", "1:00", "2:00"];

  chicas = [
    { nombre: "Ana", color: "#FF1F6D" },
    { nombre: "Katherine", color: "#FF7A1A" },
    { nombre: "Luisa", color: "#8B2FBF" },
    { nombre: "Daniela", color: "#1FA855" },
  ];

  private citas = [
    {
      col: 0,
      top: 0,
      alto: 100,
      cliente: "Sandra O.",
      serv: "Acrílicas",
      hecha: true,
    },
    {
      col: 0,
      top: 150,
      alto: 50,
      cliente: "Diana C.",
      serv: "Pedicura",
      hecha: false,
    },
    {
      col: 1,
      top: 0,
      alto: 75,
      cliente: "Laura G.",
      serv: "Semiperm.",
      hecha: true,
    },
    {
      col: 1,
      top: 150,
      alto: 100,
      cliente: "Juliana V.",
      serv: "Pestañas",
      hecha: false,
    },
    {
      col: 2,
      top: 50,
      alto: 125,
      cliente: "Natalia F.",
      serv: "Acrílicas",
      hecha: false,
    },
    {
      col: 3,
      top: 0,
      alto: 50,
      cliente: "Mónica A.",
      serv: "Pedicura",
      hecha: true,
    },
    {
      col: 3,
      top: 175,
      alto: 100,
      cliente: "Isabel M.",
      serv: "Acrílicas",
      hecha: false,
    },
  ];

  private libres = [
    { col: 0, top: 106, alto: 40 },
    { col: 2, top: 180, alto: 40 },
    { col: 3, top: 56, alto: 40 },
  ];

  citasDe(col: number) {
    return this.citas.filter((c) => c.col === col);
  }
  libresDe(col: number) {
    return this.libres.filter((l) => l.col === col);
  }
}
