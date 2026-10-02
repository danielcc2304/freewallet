# Cartera multidispositivo con Supabase

## Estado

Implementación en `feature/portfolio-supabase`, desde `origin/dev` (4ebaa11, v5.3.13). La versión no cambia. No se ha publicado la rama ni desplegado la web.

Las cuatro migraciones están aplicadas en `hocuefrnotspaejtmpsw`, región `eu-central-1`, plan Free. Sus nombres locales coinciden con el historial remoto. No se han modificado Noticias, cuentas existentes, SMTP, redirects ni ajustes Auth.

En local se activa mediante un `.env.local` ignorado por Git. El valor por defecto de `.env.example` mantiene desactivada la sincronización hasta verificar el acceso y correo del despliegue.

## Uso

1. Abre `/account`: login, registro con confirmación de correo y recuperación de contraseña.
2. Revisa la cartera del navegador, carga una copia privada JSON o prepara una cartera vacía.
3. Descarga el respaldo y confirma expresamente la importación. No existe importación automática ni reemplazo de una cartera cloud existente.
4. Las operaciones se muestran como completadas solo tras el guardado. El estado global distingue guardando, confirmado, conflicto y error.
5. Para un conflicto, exporta los cambios pendientes y carga explícitamente la versión del servidor. Los reintentos de peticiones inciertas reutilizan el identificador original.

La copia local de origen permanece intacta. En móvil debe importarse desde el navegador donde están los datos; abrir otra URL/puerto no comparte su localStorage.

## Modelo y límites

- Una cartera por cuenta. EUR es la moneda contable. Se rechazan importaciones no EUR; no se convierten costes históricos suponiendo un cambio actual.
- Posiciones y operaciones normalizadas, costes/cantidades en PostgreSQL `numeric` con doce decimales. Cantidades y precios de posiciones fuera de escala se rechazan en vez de redondearse silenciosamente. El histórico importado conserva sus importes originales en el documento; su representación normalizada usa esa escala decimal.
- Documento privado, atómico y versionado para CSV del Excel, histórico, vínculo con el libro, objetivos, metas, watchlist y preferencias de apariencia/API. Solo se permite una lista cerrada de claves.
- Las tablas de valoraciones, preferencias y objetivos de la base se reservan para una normalización posterior. En esta implementación esos apartados se sincronizan mediante el documento privado, no mediante escrituras directas a esas tablas.
- Límite de 8 MiB por documento, 1.000 posiciones, 20.000 movimientos y 50.000 elementos por colección. Máximo 120 comandos/minuto por cartera.
- El libro de operaciones es append-only. Las correcciones requieren una operación explícita. Activos vendidos/eliminados conservan sus movimientos.
- El servidor calcula totales, cantidades restantes y precio medio de compras adicionales. Conserva la fecha inicial al hacer DCA.
- Recibos privados de idempotencia, limitados a las últimas 5.000 revisiones y 90 días. Una petición antigua cuyo recibo ya no exista encontrará conflicto de revisión; no se vuelve a aplicar automáticamente.
- La importación guarda un manifiesto de recuentos. El documento conserva el contenido importado; no certifica su autenticidad ni inventa retornos verificables del Excel.

## Acceso y seguridad

El cliente solo utiliza la URL pública y una clave publicable/anon. Vite rechaza claves privadas antes del bundle; nunca se copia una service_role, sesión, contraseña o clave de mercado al documento.

Todas las tablas tienen RLS. Las tablas públicas de cartera no conceden lectura ni mutaciones directas a authenticated/anon. Las RPC públicas son SECURITY INVOKER; delegan en helpers no expuestos con search_path vacío, que derivan la identidad de Auth y verifican correo confirmado, usuario no anónimo y sesión todavía existente. Ningún comando acepta un propietario proporcionado por el cliente.

Las cuentas con factores verificados requieren JWT aal2 también en servidor. La pantalla permite configurar y verificar TOTP. Si quedó un enrolamiento sin confirmar, su eliminación requiere una acción explícita. No se elimina un factor verificado desde esta pantalla. La verificación de un nuevo factor invalida otras sesiones: se avisa antes de configurarlo.

Cada petición de cartera fija su token a la cuenta esperada antes de enviarse. Un cambio de sesión no puede hacer que la resolución tardía de Authorization envíe el documento de A utilizando el token de B.

Los permisos editoriales de Noticias no conceden acceso a carteras ajenas. Un cliente Auth compartido conserva la clave editorial existente. No se hacen llamadas async de Supabase dentro del callback de onAuthStateChange.

RLS no equivale a cifrado de extremo a extremo. Administradores autorizados del proyecto conservan acceso técnico. Una sesión persistida en el mismo perfil del navegador no protege frente a XSS ni acceso físico. No hay garantía de seguridad absoluta.

## Sincronización y experiencia

