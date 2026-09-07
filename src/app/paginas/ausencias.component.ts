import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { Profesional, Servicio } from '../core/modelos';

interface Alternativa {
  profesionalId: number;
  profesionalNombre: string;
  inicio: string;
  mismaHora: boolean;
}

interface CitaAfectada {
  cita: { id: number; servicioId: number; inicio: string; fin: string };
  alternativas: Alternativa[];
}

/**
 * "Hoy no vino Ana." En vez de que el dueño llame a cada clienta, aquí ve
 * qué citas quedaron sueltas y a quién le caben, con las de la misma hora
 * primero: esas no obligan a molestar a nadie.
 */
@Component({
  selector: 'cupo-ausencias',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="cabezote"><h1>Si falta alguien</h1></div>

    <p class="explica">
      Escoja a quién no vino y qué día. Cupo le muestra sus citas y las
      manicuristas que pueden atenderlas.
    </p>

    <div class="tarjeta filtros">
      <div class="campo">
        <label for="quien">Quién no vino</label>
        <select id="quien" [(ngModel)]="profesionalId" (ngModelChange)="revisar()">
          <option [ngValue]="null">Escoja</option>
          @for (p of profesionales(); track p.id) {
            <option [ngValue]="p.id">{{ p.nombre }}</option>
          }
        </select>
      </div>
      <div class="campo">
        <label for="dia">Qué día</label>
        <input id="dia" type="date" [(ngModel)]="fecha" (ngModelChange)="revisar()">
      </div>
      <button class="boton b-peligro" (click)="marcarAusente()"
              [disabled]="!profesionalId || sellando()">
        {{ sellando() ? 'Sellando…' : 'Marcar ausente todo el día' }}
      </button>
    </div>

    @if (error()) { <div class="error">{{ error() }}</div> }
    @if (aviso()) { <div class="ok">{{ aviso() }}</div> }

    @if (revisando()) {
      <div class="cargando">Buscando sus citas…</div>
    } @else if (profesionalId && afectadas().length === 0) {
      <div class="vacio">No tiene citas ese día. Puede marcarla ausente sin problema.</div>
    } @else {
      @for (a of afectadas(); track a.cita.id) {
        <div class="tarjeta caso">
          <div class="caso-tapa">
            <div>
              <b>{{ nombreServicio(a.cita.servicioId) }}</b>
              <span>{{ a.cita.inicio | date:'h:mm a' }} a {{ a.cita.fin | date:'h:mm a' }}</span>
            </div>
          </div>

          @if (a.alternativas.length === 0) {
            <p class="sin-salida">
              Nadie más puede atender esta cita ese día. Toca llamar a la clienta
              y reprogramarla.
            </p>
          } @else {
            <p class="nota">Pásela a:</p>
            <div class="opciones">
              @for (alt of a.alternativas; track alt.profesionalId + alt.inicio) {
                <button class="opcion" [class.misma]="alt.mismaHora"
                        (click)="pasar(a.cita.id, alt)"
                        [disabled]="pasando() === a.cita.id">
                  <b>{{ alt.profesionalNombre }}</b>
                  <span>{{ alt.inicio | date:'h:mm a' }}</span>
                  @if (alt.mismaHora) { <small>Misma hora</small> }
                </button>
              }
            </div>
          }
        </div>
      }
    }
  `,
  styles: [`
    :host{display:block;max-width:960px;margin-inline:auto;padding:18px 18px 80px}
    h1{font-size:26px;margin-bottom:8px}
    .explica{font-size:14.5px;color:var(--ciruela-2);margin-bottom:16px;max-width:62ch}
    .ok{background:#E4F4EC;color:#0F6B49;border-radius:10px;padding:11px 14px;
      font-size:14px;margin-bottom:14px}

    .filtros{padding:16px;display:flex;gap:12px;align-items:flex-end;
      flex-wrap:wrap;margin-bottom:18px}
    .filtros .campo{margin-bottom:0;min-width:180px}

    .caso{padding:16px;margin-bottom:12px}
    .caso-tapa b{font-size:16px;display:block}
    .caso-tapa span{font-size:13.5px;color:var(--ciruela-3)}
    .nota{font-size:13.5px;color:var(--ciruela-3);margin:12px 0 8px}
    .sin-salida{font-size:14px;color:var(--ambar);margin-top:10px;
      background:#FDF3E3;border-radius:9px;padding:10px 13px}

    .opciones{display:grid;grid-template-columns:repeat(auto-fill,minmax(148px,1fr));gap:8px}
    .opcion{border:1.5px solid var(--borde);border-radius:11px;padding:10px;
      text-align:left;background:var(--papel)}
    .opcion:hover{border-color:var(--fucsia)}
    .opcion.misma{border-color:var(--fucsia);background:var(--fucsia-claro)}
    .opcion b{display:block;font-size:14px}
    .opcion span{font-size:13px;color:var(--ciruela-2)}
    .opcion small{display:block;font-size:11.5px;color:var(--fucsia-hondo);font-weight:700;margin-top:3px}
  `]
})
export class AusenciasComponent {
  private api = inject(ApiService);

  profesionales = signal<Profesional[]>([]);
  servicios = signal<Servicio[]>([]);
  afectadas = signal<CitaAfectada[]>([]);

  profesionalId: number | null = null;
  fecha = new Date().toISOString().slice(0, 10);

  revisando = signal(false);
  sellando = signal(false);
  pasando = signal<number | null>(null);
  error = signal<string | null>(null);
  aviso = signal<string | null>(null);

  constructor() {
    this.api.profesionales().subscribe(p => this.profesionales.set(p));
    this.api.servicios().subscribe(s => this.servicios.set(s));
  }

  nombreServicio(id: number) {
    return this.servicios().find(s => s.id === id)?.nombre ?? 'Servicio';
  }

  revisar() {
    if (!this.profesionalId || !this.fecha) { this.afectadas.set([]); return; }
    this.revisando.set(true);
    this.error.set(null);

    this.api.revisarReasignacion(this.profesionalId, this.fecha).subscribe({
      next: r => { this.afectadas.set(r as CitaAfectada[]); this.revisando.set(false); },
      error: () => { this.error.set('No se pudo revisar.'); this.revisando.set(false); }
    });
  }

  pasar(citaId: number, alt: Alternativa) {
    this.pasando.set(citaId);
    this.api.reasignar(citaId, alt.profesionalId, alt.inicio).subscribe({
      next: () => {
        this.pasando.set(null);
        this.aviso.set(`Cita pasada a ${alt.profesionalNombre}.`);
        this.revisar();
      },
      error: err => {
        this.pasando.set(null);
        this.error.set(err?.error?.mensaje ?? 'Ese cupo se acaba de ocupar.');
        this.revisar();
      }
    });
  }

  /** Sella el día completo: deja de ofrecerse en la agenda y en WhatsApp. */
  marcarAusente() {
    if (!this.profesionalId) return;
    this.sellando.set(true);

    this.api.sellar(this.profesionalId, {
      fecha: this.fecha, tipo: 'AUSENCIA', motivo: 'No asistió'
    }).subscribe({
      next: () => {
        this.sellando.set(false);
        this.aviso.set('Día sellado. Ya no se ofrecen cupos suyos ese día.');
      },
      error: err => {
        this.sellando.set(false);
        this.error.set(err?.error?.mensaje ?? 'No se pudo sellar el día.');
      }
    });
  }
}
