# Invitación de Vanessa y Emilio

La página se aloja en GitHub Pages. Los datos principales se editan en **configuracion.json**. El formulario real se integra desde Google Apps Script y guarda cada confirmación en una hoja privada de Google Sheets.

## Qué está preparado

Las ocho secciones solicitadas, calendario completo de julio de 2027, cuenta regresiva hasta el 17 de julio a las 11:30 de Ecuador, ubicación, tres horarios, vestimenta, ventana bancaria, música instrumental original y código de RSVP con cierre del plazo en el servidor.

La fotografía principal no está incluida. El campo de Apps Script está vacío y el formulario permanece deshabilitado hasta completar esa conexión. La existencia de código y pruebas locales no equivale a haber comprobado el guardado real en Google.

## Los archivos

| Archivo | Uso |
| --- | --- |
| configuracion.json | Todos los datos, textos, colores, fotografías, música y fecha límite. |
| index.html | Estructura de las ocho secciones. |
| estilos.css | Diseño y adaptación a pantallas. |
| invitacion.js | Calendario, cuenta regresiva, música, ventana bancaria y formulario integrado. |
| assets/fotos | Tu fotografía principal. |
| assets/musica/romantica.wav | Melodía instrumental original, incluida y sustituible. |
| apps-script/Code.gs | Lógica que guarda en Google Sheets. |
| apps-script/Formulario.html | Campos y mensajes del formulario real. |
| apps-script/appsscript.json | Zona horaria y permisos del proyecto de Google. |
| .github/workflows/publicar.yml | Publicación automática y actualización de los metadatos al editar. |
| scripts/preparar_publicacion.py | Valida configuracion.json y prepara los archivos públicos. |
| pruebas/servidor.cjs | Pruebas locales de guardado, duplicados y fechas. |
| vista-previa.html | Vista previa autónoma. No envía confirmaciones. |

## 1. Crear el repositorio y publicar

1. Abre https://github.com/new con tu cuenta.
2. Nombre recomendado: **vanessa-y-emilio**. Selecciona **Public** y activa **Add a README file** para crear la rama `main`.
3. Crea el repositorio. Si vas a continuar la preparación desde este chat, envía su enlace para que se puedan subir los archivos con la conexión de GitHub.
4. Si lo haces por tu cuenta: descomprime el ZIP y sube el contenido de la carpeta `invitacion-editable` al repositorio, conservando las carpetas. El archivo `index.html` debe quedar en la raíz, no dentro de otra carpeta.
5. Incluye `.github/workflows/publicar.yml`. En un Mac las carpetas que empiezan por punto se muestran con **Cmd + Shift + .**. También puedes usar **Add file → Create new file**, escribir esa ruta completa y pegar el contenido del archivo.
6. Entra en **Settings → Pages → Build and deployment → Source**, selecciona **GitHub Actions**.
7. En **Actions**, abre **Publicar invitación** y pulsa **Run workflow**. Después de la primera publicación, cada cambio en `main` vuelve a publicar automáticamente.
8. Cuando termine, abre el enlace que muestre GitHub Pages. El enlace previsto para el nombre recomendado es `https://wifeav.github.io/vanessa-y-emilio/`, pero solo será real después de una publicación exitosa. Si usas otro usuario o nombre, cambiará.

No necesitas comprar un dominio ni contratar un plan. GitHub Pages con GitHub Free requiere un repositorio público. La publicación depende de las condiciones y cuotas vigentes de GitHub.

## 2. Incorporar la fotografía

1. Elige la fotografía principal de la pareja. Se recomienda formato vertical, JPEG o WebP, ancho de unos 1200 píxeles y menos de 1 MB cuando sea posible.
2. Súbela a **assets/fotos/portada.webp** o, si es JPEG, **assets/fotos/portada.jpg**.
3. Abre `configuracion.json` y cambia `fotografia.archivo` de `""` a `"assets/fotos/portada.webp"` o a la ruta exacta del JPEG.
4. Ajusta `fotografia.encuadre` si necesitas mover el recorte. `"50% 45%"` centra horizontalmente y coloca el foco ligeramente por encima del centro.
5. Guarda el cambio en `main`. La publicación actualizará la página y los metadatos de la foto. La aparición en WhatsApp también depende de la caché de WhatsApp.

