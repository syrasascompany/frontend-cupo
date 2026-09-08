import { Routes } from "@angular/router";
import { guardaRol, guardaSesion } from "./core/guardas";

export const rutas: Routes = [
  {
    // La página pública. Es la raíz del sitio.
    path: "",
    pathMatch: "full",
    loadComponent: () =>
      import("./paginas/landing.component").then((m) => m.LandingComponent),
  },
  {
    path: "recuperar",
    loadComponent: () =>
      import("./paginas/recuperar.component").then((m) => m.RecuperarComponent),
  },
  { path: "entrar", redirectTo: "", pathMatch: "full" },
  {
    path: "",
    canActivate: [guardaSesion],
    loadComponent: () =>
      import("./layout/armazon.component").then((m) => m.ArmazonComponent),
    children: [
      {
        path: "agenda",
        canActivate: [guardaRol("ADMIN")],
        loadComponent: () =>
          import("./paginas/agenda.component").then((m) => m.AgendaComponent),
      },
      {
        path: "equipo",
        canActivate: [guardaRol("ADMIN")],
        loadComponent: () =>
          import("./paginas/equipo.component").then((m) => m.EquipoComponent),
      },
      {
        path: "servicios",
        canActivate: [guardaRol("ADMIN")],
        loadComponent: () =>
          import("./paginas/servicios.component").then(
            (m) => m.ServiciosComponent,
          ),
      },
      {
        path: "ausencias",
        canActivate: [guardaRol("ADMIN")],
        loadComponent: () =>
          import("./paginas/ausencias.component").then(
            (m) => m.AusenciasComponent,
          ),
      },
      {
        path: "reportes",
        canActivate: [guardaRol("ADMIN")],
        loadComponent: () =>
          import("./paginas/reportes.component").then(
            (m) => m.ReportesComponent,
          ),
      },
      {
        path: "espera",
        canActivate: [guardaRol("ADMIN")],
        loadComponent: () =>
          import("./paginas/espera.component").then((m) => m.EsperaComponent),
      },
      {
        path: "mi-dia",
        canActivate: [guardaRol("TRABAJADORA")],
        loadComponent: () =>
          import("./paginas/mi-dia.component").then((m) => m.MiDiaComponent),
      },
      {
        path: "empresas",
        canActivate: [guardaRol("SUPERADMIN")],
        loadComponent: () =>
          import("./paginas/empresas.component").then(
            (m) => m.EmpresasComponent,
          ),
      },
    ],
  },
  { path: "**", redirectTo: "" },
];
