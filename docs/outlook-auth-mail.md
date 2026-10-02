# Correo de Auth mediante Outlook

## Estado

Preparación local en `feature/portfolio-supabase`. `supabase/mail/outlook.ts`
construye mensajes de confirmación, invitación editorial, recuperación, acceso
por enlace, cambio de correo (incluidas ambas confirmaciones) y reautenticación.
El transporte usa Microsoft Graph con permiso delegado `Mail.Send`.
No hay endpoint desplegado, hook habilitado ni autorización de Microsoft instalada.
No se ha modificado SMTP, enviado correo ni cambiado la versión.

## Paso que debe completar el titular

1. Abrir https://entra.microsoft.com/ y comprobar acceso a **App registrations**.
   Registrar una aplicación requiere un directorio de Entra y permisos suficientes;
   tener solamente un buzón Outlook no garantiza este acceso. Si pide crear un
   tenant, suscripción o contratar servicios, detenerse y revisar antes de aceptar.
2. Crear `FreeWallet Auth Mail`, compatible con **cuentas personales de Microsoft**.
3. Comunicar únicamente el **Application (client) ID** (no es secreto).
   No enviar contraseña, client secret, refresh token ni códigos de acceso al chat.
4. Configurar el flujo OAuth y aprobar `Mail.Send` y `offline_access` cuando
   esté preparado. No conceder `Mail.Read`, `Mail.ReadWrite` ni permisos Application
   sobre otros buzones. La autorización pertenece al remitente, no a los usuarios
   de FreeWallet; sus cuentas siguen siendo Supabase Auth.

## Pendiente antes de activar

- Provisionamiento administrativo OAuth con PKCE, estado de un solo uso y
  validación del remitente. Registrar el redirect exacto al preparar ese flujo;
  no inventar ni añadir comodines por adelantado.
- Almacenar refresh token cifrado en backend, renovar access tokens y persistir
  la rotación con control de concurrencia. Prever expiración/revocación y
  reconexión administrativa, sin exponer tokens en Vite o localStorage.
- Endpoint Send Email Hook: verificar la firma Standard Webhooks sobre el cuerpo
  original, tolerancia temporal, límite de tamaño y duplicados ANTES de construir
  o enviar mensajes. Este módulo no verifica firmas y no debe exponerse solo.
- Idempotencia persistente por evento/destinatario. Un resultado incierto de Graph
  no debe reenviarse automáticamente ni disparar fallback SMTP duplicado.
- Contemplar las notificaciones de seguridad adicionales de Auth si están activas;
  actualmente las acciones desconocidas se rechazan, no se confirman en silencio.
- Configurar hosts y redirects exactos, tanto `/account` como `/admin/news`.
- Respetar el tiempo máximo del hook y los límites/antispam de Outlook personal;
  confirmar elegibilidad y límites del proyecto antes de habilitarlo.
- Probar con firma real, destinatario controlado e invitación de Noticias.
  Graph 202 solo confirma aceptación: verificar recepción, remitente y enlaces.
- Activar el hook únicamente tras pasar las pruebas. El hook reemplaza SMTP;
  conservar su configuración para rollback, no habilitar ambos como fallback ciego.

Prueba sin credenciales ni red: `npx tsx scripts/test-outlook-mail.ts`.

Fuentes:
- https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app
- https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-auth-code-flow
- https://learn.microsoft.com/en-us/graph/api/user-sendmail
- https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook
