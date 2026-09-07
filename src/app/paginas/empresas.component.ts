import { Component, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ApiService } from "../core/api.service";
import { Empresa } from "../core/modelos";

/** El panel de superadministrador: dar de alta clientes y ajustar su plan. */
@Component({
  selector: "cupo-empresas",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="cabezote">
      <h1>Empresas</h1>
      <button class="boton b-fucsia" (click)="abrir = !abrir">
        {{ abrir ? "Cerrar" : "＋ Nueva empresa" }}
      </button>
    </div>

    @if (error()) {
      <div class="error">{{ error() }}</div>
    }

    @if (abrir) {
      <div class="tarjeta formulario">
        <div class="dos">
          <div class="campo">
            <label for="nombre">Nombre del negocio</label>
            <input
              id="nombre"
              [(ngModel)]="nueva.nombre"
              (ngModelChange)="sugerirSlug()"
            />
          </div>
          <div class="campo">
            <label for="slug">Identificador</label>
            <input
              id="slug"
              [(ngModel)]="nueva.slug"
              placeholder="tony-nails"
            />
          </div>
        </div>

        <div class="dos">
          <div class="campo">
            <label for="plan">Plan</label>
            <select
              id="plan"
              [(ngModel)]="nueva.plan"
              (ngModelChange)="ajustarTope()"
            >
              <option value="ESENCIAL">Esencial — hasta 2</option>
              <option value="SALON">Salón — hasta 6</option>
              <option value="SPA">Spa — hasta 12</option>
            </select>
          </div>
          <div class="campo">
            <label for="tope">Tope de profesionales</label>
            <input
              id="tope"
              type="number"
              min="1"
              [(ngModel)]="nueva.maxProfesionales"
            />
          </div>
        </div>

        <div class="dos">
          <div class="campo">
            <label for="admin">Correo del dueño</label>
            <input id="admin" type="email" [(ngModel)]="nueva.emailAdmin" />
          </div>
          <div class="campo">
            <label for="nombreAdmin">Nombre del dueño</label>
            <input id="nombreAdmin" [(ngModel)]="nueva.nombreAdmin" />
          </div>
        </div>

        <div class="campo">
          <label for="clave">Contraseña provisional</label>
          <input
            id="clave"
            [(ngModel)]="nueva.claveAdmin"
            placeholder="mínimo 8 caracteres"
          />
        </div>

        <button
          class="boton b-fucsia"
          (click)="crear()"
          [disabled]="guardando()"
        >
          {{ guardando() ? "Creando…" : "Crear empresa" }}
        </button>
      </div>
    }

    @if (cargando()) {
      <div class="cargando">Cargando…</div>
    } @else {
      <div class="rejilla">
        @for (e of empresas(); track e.id) {
          <div class="tarjeta empresa">
            <div class="fila">
              <b>{{ e.nombre }}</b>
              <span
                class="pastilla"
                [class.p-finalizada]="e.activa"
                [class.p-cancelada]="!e.activa"
              >
                {{ e.activa ? "Activa" : "Suspendida" }}
              </span>
            </div>
            <p class="slug">{{ e.slug }}</p>
            <p class="uso">
              Plan {{ e.plan }} ·
              <b [class.tope]="e.profesionalesUsados >= e.maxProfesionales">
                {{ e.profesionalesUsados }} de {{ e.maxProfesionales }}
              </b>
              profesionales
            </p>
            @if (!e.telefonoWa) {
              <p class="aviso">Falta conectar el WhatsApp</p>
            }
          </div>
        }
      </div>
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
        margin-bottom: 18px;
      }
      h1 {
        font-size: 26px;
        margin-right: auto;
      }
      .formulario {
        padding: 20px;
        margin-bottom: 20px;
      }
      .dos {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
      .rejilla {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
        gap: 14px;
      }
      .empresa {
        padding: 18px;
      }
      .fila {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 3px;
      }
      .fila b {
        font-size: 16.5px;
        font-weight: 700;
      }
      .slug {
        font-size: 13px;
        color: var(--ciruela-3);
        margin-bottom: 10px;
      }
      .uso {
        font-size: 14px;
        color: var(--ciruela-2);
      }
      .uso .tope {
        color: var(--rojo);
      }
      .aviso {
        margin-top: 9px;
        font-size: 13px;
        color: var(--ambar);
        font-weight: 500;
      }
      @media (max-width: 620px) {
        .dos {
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
export class EmpresasComponent {
  private api = inject(ApiService);

  empresas = signal<Empresa[]>([]);
  cargando = signal(true);
  guardando = signal(false);
  error = signal<string | null>(null);
  abrir = false;

  nueva = {
    nombre: "",
    slug: "",
    plan: "SALON",
    maxProfesionales: 6,
    emailAdmin: "",
    nombreAdmin: "",
    claveAdmin: "",
  };

  constructor() {
    this.cargar();
  }

  cargar() {
    this.api.empresas().subscribe({
      next: (e) => {
        this.empresas.set(e);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set("No se pudieron cargar las empresas.");
        this.cargando.set(false);
      },
    });
  }

  sugerirSlug() {
    this.nueva.slug = this.nueva.nombre
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80);
  }

  ajustarTope() {
    this.nueva.maxProfesionales =
      { ESENCIAL: 2, SALON: 6, SPA: 12 }[this.nueva.plan] ?? 2;
  }

  crear() {
    this.guardando.set(true);
    this.error.set(null);
    this.api.crearEmpresa(this.nueva).subscribe({
      next: () => {
        this.guardando.set(false);
        this.abrir = false;
        this.nueva = {
          nombre: "",
          slug: "",
          plan: "SALON",
          maxProfesionales: 6,
          emailAdmin: "",
          nombreAdmin: "",
          claveAdmin: "",
        };
        this.cargar();
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(err?.error?.mensaje ?? "No se pudo crear la empresa.");
      },
    });
  }
}
