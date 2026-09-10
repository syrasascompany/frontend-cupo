import { Component, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ApiService } from "../core/api.service";
import { Servicio } from "../core/modelos";

/**
 * Los servicios con su duración normal y su precio.
 * Es lo primero que hay que cargar: sin servicios no hay nada que agendar.
 */
@Component({
  selector: "cupo-servicios",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="cabezote">
      <h1>Servicios</h1>
      <button class="boton b-fucsia" (click)="abrir = !abrir">
        {{ abrir ? "Cerrar" : "＋ Nuevo servicio" }}
      </button>
    </div>

    @if (error()) {
      <div class="error">{{ error() }}</div>
    }

    @if (abrir) {
      <div class="tarjeta formulario">
        <div class="tres">
          <div class="campo">
            <label for="s-nombre">Nombre</label>
            <input
              id="s-nombre"
              [(ngModel)]="nuevo.nombre"
              placeholder="Semipermanente"
            />
          </div>
          <div class="campo">
            <label for="s-dur">Duración normal</label>
            <input
              id="s-dur"
              type="number"
              min="5"
              step="5"
              [(ngModel)]="nuevo.duracionMin"
            />
          </div>
          <div class="campo">
            <label for="s-precio">Precio</label>
            <input
              id="s-precio"
              type="number"
              min="0"
              step="1000"
              [(ngModel)]="nuevo.precio"
            />
          </div>
        </div>
        <p class="nota">
          La duración normal es la que se usa para todas, salvo donde alguien se
          demore distinto. Eso se ajusta en «Mis manicuristas».
        </p>
        <button
          class="boton b-fucsia"
          (click)="crear()"
          [disabled]="guardando()"
        >
          {{ guardando() ? "Creando…" : "Crear servicio" }}
        </button>
      </div>
    }

    @if (cargando()) {
      <div class="cargando">Cargando…</div>
    } @else if (servicios().length === 0) {
      <div class="vacio">
        Todavía no hay servicios. Cree el primero para poder agendar.
      </div>
    } @else {
      <div class="rejilla">
        @for (s of servicios(); track s.id) {
          <div class="tarjeta servicio">
            @if (editando() === s.id) {
              <div class="campo">
                <label [for]="'n' + s.id">Nombre</label>
                <input [id]="'n' + s.id" [(ngModel)]="edicion.nombre" />
              </div>
              <div class="dos-campos">
                <div class="campo">
                  <label [for]="'d' + s.id">Duración</label>
                  <input
                    [id]="'d' + s.id"
                    type="number"
                    min="5"
                    step="5"
                    [(ngModel)]="edicion.duracionMin"
                  />
                </div>
                <div class="campo">
                  <label [for]="'p' + s.id">Precio</label>
                  <input
                    [id]="'p' + s.id"
                    type="number"
                    min="0"
                    step="1000"
                    [(ngModel)]="edicion.precio"
                  />
                </div>
              </div>
              <div class="acciones-fila">
                <button
                  class="boton b-linea b-chico"
                  (click)="editando.set(null)"
                >
                  Cancelar
                </button>
                <button
                  class="boton b-fucsia b-chico"
                  (click)="guardar(s.id)"
                  [disabled]="guardando()"
                >
                  Guardar
                </button>
              </div>
            } @else {
              <b>{{ s.nombre }}</b>
              <div class="linea">
                <span class="pastilla p-confirmada"
                  >{{ s.duracionMin }} min</span
                >
                @if (s.precioCentavos > 0) {
                  <span class="precio">{{
                    s.precioCentavos / 100
                      | currency: "COP" : "symbol-narrow" : "1.0-0"
                  }}</span>
                } @else {
                  <span class="precio sin">Sin precio</span>
                }
              </div>
              <div class="acciones-fila">
                <button class="boton b-linea b-chico" (click)="editar(s)">
                  Editar
                </button>
                <button class="boton b-peligro b-chico" (click)="quitar(s)">
                  Quitar
                </button>
              </div>
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
        margin-bottom: 16px;
      }
      h1 {
        font-size: 26px;
        margin-right: auto;
      }
      .formulario {
        padding: 20px;
        margin-bottom: 20px;
      }
      .tres {
        display: grid;
        grid-template-columns: 2fr 1fr 1fr;
        gap: 12px;
      }
      .nota {
        font-size: 13.5px;
        color: var(--ciruela-3);
        margin-bottom: 14px;
        max-width: 64ch;
      }
      .rejilla {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 13px;
      }
      .servicio {
        padding: 16px;
      }
      .servicio b {
        font-size: 16px;
        display: block;
        margin-bottom: 10px;
      }
      .linea {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .precio {
        font-size: 15px;
        font-weight: 600;
      }
      .precio.sin {
        color: var(--ciruela-3);
        font-weight: 400;
        font-size: 13.5px;
      }
      .acciones-fila {
        display: flex;
        gap: 7px;
        margin-top: 13px;
      }
      .acciones-fila .boton {
        flex: 1;
        justify-content: center;
      }
      .dos-campos {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
      @media (max-width: 640px) {
        .tres {
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
export class ServiciosComponent {
  private api = inject(ApiService);

  servicios = signal<Servicio[]>([]);
  cargando = signal(true);
  guardando = signal(false);
  error = signal<string | null>(null);
  abrir = false;

  nuevo = { nombre: "", duracionMin: 60, precio: 0 };

  editando = signal<number | null>(null);
  edicion = { nombre: "", duracionMin: 60, precio: 0 };

  editar(s: Servicio) {
    this.edicion = {
      nombre: s.nombre,
      duracionMin: s.duracionMin,
      precio: s.precioCentavos / 100,
    };
    this.editando.set(s.id);
  }

  guardar(id: number) {
    if (!this.edicion.nombre.trim()) {
      this.error.set("El nombre no puede quedar vacío.");
      return;
    }
    this.guardando.set(true);
    this.error.set(null);

    this.api
      .actualizarServicio(id, {
        nombre: this.edicion.nombre.trim(),
        duracionMin: this.edicion.duracionMin,
        precioCentavos: Math.round(this.edicion.precio * 100),
      })
      .subscribe({
        next: () => {
          this.guardando.set(false);
          this.editando.set(null);
          this.cargar();
        },
        error: (err) => {
          this.guardando.set(false);
          this.error.set(err?.error?.mensaje ?? "No se pudo guardar.");
        },
      });
  }

  /**
   * No se borra: se desactiva. Las citas viejas de ese servicio tienen que
   * seguir existiendo en el historial y en los reportes.
   */
  quitar(s: Servicio) {
    if (
      !confirm(
        `¿Quitar "${s.nombre}" de la lista?\n\n` +
          "Deja de ofrecerse, pero las citas anteriores no se pierden.",
      )
    )
      return;

    this.api.desactivarServicio(s.id).subscribe({
      next: () => this.cargar(),
      error: () => this.error.set("No se pudo quitar el servicio."),
    });
  }

  constructor() {
    this.cargar();
  }

  cargar() {
    this.api.servicios().subscribe({
      next: (s) => {
        this.servicios.set(s);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set("No se pudieron cargar los servicios.");
        this.cargando.set(false);
      },
    });
  }

  crear() {
    if (!this.nuevo.nombre.trim()) {
      this.error.set("Escriba el nombre del servicio.");
      return;
    }
    this.guardando.set(true);
    this.error.set(null);

    this.api
      .crearServicio({
        nombre: this.nuevo.nombre.trim(),
        duracionMin: this.nuevo.duracionMin,
        precioCentavos: Math.round(this.nuevo.precio * 100),
      })
      .subscribe({
        next: () => {
          this.guardando.set(false);
          this.abrir = false;
          this.nuevo = { nombre: "", duracionMin: 60, precio: 0 };
          this.cargar();
        },
        error: (err) => {
          this.guardando.set(false);
          this.error.set(
            err?.error?.mensaje ?? "No se pudo crear el servicio.",
          );
        },
      });
  }
}
