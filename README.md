# Origen Manager

Centro de gestión de la agencia ORIGEN: clientes, cobros, agenda, tareas y workflows que generan tareas automáticamente.

**Stack:** React 19 + TypeScript + Tailwind 4 + Vite · Supabase (PostgreSQL + Auth). Sin más dependencias que `react-router-dom`.

## Ejecutar (modo demo, sin configurar nada)

```bash
npm install
npm run dev        # http://localhost:5173
```
Ingresá con cualquier email y contraseña (6+ caracteres). Los datos de ejemplo (ficticios) se cargan solos y viven en el navegador.

## Conectar Supabase (producción)

1. Creá un proyecto en supabase.com.
2. SQL Editor → pegá y ejecutá `supabase/schema.sql`.
3. Authentication → Providers → Email: dejalo activo. Para uso personal, desactivá "Allow new users to sign up" después de crear tu cuenta.
4. Copiá `.env.example` a `.env` y completá `ORIGEN_SUPABASE_URL` y `ORIGEN_SUPABASE_PUBLISHABLE` (la clave `sb_publishable_…`) (Project Settings → API).
5. `npm run build` → publicá la carpeta `dist` (Vercel, Netlify o GitHub Pages; usa rutas con `#`, no requiere configuración extra).
   En Vercel/Netlify cargá las dos variables (tipo Secret alcanza) en el panel del proyecto.

Los datos de ejemplo se pueden cargar desde **Perfil → Cargar datos de ejemplo**.

## Estructura

```
src/
  types/       entidades y tipos (fuente única de verdad)
  lib/         lógica pura y testeada: finance, workflow, tasks, reminders, ai
  services/    supabase.ts · db.ts (adaptador Supabase / local) · auth.ts · seed.ts
  hooks/       useAuth · useData (estado + acciones CRUD) · useForms (formularios de cada entidad)
  components/  ui.tsx (primitivas), FormModal, Calendar, Layout, Search, Reminders, rows
  pages/       una por pantalla
  utils/       fechas y formato
supabase/schema.sql   tablas, relaciones, índices y RLS
```

## Cómo funciona lo importante

- **Workflows:** al crear un evento se elige una plantilla; `tasksFromWorkflow` crea una tarea por paso en `fecha del evento + días del paso`. Los días pueden ser negativos (coordinar antes).
- **Tareas atrasadas:** una tarea pendiente con fecha anterior a hoy se marca ATRASADA y sube al tope de Hoy.
- **Cobros:** cada servicio activo genera automáticamente el cobro del mes actual y el siguiente (sin duplicar). Vencido = pendiente con fecha pasada.
- **Recordatorios:** `lib/reminders.ts` calcula los avisos; hoy se muestran en la campana. Para WhatsApp/Email/Telegram/notificaciones del navegador se implementa `ReminderChannel` y se agrega a `channels`.
- **IA futura:** `lib/ai.ts` define `IntentParser` (texto libre → cliente + trabajo + workflow sugerido) con una versión por reglas. Se reemplaza por una llamada a Claude sin tocar la UI.
- **Cambiar de base de datos:** implementar la interfaz `Store` en `services/db.ts`.

## Tests

```bash
npm test
```

## Notificaciones en el celular (v0.2)

La app es instalable (PWA) y recibe un resumen diario por notificación push aunque esté cerrada.

1. Ejecutá de nuevo `supabase/schema.sql` (agrega la tabla `push_subscriptions`; es seguro repetirlo).
2. Cargá `ORIGEN_VAPID_PUBLIC` en Vercel y hacé Redeploy.
3. Supabase → Edge Functions → nueva función `send-reminders`, pegá `supabase/functions/send-reminders/index.ts`, desactivá "Verify JWT" y desplegá.
4. Edge Functions → Secrets: `CRON_SECRET`, `VAPID_PUBLIC`, `VAPID_PRIVATE`, `VAPID_SUBJECT`.
5. SQL Editor: ejecutá `supabase/notificaciones.sql` con tus valores.
6. En el celular: instalá la app (Android: menú → Instalar app; iPhone: Compartir → Agregar a inicio), abrí **Perfil → Activar notificaciones**.

Push web en iPhone sólo funciona con la app instalada en la pantalla de inicio (iOS 16.4+).
