import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { ApiService } from "../core/api.service";
import { AuthService } from "../core/auth.service";

@Component({
  selector: "cupo-armazon",
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, FormsModule],
  template: `
    <header class="tapa">
      <div class="interior">
        <a class="marca" routerLink="/agenda">
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

        <button
          class="hamburguesa"
          (click)="menuAbierto.set(!menuAbierto())"
          [attr.aria-expanded]="menuAbierto()"
          aria-label="Menú"
        >
          <span></span><span></span><span></span>
        </button>

        <nav
          class="menu"
          [class.abierto]="menuAbierto()"
          (click)="menuAbierto.set(false)"
        >
          @if (auth.rol() === "ADMIN") {
            <a routerLink="/agenda" routerLinkActive="activo">Agenda</a>
            <a routerLink="/equipo" routerLinkActive="activo"
              >Mis manicuristas</a
            >
            <a routerLink="/servicios" routerLinkActive="activo">Servicios</a>
            <a routerLink="/espera" routerLinkActive="activo"
              >Lista de espera</a
            >
            <a routerLink="/ausencias" routerLinkActive="activo"
              >Si falta alguien</a
            >
            <a routerLink="/reportes" routerLinkActive="activo">Reportes</a>
          }
          @if (auth.esTrabajadora()) {
            <a routerLink="/mi-dia" routerLinkActive="activo">Mi día</a>
          }
          @if (auth.esSuperadmin()) {
            <a routerLink="/empresas" routerLinkActive="activo">Empresas</a>
          }
        </nav>

        <div class="yo">
          <button
            class="avatar-yo"
            (click)="perfilAbierto.set(!perfilAbierto())"
            [attr.aria-expanded]="perfilAbierto()"
            aria-label="Mi cuenta"
          >
            {{ iniciales() }}
          </button>

          @if (perfilAbierto()) {
            <div class="velo-suave" (click)="perfilAbierto.set(false)"></div>
            <div class="menu-yo">
              <div class="quien-soy">
                <b>{{ auth.sesion()?.nombre }}</b>
                <span>{{ etiquetaRol() }}</span>
              </div>
              <button (click)="abrirClave(); perfilAbierto.set(false)">
                Mi contraseña
              </button>
              <button class="salir" (click)="auth.salir()">
                Cerrar sesión
              </button>
            </div>
          }
        </div>
      </div>
    </header>

    @if (menuAbierto()) {
      <div class="velo-menu" (click)="menuAbierto.set(false)"></div>
    }

    <main><router-outlet /></main>

    @if (cambiando()) {
      <div class="velo" (click)="cambiando.set(false)"></div>
      <div class="dialogo">
        <h2>Cambiar mi contraseña</h2>

        @if (error()) {
          <div class="error">{{ error() }}</div>
        }
        @if (listo()) {
          <div class="ok">{{ listo() }}</div>
        }

        <div class="campo">
          <label for="actual">Contraseña actual</label>
          <input
            id="actual"
            type="password"
            [(ngModel)]="actual"
            autocomplete="current-password"
          />
        </div>
        <div class="campo">
          <label for="nueva">Contraseña nueva</label>
          <input
            id="nueva"
            type="password"
            [(ngModel)]="nueva"
            autocomplete="new-password"
          />
        </div>
        <div class="campo">
          <label for="repetida">Repítala</label>
          <input
            id="repetida"
            type="password"
            [(ngModel)]="repetida"
            autocomplete="new-password"
          />
        </div>

        <div class="acciones">
          <button class="boton b-linea" (click)="cambiando.set(false)">
            Cancelar
          </button>
          <button
            class="boton b-fucsia"
            (click)="cambiarClave()"
            [disabled]="guardando()"
          >
            {{ guardando() ? "Guardando…" : "Cambiar" }}
          </button>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .tapa {
        background: #fff;
        border-bottom: 1px solid var(--borde);
        position: sticky;
        top: 0;
        z-index: 90;
      }
      .interior {
        display: flex;
        align-items: center;
        gap: 20px;
        padding: 11px 18px;
        max-width: 1500px;
        margin-inline: auto;
      }
      .marca {
        display: flex;
        align-items: center;
        gap: 9px;
        text-decoration: none;
      }
      .marca svg {
        width: 30px;
        height: 30px;
      }
      .marca b {
        font-size: 21px;
        font-weight: 900;
        letter-spacing: -0.06em;
      }
      .menu {
        display: flex;
        gap: 4px;
        margin-right: auto;
        overflow-x: auto;
      }
      .menu a {
        padding: 7px 13px;
        border-radius: 9px;
        text-decoration: none;
        font-size: 14.5px;
        font-weight: 500;
        color: var(--ciruela-2);
      }
      .menu a:hover {
        background: var(--fondo);
      }
      .menu a.activo {
        background: var(--fucsia-claro);
        color: var(--fucsia-hondo);
        font-weight: 600;
      }
      .quien {
        font-size: 14px;
        color: var(--ciruela-3);
      }
      /* Hamburguesa: oculta en escritorio */
      .hamburguesa {
        display: none;
        width: 38px;
        height: 38px;
        border-radius: 10px;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 4px;
      }
      .hamburguesa:hover {
        background: var(--fondo);
      }
      .hamburguesa span {
        display: block;
        width: 18px;
        height: 2px;
        background: var(--ciruela);
        border-radius: 2px;
        transition:
          transform 0.3s var(--curva),
          opacity 0.3s;
      }
      .hamburguesa[aria-expanded="true"] span:nth-child(1) {
        transform: translateY(6px) rotate(45deg);
      }
      .hamburguesa[aria-expanded="true"] span:nth-child(2) {
        opacity: 0;
      }
      .hamburguesa[aria-expanded="true"] span:nth-child(3) {
        transform: translateY(-6px) rotate(-45deg);
      }

      /* Menú de la cuenta */
      .yo {
        position: relative;
        flex: none;
      }
      .avatar-yo {
        width: 38px;
        height: 38px;
        border-radius: 50%;
        background: var(--fucsia);
        color: #fff;
        font-size: 13px;
        font-weight: 700;
        display: grid;
        place-items: center;
      }
      .avatar-yo:hover {
        background: var(--fucsia-hondo);
      }
      .velo-suave {
        position: fixed;
        inset: 0;
        z-index: 70;
      }
      .menu-yo {
        position: absolute;
        right: 0;
        top: 46px;
        z-index: 80;
        width: 210px;
        background: var(--papel);
        border: 1px solid var(--borde);
        border-radius: 13px;
        box-shadow: 0 16px 40px -14px rgba(42, 10, 28, 0.32);
        overflow: hidden;
        padding: 5px;
      }
      .quien-soy {
        padding: 11px 12px 10px;
        border-bottom: 1px solid var(--borde);
        margin-bottom: 5px;
      }
      .quien-soy b {
        display: block;
        font-size: 14.5px;
      }
      .quien-soy span {
        font-size: 12.5px;
        color: var(--ciruela-3);
      }
      .menu-yo button {
        display: block;
        width: 100%;
        text-align: left;
        padding: 10px 12px;
        border-radius: 9px;
        font-size: 14.5px;
      }
      .menu-yo button:hover {
        background: var(--fondo);
      }
      .menu-yo .salir {
        color: var(--rojo);
      }

      .velo-menu {
        display: none;
      }

      @media (max-width: 860px) {
        .hamburguesa {
          display: flex;
        }
        .interior {
          gap: 10px;
        }

        /* El menú baja como panel, no como fila apretada */
        .menu {
          position: fixed;
          top: 60px;
          left: 0;
          right: 0;
          z-index: 75;
          flex-direction: column;
          gap: 2px;
          padding: 10px;
          background: var(--papel);
          border-bottom: 1px solid var(--borde);
          box-shadow: 0 12px 30px -12px rgba(42, 10, 28, 0.28);
          transform: translateY(-12px);
          opacity: 0;
          pointer-events: none;
          transition:
            transform 0.28s var(--curva),
            opacity 0.22s;
        }
        .menu.abierto {
          transform: none;
          opacity: 1;
          pointer-events: auto;
        }
        .menu a {
          padding: 12px 14px;
          font-size: 15px;
          border-radius: 10px;
        }

        .velo-menu {
          display: block;
          position: fixed;
          inset: 60px 0 0;
          z-index: 70;
          background: rgba(42, 10, 28, 0.35);
        }
        .marca-sub {
          display: none;
        }
        .marca-nombre {
          font-size: 17px;
        }
      }

      .velo {
        position: fixed;
        inset: 0;
        background: rgba(42, 10, 28, 0.42);
        z-index: 150;
      }
      .dialogo {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 160;
        width: min(400px, 92vw);
        background: var(--papel);
        border-radius: 18px;
        padding: 26px;
        box-shadow: 0 24px 60px -20px rgba(42, 10, 28, 0.45);
      }
      .dialogo h2 {
        font-size: 20px;
        margin-bottom: 18px;
      }
      .dialogo .acciones {
        display: flex;
        gap: 8px;
        margin-top: 6px;
      }
      .dialogo .acciones .b-fucsia {
        flex: 1;
      }
      .ok {
        background: #e4f4ec;
        color: #0f6b49;
        border-radius: 10px;
        padding: 11px 14px;
        font-size: 14px;
        margin-bottom: 14px;
      }
    `,
  ],
})
export class ArmazonComponent {
  auth = inject(AuthService);
  private api = inject(ApiService);