- Solo escrituras online. Sin conexión se puede consultar lo ya cargado en esta pestaña.
- Caché de cartera autenticada en memoria; no se guarda una copia privada persistente nueva en localStorage.
- Al cambiar cuenta se limpia la vista, se cancelan solicitudes RPC y se ignoran cotizaciones tardías. No se usa la cartera local como fallback de otra cuenta.
- Cambios pendientes interrumpidos por un cambio de sesión se conservan en memoria separados por propietario y solo pueden exportarse tras volver a esa cuenta. Cerrar la pestaña pierde esa caché: se avisa al salir y se ofrece exportación.
- Cola serial, agrupación de preferencias y revisión esperada en cada comando. No se hace last-write-wins ni una fusión automática de decisiones financieras.
- Comprobación de revisión cada 30 segundos, solo visible/online y sin ediciones pendientes. La misma revisión devuelve una respuesta pequeña sin el documento. No se remonta un formulario que esté siendo editado.
- Los refrescos de precios siguen cada cinco minutos. Los precios son caché efímera, no cambios de costes/cantidades. Las observaciones completas pueden guardar histórico; un conflicto de ese guardado también se notifica, no se sobrescribe en silencio.
- RPC con timeout de 15 segundos; las respuestas de una sesión anterior no se aplican.
- Las rutas siguen cargándose de forma inmediata. No se ha reintroducido carga diferida al navegar.
- Demo y borrado local no pueden sustituir una cartera conectada. Exportación JSON disponible; la eliminación de cuenta/cartera se tramita por el contacto del titular y Supabase Auth, cuyo borrado elimina los datos dependientes.

## Validación realizada

- PostgreSQL local real con PGlite: esquema, RLS/grants, precisión, cascadas, sesiones, MFA, revisión, idempotencia, libro inmutable, cálculo DCA/venta y rollback.
- Coordinador cliente: lista blanca, aislamiento del modo local, precios sin escrituras, confirmaciones, desconexión, reintento exacto, conflicto/exportación y respuestas tardías.
- Navegador con perfiles aislados, Auth simulado y RPC contra PostgreSQL local: confirmación obligatoria, importación de las 15 posiciones de referencia, conservación de cantidades y costes, Dashboard, recarga, segunda cuenta vacía, prohibición de reemplazo y ajuste móvil. El transporte externo se intercepta: esos datos de prueba no llegan a Supabase.
- Supabase real: cuentas/sesiones sintéticas dentro de una transacción revertida verificaron importación, conflicto, aislamiento, denegación de tablas y sesiones revocadas. No son pruebas de login con dos usuarios reales.
- La pantalla local se ha observado conectada con una sesión Auth real. El flujo SMTP de registro/recuperación, TOTP real y la continuidad entre dos dispositivos físicos siguen pendientes de confirmación.
- Auditoría completa de npm sin vulnerabilidades conocidas tras actualizar dependencias y retirar el plugin de pre-renderizado sin uso. SheetJS procede del [paquete oficial 0.20.3](https://docs.sheetjs.com/docs/getting-started/installation/nodejs/). El pre-renderizado existente utiliza Puppeteer actualizado.

Comandos reproducibles:

```powershell
npm run test:portfolio-backend
npm run test:portfolio-sync
npm run test:portfolio-ui
npm run test:dashboard-audit
npm run test:compound-interest
npm run lint
npm run build
npx tsx scripts/test-dashboard-bundle.ts
npm audit
```

Para las pruebas UI arranca Vite en el puerto 5176 con la sincronización local activada. `FREEWALLET_TEST_URL` permite otro puerto localhost. `FREEWALLET_REFERENCE_FILE` permite usar una fixture privada externa al repositorio. Nunca se incorpora la cartera real a Git.

## Antes de activar públicamente

- Confirmar dominio: el generador SEO apunta actualmente a `https://freewallet-v2.vercel.app`.
- Verificar Site URL y redirects exactos `/account`, tanto de producción como de pruebas. Revisar los redirects editoriales existentes antes de modificar la lista. [Guía oficial](https://supabase.com/docs/guides/auth/redirect-urls).
- Verificar/configurar SMTP propio, entrega de confirmación y recuperación con un usuario que no pertenezca al equipo del proyecto. El SMTP por defecto está restringido; tener login funcional no demuestra que el alta pública funcione. [Checklist oficial](https://supabase.com/docs/guides/deployment/going-into-prod).
- Revisar límites de Auth, CAPTCHA, política de contraseñas, recuperación MFA y copias/restauración. No contratar recursos ni habilitar servicios de pago sin autorización.
- El asesor del proyecto sigue mostrando avisos editoriales preexistentes: [search_path de set_news_post_updated_at](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable) y [ejecución pública de funciones SECURITY DEFINER de Noticias](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable). No se han cambiado en esta feature. Sus comprobaciones internas de identidad fueron revisadas, pero necesitan auditoría específica antes de una apertura pública.
- La protección frente a contraseñas filtradas aparece desactivada. Revisar disponibilidad/configuración sin asumir que el plan Free ofrece todas las opciones.
- Las dos tablas privadas sin políticas producen avisos INFO intencionados: default-deny, sin grants de datos; solo acceden los helpers propietarios.
- Probar dos cuentas reales, dos dispositivos, pérdida de red y recuperación por correo/MFA. Las pruebas locales o SQL no sustituyen estas comprobaciones.
- Activar `VITE_PORTFOLIO_CLOUD_ENABLED=true` únicamente en el despliegue aprobado. Desactivar el flag no borra datos cloud; debe avisarse de que la cartera remota queda temporalmente fuera de la vista local.

No ejecutar de nuevo las migraciones ya instaladas ni hacer db push sin contrastar el historial. No automatizar un rollback destructivo sobre datos de usuarios.
