# Comentarios de Noticias

Las noticias publicadas tienen una conversación pública, en texto plano. Se usa el nombre de usuario de `account_private.profiles`; no se publican correos ni UUID de autores. Esta función depende de la migración de nombres de usuario `20261015115626_account_usernames.sql`.

## Permisos

- Visitantes: leer comentarios de artículos publicados, en páginas de 20 elementos, de más reciente a más antiguo.
- Cuenta confirmada y sesión vigente: crear, editar y borrar comentarios propios. Si tiene MFA configurado, también debe completar ese desafío.
- Editor activo: borrar comentarios en sus artículos, sin modificar el texto de otras personas.
- Propietario editorial: borrar comentarios en cualquier artículo publicado.
- Un artículo despublicado oculta su conversación; al eliminarlo se eliminan sus comentarios. Una cuenta eliminada pierde la atribución y muestra «Cuenta eliminada».

Acceder al panel editorial sin permisos muestra una pantalla específica y conserva la sesión general de la cuenta. Cambiar de cuenta o cerrar sesión requiere una acción explícita.

## Modelo y API

Tablas privadas con RLS y sin permisos directos de `anon` o `authenticated`:

- `news_private.comments`: UUID, noticia, autor, texto y fechas. Índices por noticia/fecha/UUID y autor.
- `news_private.comment_limits`: contador persistente por cuenta. El borrado de comentarios no reinicia el contador.

RPC públicas `SECURITY INVOKER` que delegan en funciones privadas con `search_path=''`:

- `list_news_comments(article_id, before_at, before_id)`: lectura pública solo si el artículo está publicado. Paginación por fecha y UUID; devuelve `items` y `nextCursor`.
- `create_news_comment(article_id, comment_id, comment_body, expected_user_id)`: UUID generado por el cliente para que reintentar el mismo envío no duplique el comentario.
- `edit_news_comment(article_id, comment_id, comment_body, expected_updated_at, expected_user_id)`: solo el autor, con control de versión.
- `delete_news_comment(article_id, comment_id, expected_updated_at, expected_user_id)`: autor o moderador autorizado, con confirmación en la interfaz y control de versión.

Las mutaciones comprueban la cuenta, la sesión, MFA, el propietario esperado y la publicación de la noticia. El token se fija antes de enviar la petición para evitar que un cambio de cuenta reasigne una operación pendiente. Los bloqueos de fila coordinan cambios de publicación, comentarios y límites de uso.

El texto debe contener entre 1 y 2000 caracteres no vacíos. Se representa mediante nodos de texto de React, nunca con `dangerouslySetInnerHTML`. Los envíos están limitados a uno cada 20 segundos y 20 por hora por cuenta. Estos límites se verifican en Postgres; no dependen del reloj ni del JavaScript del navegador.

## Interfaz y validación

Las rejillas editoriales usan el ancho disponible después del sidebar mediante container queries. Slug y portada comparten fila en escritorio; el resto de campos conserva su ancho completo. El formulario de acceso tiene ancho máximo de 500 px. Se mantienen la previsualización, las invitaciones, MFA y el acceso directo de edición desde una noticia.

- `npm run test:news-comments`: migración real en PGlite; permisos, aislamiento, moderación, MFA, estado de publicación, límites, concurrencia por versión, privacidad, paginación y cascadas.
- `npm run test:news-layout-comments-ui`: listado, artículo, acceso y editor para visitantes/lectores/editores/propietario; 320, 390, 768, 1280 y 1920 px, temas claro/oscuro y apariencia estándar/Liquid Glass; publicación, edición, borrado, errores y carga adicional.
- `npm run test:news-article-editor-ui`: acceso directo a edición, permisos y segundo factor existentes.