  menuAbierto = signal(false);
  perfilAbierto = signal(false);
  cambiando = signal(false);
  guardando = signal(false);
  error = signal<string | null>(null);
  listo = signal<string | null>(null);

  actual = "";
  nueva = "";
  repetida = "";

  iniciales() {
    const nombre = this.auth.sesion()?.nombre ?? "";
    return nombre.trim().slice(0, 2).toUpperCase() || "··";
  }

  etiquetaRol() {
    const rol = this.auth.rol();
    if (rol === "SUPERADMIN") return "Administrador de Cupo";
    if (rol === "ADMIN") return "Dueño del negocio";
    if (rol === "TRABAJADORA") return "Manicurista";
    return "";
  }
  abrirClave() {
    this.actual = this.nueva = this.repetida = "";
    this.error.set(null);
    this.listo.set(null);
    this.cambiando.set(true);
  }

  cambiarClave() {
    this.error.set(null);

    if (this.nueva.length < 8) {
      this.error.set("La contraseña nueva debe tener al menos 8 caracteres.");
      return;
    }
    if (this.nueva !== this.repetida) {
      this.error.set("Las dos contraseñas nuevas no coinciden.");
      return;
    }

    this.guardando.set(true);
    this.api.cambiarMiClave(this.actual, this.nueva).subscribe({
      next: (r) => {
        this.guardando.set(false);
        this.listo.set(r.mensaje);
        this.actual = this.nueva = this.repetida = "";
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(
          err?.error?.mensaje ?? "No se pudo cambiar la contraseña.",
        );
      },
    });
  }
}
