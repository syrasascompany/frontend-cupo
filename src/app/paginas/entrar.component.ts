import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'cupo-entrar',
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

        <h1>Entre a su agenda</h1>

        @if (error()) { <div class="error">{{ error() }}</div> }

        <div class="campo">
          <label for="usuario">Correo o cédula</label>
          <input id="usuario" [(ngModel)]="usuario" autocomplete="username"
                 placeholder="correo@ejemplo.com o 1094...">
          <p class="pista">Las manicuristas entran con su número de cédula.</p>
        </div>

        <div class="campo">
          <label for="clave">Contraseña</label>
          <input id="clave" type="password" [(ngModel)]="clave"
                 autocomplete="current-password" (keyup.enter)="entrar()">
        </div>

        <button class="boton b-fucsia ancho" (click)="entrar()" [disabled]="cargando()">
          {{ cargando() ? 'Entrando…' : 'Entrar' }}
        </button>

        <a class="olvide" routerLink="/recuperar">Olvidé mi contraseña</a>
      </div>
    </div>
  `,
  styles: [`
    .pantalla{min-height:100vh;display:grid;place-items:center;padding:20px;
      background:linear-gradient(160deg,#FFEBF2,#FBF6F8 55%)}
    .caja{width:min(400px,100%);background:#fff;border-radius:22px;padding:32px;
      box-shadow:0 20px 50px -24px rgba(42,10,28,.35)}
    .marca{display:flex;align-items:center;gap:10px;margin-bottom:22px}
    .marca svg{width:38px;height:38px}
    .marca b{font-size:26px;font-weight:900;letter-spacing:-.06em}
    h1{font-size:24px;margin-bottom:20px}
    .ancho{width:100%;margin-top:6px;padding:12px}
    .pista{font-size:12.5px;color:var(--ciruela-3);margin-top:5px}
    .olvide{display:block;text-align:center;margin-top:16px;font-size:14px;
      color:var(--ciruela-3);text-decoration:none}
    .olvide:hover{color:var(--fucsia)}
  `]
})
export class EntrarComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  usuario = '';
  clave = '';
  cargando = signal(false);
  error = signal<string | null>(null);

  entrar() {
    if (!this.usuario || !this.clave) {
      this.error.set('Escriba sus datos y su contraseña');
      return;
    }
    this.cargando.set(true);
    this.error.set(null);

    this.auth.entrar(this.usuario, this.clave).subscribe({
      next: sesion => {
        this.cargando.set(false);
        const destino = sesion.rol === 'TRABAJADORA' ? '/mi-dia'
                      : sesion.rol === 'SUPERADMIN' ? '/empresas' : '/agenda';
        this.router.navigate([destino]);
      },
      error: () => {
        this.cargando.set(false);
        this.error.set('Los datos no coinciden. Revise e intente de nuevo.');
      }
    });
  }
}
