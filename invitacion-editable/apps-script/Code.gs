/**
 * RSVP privado de Vanessa y Emilio.
 * Las propiedades SHEET_ID y CONFIG_URL se establecen en tu proyecto de Apps Script.
 * Los textos, colores y fecha límite se leen de configuracion.json en GitHub Pages.
 * Las funciones terminadas en _ son privadas y no se exponen a google.script.run.
 */
const CABECERAS_ = ['Fecha y hora', 'Nombre', 'Apellidos', 'Teléfono', 'Asistencia'];

function propiedades_() {
  const p = PropertiesService.getScriptProperties();
  const id = p.getProperty('SHEET_ID');
  const url = p.getProperty('CONFIG_URL');
  if (!id || !/^https:\/\/[a-z0-9-]+\.github\.io\/(?:[a-z0-9_.-]+\/)*configuracion\.json$/i.test(url || '')) {
    throw new Error('Configuración del servidor pendiente.');
  }
  return { id: id, url: url, origen: url.match(/^https:\/\/[^/]+/)[0].toLowerCase() };
}

function fechaValida_(s) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s || '') && !isNaN(Date.parse(s + 'T12:00:00-05:00')) && Utilities.formatDate(new Date(s + 'T12:00:00-05:00'), 'America/Guayaquil', 'yyyy-MM-dd') === s;
}

function cargarConfiguracion_() {
  const p = propiedades_();
  const respuesta = UrlFetchApp.fetch(p.url + '?v=' + Date.now(), { muteHttpExceptions: true, followRedirects: true });
  if (respuesta.getResponseCode() !== 200) throw new Error('No se pudo leer la configuración publicada.');
  const c = JSON.parse(respuesta.getContentText());
  if (!fechaValida_(c.fechaLimiteRSVP) || !c.rsvp || !c.colores) throw new Error('La configuración publicada no es válida.');
  return c;
}

function prepararHojas_() {
  const libro = SpreadsheetApp.openById(propiedades_().id);
  libro.setSpreadsheetTimeZone('America/Guayaquil');
  let hoja = libro.getSheetByName('Respuestas');
  if (!hoja) hoja = libro.insertSheet('Respuestas');
  if (hoja.getLastRow() === 0) hoja.getRange(1, 1, 1, 5).setValues([CABECERAS_]);
  const cab = hoja.getRange(1, 1, 1, 5).getValues()[0];
  if (JSON.stringify(cab) !== JSON.stringify(CABECERAS_)) throw new Error('Revisa las cinco cabeceras de la pestaña Respuestas.');
  hoja.getRange(1, 1, 1, 5).setBackground('#203A32').setFontColor('#F7F3EB').setFontWeight('bold');
  hoja.setFrozenRows(1);
  hoja.setColumnWidth(1, 180); hoja.setColumnWidth(2, 150); hoja.setColumnWidth(3, 180); hoja.setColumnWidth(4, 175); hoja.setColumnWidth(5, 130);
  if (!libro.getSheetByName('_Control')) {
    const control = libro.insertSheet('_Control');
    control.getRange(1, 1, 1, 4).setValues([['Solicitud', 'Huella', 'Asistencia', 'Fecha']]);
    control.hideSheet();
  }
  SpreadsheetApp.flush();
}

function escapeJson_(obj) {
  return JSON.stringify(obj).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}

function doGet(e) {
  try {
    const p = propiedades_(), c = cargarConfiguracion_();
    const token = String(e && e.parameter && e.parameter.token || '');
    if (!/^[a-f0-9]{32}$/.test(token)) return HtmlService.createHtmlOutput('Abre el formulario desde la invitación.');
    const plantilla = HtmlService.createTemplateFromFile('Formulario');
    plantilla.datos = escapeJson_({ rsvp: c.rsvp, colores: c.colores, fechaLimite: c.fechaLimiteRSVP, cerrado: estaCerrado_(c), origen: p.origen, token: token });
    return plantilla.evaluate().setTitle(c.rsvp.titulo).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL).addMetaTag('viewport', 'width=device-width, initial-scale=1');
  } catch (error) {
    return HtmlService.createHtmlOutput('<p style="font-family:Georgia,serif">No fue posible cargar el formulario. Vuelve a intentarlo más adelante.</p>').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
}

