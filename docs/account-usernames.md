# Nombres de usuario y acceso

Cada cuenta permanente tiene un nombre de usuario único en `account_private.profiles`, vinculado por `user_id` a Supabase Auth. La cartera sigue perteneciendo al UUID de Auth; cambiar el nombre no mueve ni importa datos.

## Reglas y cuentas existentes

- Entre 3 y 32 caracteres ASCII: letras, números, `.`, `_` y `-`; empieza por letra o número.
- Se guarda en minúsculas y el acceso no distingue mayúsculas.
- Las cuentas existentes reciben el prefijo de su correo. Se normalizan los caracteres incompatibles y se recorta a 32 caracteres. Si el prefijo no es utilizable, se genera `usuario_…`.
- En coincidencias se conserva el nombre simple para la cuenta más antigua; las siguientes reciben `_2`, `_3`, etc. El índice único resuelve también las carreras entre registros o cambios.
- El registro nuevo envía `options.data.username`; un trigger crea el perfil en la misma transacción de Auth. Un nombre explícito duplicado o inválido impide crear la cuenta. Los clientes antiguos y las invitaciones administrativas sin nombre siguen funcionando con un nombre generado.
- Los metadatos de Auth incluyen una copia del nombre para facilitar su visualización, pero nunca autorizan accesos ni resuelven el login. Un cambio directo de metadata no modifica el perfil.

## Acceso y API

El correo y contraseña siguen usando `auth.signInWithPassword`. Para un nombre de usuario, `username-login` resuelve el correo exclusivamente en el servidor y verifica la contraseña con Supabase Auth. Solo devuelve los tokens de una sesión auténtica; el navegador los instala con `auth.setSession`. Se mantiene la confirmación del correo y el desafío MFA habitual. Recuperar la contraseña requiere el correo.

La función permite acceso sin JWT porque es el propio endpoint de login: la autenticación se hace con la contraseña, no con una clave administrativa. `SUPABASE_SERVICE_ROLE_KEY` se usa exclusivamente en el servidor para la resolución privada; nunca se entrega al cliente. Los fallos de credenciales no revelan si existe un nombre o cuál es su correo. Las respuestas usan `Cache-Control: no-store` y no se registran contraseñas ni tokens.

RPC:

- `my_account_profile()`: solo perfil propio, con cuenta confirmada y sesión activa; permite leer el nombre antes del desafío MFA.
- `change_my_username(new_username, expected_user_id)`: exige sesión activa, propietario esperado y MFA si está configurado. Devuelve el nuevo perfil. El identificador anterior deja de resolver inmediatamente.
- `prepare_username_login(login_username, client_hash)`: solo `service_role`; sin permiso de ejecución para `anon` o `authenticated`. No existe un directorio público de nombres y correos.

Las tablas permanecen en un esquema privado, sin permisos directos del cliente y con RLS activado. Sus funciones privilegiadas tienen `search_path=''` y permisos de ejecución explícitos. Las funciones públicas son envoltorios `SECURITY INVOKER`.

## Límites y despliegue

La resolución admite 10 intentos por nombre, 30 por huella de IP y 200 globales por ventana de 5 minutos. Los contadores se actualizan atómicamente en Postgres y persisten aunque se deniegue el intento. Se usan el último salto de `x-forwarded-for`, una huella SHA-256 y límites por cuenta/global independientes de esa cabecera. Se eliminan contadores vencidos de más de un día. Los límites nativos de Supabase Auth siguen aplicándose; los intentos desde la función pueden compartir IP de salida. No se reenvía una IP a Auth mediante una cabecera no compatible con la clave de servicio heredada.

Orden: aplicar `20261015115626_account_usernames.sql`, desplegar `username-login` con `verify_jwt=false` y desplegar el frontend. Los clientes anteriores conservan el acceso por correo. La migración y los triggers no cambian posiciones, movimientos, roles editoriales ni contraseñas.

Validación: `npm run test:account-usernames` ejecuta PostgreSQL local con PGlite, pruebas de permisos y pruebas del endpoint; `npm run test:account-usernames-ui` verifica registro, acceso, edición y presentación con respuestas sintéticas interceptadas.