## 3. Conectar el formulario real

1. Utiliza la hoja privada de respuestas creada en esta conversación, o crea una hoja de Google Sheets si estás utilizando esta copia de forma independiente. Mantén **Compartir → Acceso general → Restringido**.
2. Copia el identificador de la hoja: está entre `/d/` y la siguiente `/` en su dirección.
3. Abre https://script.google.com/home/projects/create con la misma cuenta que puede editar la hoja.
4. Llama al proyecto **RSVP Vanessa y Emilio**. En `Code.gs`, sustituye el contenido inicial por el archivo `apps-script/Code.gs`.
5. Pulsa **+ → HTML**, crea el archivo **Formulario** y pega `apps-script/Formulario.html`. Respeta el nombre.
6. En **Configuración del proyecto**, activa **Mostrar el archivo de manifiesto appsscript.json en el editor**. Abre ese archivo y pega el manifiesto incluido.
7. En **Configuración del proyecto → Propiedades de la secuencia de comandos**, añade estas propiedades:

   | Propiedad | Valor |
   | --- | --- |
   | SHEET_ID | El identificador de tu hoja privada. |
   | CONFIG_URL | La dirección pública de configuracion.json, por ejemplo `https://wifeav.github.io/vanessa-y-emilio/configuracion.json`. |

   Estas propiedades se guardan en tu proyecto de Google. No las pegues dentro del archivo público `configuracion.json`.

8. Guarda. En el selector de funciones elige **prepararHojas_** y pulsa **Ejecutar**. Autoriza tu proyecto para acceder a la hoja. Creará la pestaña oculta `_Control`, necesaria para los reintentos. No contiene una lista pública de invitados.
9. Pulsa **Implementar → Nueva implementación → Aplicación web**. Selecciona **Ejecutar como: Yo** y **Quién tiene acceso: Cualquier persona**. La segunda opción debe permitir personas que no han iniciado sesión. Si tu cuenta de empresa limita el acceso anónimo, necesitarás una cuenta que lo permita.
10. Implementa y copia la URL que termina en **/exec**. La URL `/dev` no sirve para los invitados.
11. En GitHub, edita `configuracion.json`: dentro de `rsvp`, pega esa URL en `urlAppsScript`.
12. Guarda el cambio en `main` y espera a que la publicación termine. El formulario aparecerá dentro de la invitación con sus colores y campos.

El navegador obtiene el formulario de Apps Script. Este llama al servidor mediante `google.script.run`. El agradecimiento solo se muestra cuando el servidor termina la escritura y devuelve éxito. No se usa un envío opaco con `no-cors` que impida comprobar el resultado.

## 4. Comprobar la conexión antes de compartir

1. Abre la invitación publicada en una ventana privada y en un teléfono. Verifica que no pide iniciar sesión en Google.
2. Envía un nombre de prueba con un teléfono internacional y **Sí**. Abre la hoja y comprueba la fila, el teléfono y la hora de Ecuador.
3. Envía otra persona de prueba con **No** y comprueba también esa fila.
4. Desde otra ventana intenta repetir la primera persona con el mismo nombre, apellidos y teléfono. Debe rechazar el duplicado y conservar la fila original.
5. Comprueba la fotografía, el botón de ubicación, la música, la ventana bancaria y los botones de copiar en móvil.
6. Borra las filas ficticias de `Respuestas`, conservando la fila de cabeceras. Elimina también los registros de prueba de `_Control`, sin borrar sus cabeceras. Realiza esto antes de recibir confirmaciones auténticas.

Para comprobar el cierre en el servidor, usa una copia del proyecto y una hoja de pruebas con una fecha límite ya pasada. No cambies el plazo real mientras los invitados estén respondiendo.

## 5. Editar toda la información después de publicar

1. Entra en el repositorio, abre **configuracion.json** y pulsa el lápiz **Edit this file**.
2. Modifica el valor entre las comillas del campo correspondiente. Conserva las comas, comillas y llaves. No añadas comentarios dentro de JSON.
3. Pulsa **Commit changes**, guarda en `main` y espera a que **Publicar invitación** termine.
4. Abre el enlace de la invitación y actualiza la página. Los datos nuevos aparecerán en la web; los visitantes que ya la tenían abierta deben recargarla.

