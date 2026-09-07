# Cupo — panel

Angular 18 con componentes independientes y señales. Se conecta al backend
de Spring Boot.

## Arrancar

```bash
npm install
npm start          # http://localhost:4200
```

El backend debe estar corriendo en `http://localhost:8080`.
Para cambiarlo, edite `src/environments/environment.ts`.

## Las pantallas y quién las usa

| Ruta | Rol | Para qué |
|---|---|---|
| `/entrar` | todos | Ingreso |
| `/agenda` | ADMIN | El día completo, con una columna por manicurista |
| `/equipo` | ADMIN | Quién trabaja, qué hace, cuánto se demora y su horario |
| `/mi-dia` | TRABAJADORA | Sus citas del día y el botón de finalizar |
| `/empresas` | SUPERADMIN | Dar de alta clientes y ajustar su plan |

Cada quien entra directo a lo suyo: si una trabajadora intenta abrir `/agenda`,
el guarda la devuelve a `/mi-dia`.

## Decisiones que conviene conocer

**La sesión vive en `localStorage`.** Si el token vence, el interceptor detecta
el 401 y saca al usuario sin que la pantalla quede en blanco.

**La grilla se dibuja con posiciones absolutas** calculadas desde la hora de cada
cita, no con una tabla. Por eso una cita de dos horas y media se ve del tamaño
que de verdad ocupa.

**Los cupos los calcula el backend, nunca el panel.** El frontend solo muestra
lo que el motor de disponibilidad le devuelve. Si el cálculo estuviera aquí,
el bot de WhatsApp y el panel podrían ofrecer cosas distintas.

**En el editor de servicios, un tiempo vacío significa «se demora lo normal».**
Y si alguien escribe el mismo número que la duración normal, se guarda como
vacío: así el ajuste solo existe donde de verdad hay diferencia.

## Lo que falta

- Reasignar citas cuando alguien falta (el backend ya lo expone en `/api/reasignacion`)
- Sellar permisos desde la agenda
- Lista de espera
- Reportes de ocupación

## Advertencia

Este código no se compiló al generarlo: en este entorno no hay forma de
instalar las dependencias de Angular. Corra `npm install && npm start` y
corrija lo que salte antes de seguir construyendo.
