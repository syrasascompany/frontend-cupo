import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { entorno } from '../../environments/environment';

/**
 * Dos pasos en una sola pantalla: si viene con ?token= pide la clave nueva,
 * si no, pide el correo.
 */
@Component({
  selector: 'cupo-recuperar',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="pantalla">
      <div class="caja">
        <div class="marca">
          <svg viewBox="0 0 200 200" aria-hidden="true">
            <rect width="200" height="200" rx="46" fill="#FF1F6D"/>
            <g fill="#fff">
              <rect x="46" y="46" width="108" height="22" rx="11" opacity=".42"/>
              <rect x="46" y="80" width="108" height="22" rx="11" opacity=".42"/>
              <rect x="46" y="148" width="108" height="22" rx="11" opacity=".42"/>
            </g>
            <rect x="46" y="114" width="108" height="22" rx="11" fill="none"
                  stroke="#fff" stroke-width="3.4" stroke-dasharray="9 7"/>
          </svg>
          <b>Cupo</b>
        </div>

        @if (token) {
          <h1>Ponga su contraseña nueva</h1>

          @if (error()) { <div class="error">{{ error() }}</div> }
          @if (listo()) { <div class="ok">{{ listo() }}</div> }

          @if (!listo()) {
            <div class="campo">
              <label for="c1">Contraseña nueva</label>
              <input id="c1" type="password" [(ngModel)]="clave" autocomplete="new-password">
            </div>
            <div class="campo">
              <label for="c2">Repítala</label>
              <input id="c2" type="password" [(ngModel)]="repetida"
                     autocomplete="new-password" (keyup.enter)="restablecer()">
            </div>
            <p class="ayuda">Mínimo 8 caracteres.</p>
            <button class="boton b-fucsia ancho" (click)="restablecer()" [disabled]="cargando()">
              {{ cargando() ? 'Guardando…' : 'Guardar contraseña' }}
            </button>
          } @else {
            <a class="boton b-fucsia ancho" routerLink="/entrar">Entrar</a>
          }

        } @else {
          <h1>¿Olvidó su contraseña?</h1>
          <p class="ayuda">Escriba su correo y le mandamos un enlace para ponerla de nuevo.</p>

          @if (listo()) { <div class="ok">{{ listo() }}</div> }

          @if (!listo()) {
            <div class="campo">
              <label for="email">Correo</label>
              <input id="email" type="email" [(ngModel)]="email"
                     autocomplete="username" (keyup.enter)="solicitar()">
            </div>
            <button class="boton b-fucsia ancho" (click)="solicitar()" [disabled]="cargando()">
              {{ cargando() ? 'Enviando…' : 'Enviarme el enlace' }}
            </button>
          }

          <p class="nota">
            ¿Es manicurista y entra con su cédula? Pídale la contraseña nueva
            a la dueña del salón: ella se la puede cambiar.
          </p>
        }

        <a class="volver" routerLink="/entrar">Volver a entrar</a>
      </div>
    </div>
  `,
  styles: [`
    .pantalla{min-height:100vh;display:grid;place-items:center;padding:20px;
      background:linear-gradient(160deg,#FFEBF2,#FBF6F8 55%)}
    .caja{width:min(420px,100%);background:#fff;border-radius:22px;padding:32px;
      box-shadow:0 20px 50px -24px rgba(42,10,28,.35)}
    .marca{display:flex;align-items:center;gap:10px;margin-bottom:22px}
    .marca svg{width:38px;height:38px}
    .marca b{font-size:26px;font-weight:900;letter-spacing:-.06em}
    h1{font-size:23px;margin-bottom:8px}
    .ayuda{font-size:14px;color:var(--ciruela-3);margin-bottom:16px}
    .nota{font-size:13.5px;color:var(--ciruela-3);margin-top:18px;
      background:var(--fondo);border-radius:10px;padding:12px 14px}
    .ok{background:#E4F4EC;color:#0F6B49;border-radius:10px;padding:12px 14px;
      font-size:14px;margin-bottom:16px}
    .ancho{width:100%;margin-top:6px;padding:12px}
    .volver{display:block;text-align:center;margin-top:18px;font-size:14px;
      color:var(--ciruela-3);text-decoration:none}
    .volver:hover{color:var(--fucsia)}
  `]
})
export class RecuperarComponent {
  private http = inject(HttpClient);
  private ruta = inject(ActivatedRoute);
  private router = inject(Router);

  token = this.ruta.snapshot.queryParamMap.get('token');

  email = '';
  clave = '';
  repetida = '';

  cargando = signal(false);
  error = signal<string | null>(null);
  listo = signal<string | null>(null);

  solicitar() {
    if (!this.email.trim()) { this.error.set('Escriba su correo.'); return; }
    this.cargando.set(true);

    this.http.post<{ mensaje: string }>(`${entorno.api}/auth/olvide`, { email: this.email })
      .subscribe({
        next: r => { this.cargando.set(false); this.listo.set(r.mensaje); },
        error: () => {
          this.cargando.set(false);
          // Se responde igual aunque falle: no se revela si el correo existe
          this.listo.set('Si ese correo está registrado, le enviamos un enlace.');
        }
      });
  }

  restablecer() {
    this.error.set(null);

    if (this.clave.length < 8) {
      this.error.set('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (this.clave !== this.repetida) {
      this.error.set('Las dos contraseñas no coinciden.');
      return;
    }

    this.cargando.set(true);
    this.http.post<{ mensaje: string }>(`${entorno.api}/auth/restablecer`,
      { token: this.token, clave: this.clave })
      .subscribe({
        next: r => { this.cargando.set(false); this.listo.set(r.mensaje); },
        error: err => {
          this.cargando.set(false);
          this.error.set(err?.error?.mensaje ?? 'El enlace ya venció. Pida uno nuevo.');
        }
      });
  }
}