| Quieres cambiar | Campo de configuracion.json |
| --- | --- |
| Nombres | novios |
| Fotografía y recorte | fotografia.archivo, fotografia.descripcion, fotografia.encuadre |
| Fecha de la boda y cuenta regresiva | fechaBoda, horaInicio |
| Horario general | horaInicio, horaFin |
| Textos y títulos de portada y bienvenida | portada, bienvenida |
| Texto de fecha y calendario | fecha |
| Colores | colores |
| Música y volumen | musica.archivo, musica.volumen |
| Ubicación y enlace Maps | ubicacion |
| Horarios y mensajes del cronograma | cronograma.momentos |
| Código de vestimenta | vestimenta |
| Mensaje de regalo y etiquetas de la ventana | regalo |
| Titular, banco, tipo de cuenta, número y cédula | datosBancarios |
| Campos, opciones, mensajes y privacidad de RSVP | rsvp |
| Fecha límite de RSVP | fechaLimiteRSVP |
| URL del sistema que guarda respuestas | rsvp.urlAppsScript |

Las fechas se escriben como `"2027-07-17"`, y los horarios como `"11:30"`. Si cambias el inicio o el final, actualiza también los horarios y textos relacionados de `cronograma.momentos`. El calendario se adapta automáticamente al nuevo mes y día. Los horarios de esta versión corresponden a Ecuador continental (UTC−5).

**La fecha límite se cambia en un solo lugar:** `fechaLimiteRSVP`. El servidor lee este mismo archivo cada vez que recibe un envío. No hay que modificar otra fecha ni volver a publicar Apps Script para cambiar textos, colores o el plazo. Si cambias el nombre del repositorio o de tu usuario, actualiza `CONFIG_URL` en Google.

Para sustituir la música, sube tu archivo autorizado a `assets/musica`, cambia `musica.archivo` y guarda. Se incluye una composición original instrumental de unos 53 segundos, reproducida en bucle. El sonido se intenta iniciar al pulsar **Abrir invitación**, sujeto a las restricciones del navegador.

Si modificas el código de Apps Script: **Implementar → Gestionar implementaciones → Editar → Nueva versión → Implementar**. Utiliza la misma implementación para conservar la URL.

## Datos y límites

El formulario detecta duplicados por nombre, apellidos y teléfono normalizados, con una comprobación en el servidor y bloqueo de escrituras simultáneas. Diferentes personas pueden utilizar el mismo teléfono. Sin verificar la identidad de cada invitado no se garantiza que una persona no responda con otros datos. No hay función para editar la confirmación enviada.

El cierre se aplica desde el **1 de junio de 2027 a las 00:00 de Ecuador**. Un reintento de una petición ya guardada puede recuperar su confirmación después del plazo, sin crear ni modificar una fila. La restricción de nuevas respuestas se aplica en Google, aunque se altere el formulario del navegador.

Las respuestas y teléfonos permanecen en la hoja privada. Los datos bancarios, fotografías, textos y música forman parte de la página pública y pueden ser consultados por sus visitantes. Abrir los datos bancarios en una ventana no los convierte en información privada.

No hay una fecha programada para retirar la página. La disponibilidad y los límites gratuitos dependen de Google y GitHub. Una invitación de uso personal con este tamaño no requiere servicios de pago, dentro de sus condiciones y cuotas vigentes.

## Verificación realizada

La lógica del servidor pasó 19 comprobaciones locales: ambas respuestas, reintentos, duplicados, rechazo de modificaciones, teléfono internacional, textos interpretables como fórmulas, fallos de servicio y el límite exacto de fecha en Ecuador. El código JavaScript y el empaquetado estático se validaron. La hoja nativa fue creada y revisada; el envío real desde la web está pendiente de desplegar Apps Script. No se realizaron pruebas visuales de la invitación en un navegador en este entorno.

Referencias oficiales: https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages · https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site · https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits · https://developers.google.com/apps-script/guides/web · https://developers.google.com/apps-script/guides/services/quotas
