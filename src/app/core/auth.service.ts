import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { entorno } from '../../environments/environment';
import { Sesion } from './modelos';

const LLAVE = 'cupo.sesion';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly _sesion = signal<Sesion | null>(this.leerGuardada());

  readonly sesion = this._sesion.asReadonly();
  readonly autenticado = computed(() => this._sesion() !== null);
  readonly rol = computed(() => this._sesion()?.rol ?? null);
  readonly esTrabajadora = computed(() => this.rol() === 'TRABAJADORA');
  readonly esSuperadmin = computed(() => this.rol() === 'SUPERADMIN');

  constructor(private http: HttpClient, private router: Router) {}

  /** "usuario" puede ser un correo o una cédula. */
  entrar(usuario: string, clave: string) {
    return this.http.post<Sesion>(`${entorno.api}/auth/login`, { usuario, clave })
      .pipe(tap(sesion => {
        localStorage.setItem(LLAVE, JSON.stringify(sesion));
        this._sesion.set(sesion);
      }));
  }

  salir() {
    localStorage.removeItem(LLAVE);
    this._sesion.set(null);
    this.router.navigate(['/entrar']);
  }

  get token() { return this._sesion()?.token ?? null; }

  private leerGuardada(): Sesion | null {
    try {
      const crudo = localStorage.getItem(LLAVE);
      return crudo ? JSON.parse(crudo) as Sesion : null;
    } catch {
      return null;
    }
  }
}
