import { Component, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import { entorno } from "../../environments/environment";

interface Espera {
  id: number;
  servicioId: number;
  profesionalId?: number;
  desde: string;
  hasta: string;
  telefono: string;
  nombre?: string;
  estado: string;
  creadoEn: string;
}

/**
 * Quién está esperando un cupo. Cuando alguien cancela, Cupo le escribe
 * solo a las tres primeras: avisar a todas genera una carrera y deja
 * clientas molestas.
 */
@Component({
  selector: "cupo-espera",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="cabezote"><h1>Lista de espera</h1></div>

    @if (error()) {
      <div class="error">{{ error() }}</div>
    }

    @if (cargando()) {
      <div class="cargando">Cargando…</div>
    } @else if (lista().length === 0) {
      <div class="vacio">
        Nadie está esperando cupo en este momento.<br />
        Cuando el día se llene, las clientas entran solas desde WhatsApp.
      </div>
    } @else {
      <p class="explica">
        Si se cancela una cita que les sirva, Cupo les escribe automáticamente
        en este orden de llegada. Las marcadas como «ya se le avisó» recibieron
        el mensaje de un cupo libre y están decidiendo.
      </p>
      <div class="tarjeta">
        @for (e of lista(); track e.id; let i = $index) {
          <div class="fila">
            <span class="turno">{{ i + 1 }}</span>
            <div class="datos">
              <b>{{ e.nombre || "Sin nombre" }}</b>
              <span>{{ e.telefono }}</span>
            </div>
            <div class="rango">
              @if (e.estado === "AVISADO") {
                <span class="pastilla p-confirmada">Ya se le avisó</span>
              } @else {
                <span
                  >Entre el {{ e.desde | date: "d MMM" }} y el
                  {{ e.hasta | date: "d MMM" }}</span
                >
              }
              <small>Anotada el {{ e.creadoEn | date: "d MMM, h:mm a" }}</small>
            </div>
            <a
              class="boton b-wa b-chico"
              [href]="'https://wa.me/' + e.telefono"
              target="_blank"
              rel="noopener"
              >Escribir</a
            >
          </div>
        }
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: block;
        max-width: 900px;
        margin-inline: auto;
        padding: 18px 18px 80px;
      }
      h1 {
        font-size: 26px;
        margin-bottom: 16px;
      }
      .explica {
        font-size: 14.5px;
        color: var(--ciruela-2);
        margin-bottom: 14px;
        max-width: 64ch;
      }
      .fila {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 14px 16px;
        border-bottom: 1px solid var(--borde);
      }
      .fila:last-child {
        border-bottom: 0;
      }
      .fila.avisada {
        background: var(--fucsia-claro);
      }
      .turno {
        width: 26px;
        height: 26px;
        border-radius: 50%;
        background: var(--fucsia-claro);
        color: var(--fucsia-hondo);
        display: grid;
        place-items: center;
        font-size: 13px;
        font-weight: 700;
        flex: none;
      }
      .datos {
        flex: 1;
        min-width: 0;
      }
      .datos b {
        display: block;
        font-size: 15px;
      }
      .datos span {
        font-size: 13px;
        color: var(--ciruela-3);
      }
      .rango {
        text-align: right;
        font-size: 13px;
        color: var(--ciruela-2);
      }
      .rango small {
        display: block;
        font-size: 11.5px;
        color: var(--ciruela-3);
      }
      @media (max-width: 620px) {
        .fila {
          flex-wrap: wrap;
        }
        .rango {
          text-align: left;
          width: 100%;
        }
      }
    `,
  ],
})
export class EsperaComponent {
  private http = inject(HttpClient);

  lista = signal<Espera[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);

  constructor() {
    this.http.get<Espera[]>(`${entorno.api}/lista-espera`).subscribe({
      next: (l) => {
        this.lista.set(l);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set("No se pudo cargar la lista.");
        this.cargando.set(false);
      },
    });
  }
}