function normalizarNombre_(s) {
  return String(s).replace(/^'/, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function huella_(nombre, apellidos, telefono) {
  const t = [normalizarNombre_(nombre), normalizarNombre_(apellidos), String(telefono).replace(/^'/, '').replace(/[\s().-]/g, '')].join('|');
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, t, Utilities.Charset.UTF_8).map(b => ('0' + ((b + 256) % 256).toString(16)).slice(-2)).join('');
}

function validarSolicitud_(s) {
  if (!s || typeof s !== 'object') throw new Error('INVALIDO');
  const nombre = String(s.nombre || '').trim().replace(/\s+/g, ' ');
  const apellidos = String(s.apellidos || '').trim().replace(/\s+/g, ' ');
  const telefono = String(s.telefono || '').trim().replace(/[\s().-]/g, '');
  const asistencia = s.asistencia;
  const solicitud = String(s.solicitud || '');
  if (!nombre || !apellidos || nombre.length > 100 || apellidos.length > 100 || /[\x00-\x1f]/.test(nombre + apellidos)) throw new Error('INVALIDO');
  if (!/^\+[1-9]\d{7,14}$/.test(telefono)) throw new Error('TELEFONO');
  if (!['Sí', 'No'].includes(asistencia) || !/^[a-f0-9]{32}$/.test(solicitud) || String(s.website || '')) throw new Error('INVALIDO');
  return { nombre: nombre, apellidos: apellidos, telefono: telefono, asistencia: asistencia, solicitud: solicitud, huella: huella_(nombre, apellidos, telefono) };
}

function estaCerrado_(c, ahora) {
  return Utilities.formatDate(ahora || new Date(), 'America/Guayaquil', 'yyyy-MM-dd') > c.fechaLimiteRSVP;
}

function textoSeguro_(s) {
  return /^[=+@-]/.test(s) ? "'" + s : s;
}

function guardarConfirmacion(solicitud) {
  let lock;
  try {
    const d = validarSolicitud_(solicitud), c = cargarConfiguracion_();
    lock = LockService.getScriptLock();
    if (!lock.tryLock(20000)) return { ok: false, codigo: 'ERROR' };
    const libro = SpreadsheetApp.openById(propiedades_().id), hoja = libro.getSheetByName('Respuestas'), control = libro.getSheetByName('_Control');
    if (!hoja || !control) throw new Error('Ejecuta prepararHojas_ antes de recibir respuestas.');
    if (JSON.stringify(hoja.getRange(1, 1, 1, 5).getValues()[0]) !== JSON.stringify(CABECERAS_)) throw new Error('Cabeceras no válidas.');
    const registros = hoja.getLastRow() > 1 ? hoja.getRange(2, 1, hoja.getLastRow() - 1, 5).getValues() : [];
    const solicitudes = control.getLastRow() > 1 ? control.getRange(2, 1, control.getLastRow() - 1, 4).getValues() : [];
    const previa = solicitudes.find(r => r[0] === d.solicitud);
    if (previa && (previa[1] !== d.huella || previa[2] !== d.asistencia)) return { ok: false, codigo: 'INVALIDO' };
    const existente = registros.find(r => huella_(r[1], r[2], r[3]) === d.huella);
    if (existente) {
      // Reintentar una petición cuya respuesta se perdió confirma el guardado original.
      // No modifica filas, y no permite cambiar Sí por No.
      if (previa && existente[4] === d.asistencia) return { ok: true, asistencia: existente[4] };
      return { ok: false, codigo: 'DUPLICADO' };
    }
    // El reloj y la fecha límite del servidor deciden si se acepta una nueva fila.
    if (estaCerrado_(c)) return { ok: false, codigo: 'CERRADO' };
    const ahora = new Date();
    // Registrar primero el intento permite recuperarlo si falla el segundo paso.
    if (!previa) { control.appendRow([d.solicitud, d.huella, d.asistencia, ahora]); SpreadsheetApp.flush(); }
    // La operación anterior puede tardar: comprobar otra vez justo antes de escribir.
    if (estaCerrado_(c)) return { ok: false, codigo: 'CERRADO' };
    const fila = hoja.getLastRow() + 1;
    hoja.getRange(fila, 2, 1, 4).setNumberFormat('@');
    hoja.getRange(fila, 1).setNumberFormat('dd/MM/yyyy HH:mm:ss');
    hoja.getRange(fila, 1, 1, 5).setValues([[ahora, textoSeguro_(d.nombre), textoSeguro_(d.apellidos), textoSeguro_(d.telefono), d.asistencia]]);
    SpreadsheetApp.flush();
    return { ok: true, asistencia: d.asistencia };
  } catch (error) {
    const codigo = ['TELEFONO', 'INVALIDO'].includes(error.message) ? error.message : 'ERROR';
    // No devolver ni registrar nombres o números de invitados en mensajes públicos.
    return { ok: false, codigo: codigo };
  } finally {
    if (lock && lock.hasLock()) lock.releaseLock();
  }
}
