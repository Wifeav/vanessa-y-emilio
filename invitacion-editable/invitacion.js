/* Toda la información editable está en configuracion.json. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  let C, abierta = false, tokenFormulario, confirmacionGuardada = false;
  const texto = (id, value) => { $(id).textContent = String(value ?? ''); };
  const fechaLegible = (fecha, weekday = false) => {
    const s = new Intl.DateTimeFormat('es-EC', { day: 'numeric', month: 'long', year: 'numeric', ...(weekday ? { weekday: 'long' } : {}), timeZone: 'America/Guayaquil' }).format(new Date(fecha + 'T12:00:00-05:00'));
    return weekday ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  };
  const interpolar = s => String(s).replace(/\{fechaLimite\}/g, fechaLegible(C.fechaLimiteRSVP)).replace(/\{horaInicio\}/g, C.horaInicio).replace(/\{horaFin\}/g, C.horaFin);
  function parrafos(id, contenido) {
    $(id).replaceChildren(...contenido.map(t => { const p = document.createElement('p'); p.textContent = t; return p; }));
  }
  function rutaPublica(ruta) {
    const u = new URL(ruta, document.baseURI);
    if (!['https:', 'http:', 'file:'].includes(u.protocol)) throw new Error('Dirección no válida.');
    return u.href;
  }
  function calendario() {
    const [y, m, dia] = C.fechaBoda.split('-').map(Number);
    texto('mes-calendario', new Intl.DateTimeFormat('es-EC', { month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, 1))));
    texto('anio-calendario', y);
    $('dias-calendario').replaceChildren();
    const offset = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;
    for (let i = 0; i < offset; i++) { const n = document.createElement('span'); n.setAttribute('aria-hidden', 'true'); $('dias-calendario').append(n); }
    const total = new Date(Date.UTC(y, m, 0)).getUTCDate();
    for (let d = 1; d <= total; d++) {
      const n = document.createElement('span'); n.textContent = d;
      if (d === dia) { n.className = 'especial'; n.setAttribute('aria-label', 'Día de la boda: ' + fechaLegible(C.fechaBoda, true)); }
      $('dias-calendario').append(n);
    }
  }
  function reloj() {
    const segundos = Math.max(0, Math.floor((Date.parse(C.fechaBoda + 'T' + C.horaInicio + ':00-05:00') - Date.now()) / 1000));
    $('cuenta').hidden = segundos <= 0; $('cuenta-final').hidden = segundos > 0;
    ['dias', 'horas', 'minutos', 'segundos'].forEach((id, i) => texto(id, String([Math.floor(segundos / 86400), Math.floor(segundos % 86400 / 3600), Math.floor(segundos % 3600 / 60), segundos % 60][i]).padStart(i ? 2 : 1, '0')));
    const cierre = Date.parse(C.fechaLimiteRSVP + 'T00:00:00-05:00') + 86400000;
    const cerrado = Date.now() >= cierre && !confirmacionGuardada;
    $('contenedor-formulario').hidden = cerrado; $('rsvp-cerrado').hidden = !cerrado;
  }
  function cronograma() {
    $('momentos').replaceChildren(...C.cronograma.momentos.map(m => {
      const li = document.createElement('li'), t = document.createElement('time'), contenido = document.createElement('div'), h = document.createElement('h3');
      t.textContent = m.hora; t.dateTime = C.fechaBoda + 'T' + m.hora + ':00-05:00';
      contenido.className = 'momento-texto'; h.textContent = m.titulo; contenido.append(h);
      m.parrafos.forEach(s => { const p = document.createElement('p'); p.textContent = s; contenido.append(p); });
      li.append(t, contenido); return li;
    }));
  }
  function inicializar() {
    Object.entries(C.colores).forEach(([key, value]) => { if (/^#[0-9a-f]{6}$/i.test(value)) document.documentElement.style.setProperty('--' + key, value); });
    document.querySelector('meta[name="theme-color"]').content = C.colores.verde;
    document.title = C.novios + ' · ' + fechaLegible(C.fechaBoda);
    document.querySelector('meta[property="og:title"]').content = C.novios + ' · Nuestra boda';
    document.querySelector('meta[property="og:description"]').content = fechaLegible(C.fechaBoda) + ' · ' + C.ubicacion.nombre + ', ' + C.ubicacion.pais;
    $('nombres').replaceChildren();
    C.novios.split('&').forEach((n, i) => { if (i) { const a = document.createElement('span'); a.className = 'amp'; a.textContent = '&'; $('nombres').append(a); } const s = document.createElement('span'); s.className = 'nombre'; s.textContent = n.trim(); $('nombres').append(s); });
    texto('fecha-portada', fechaLegible(C.fechaBoda)); texto('abrir', C.portada.boton);
    if (C.fotografia.archivo) {
      $('foto').src = /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(C.fotografia.archivo) ? C.fotografia.archivo : rutaPublica(C.fotografia.archivo); $('foto').alt = C.fotografia.descripcion; $('foto').style.objectPosition = C.fotografia.encuadre;
      $('foto').addEventListener('load', () => { $('foto').hidden = false; $('foto-pendiente').hidden = true; });
      if ($('foto').complete && $('foto').naturalWidth) { $('foto').hidden = false; $('foto-pendiente').hidden = true; }
    }
    const mapping = {
      'titulo-bienvenida': C.bienvenida.titulo, 'fecha-completa': fechaLegible(C.fechaBoda, true), 'titulo-fecha': C.fecha.tituloCuenta,
      'cuenta-final': C.fecha.final, 'nota-calendario': C.fecha.notaCalendario, 'nota-horario': interpolar(C.fecha.notaHorario),
      'titulo-ubicacion': C.ubicacion.titulo, 'nombre-lugar': C.ubicacion.nombre, 'pais-lugar': C.ubicacion.pais, 'maps': C.ubicacion.boton,
      'titulo-cronograma': C.cronograma.titulo, 'titulo-vestimenta': C.vestimenta.titulo, 'tipo-vestimenta': C.vestimenta.tipo,
      'titulo-regalo': C.regalo.titulo, 'banco': C.regalo.boton, 'titulo-banco': C.regalo.tituloVentana,
      'copiar-cuenta': C.regalo.copiarCuenta, 'copiar-cedula': C.regalo.copiarCedula, 'cerrar-banco': C.regalo.cerrar,
      'titulo-rsvp': C.rsvp.titulo, 'intro-rsvp': interpolar(C.rsvp.introduccion), 'nota-rsvp': C.rsvp.nota, 'privacidad': C.rsvp.privacidad,
      'label-nombre': C.rsvp.campos.nombre, 'label-apellidos': C.rsvp.campos.apellidos, 'label-telefono': C.rsvp.campos.telefono,
      'label-asistencia': C.rsvp.campos.asistencia, 'label-si': C.rsvp.si, 'label-no': C.rsvp.no,
      'enviar-pendiente': C.rsvp.boton, 'ayuda-telefono': C.rsvp.ayudaTelefono, 'rsvp-cerrado': C.rsvp.cerrado
    };
    Object.entries(mapping).forEach(([key, value]) => texto(key, value));
    C.fecha.unidades.forEach((t, i) => texto('unidad-' + i, t));
    $('formulario-pendiente').elements.telefono.placeholder = C.rsvp.ejemploTelefono;
    $('maps').href = rutaPublica(C.ubicacion.enlace);
    parrafos('parrafos-bienvenida', C.bienvenida.parrafos); parrafos('parrafos-vestimenta', C.vestimenta.parrafos); parrafos('parrafos-regalo', C.regalo.parrafos);
    $('lista-banco').replaceChildren(...Object.entries(C.datosBancarios).flatMap(([key, value]) => { const dt = document.createElement('dt'), dd = document.createElement('dd'); dt.textContent = C.regalo.etiquetas[key]; dd.textContent = value; return [dt, dd]; }));
    if (C.musica.archivo) { $('audio').src = /^data:audio\/wav;base64,[A-Za-z0-9+/=]+$/.test(C.musica.archivo) ? C.musica.archivo : rutaPublica(C.musica.archivo); $('audio').volume = Math.min(1, Math.max(0, C.musica.volumen)); }
    calendario(); cronograma(); reloj(); setInterval(reloj, 1000);
    texto('estado-rsvp', C.rsvp.noDisponible);
  }
  async function tocarMusica() {
    try { await $('audio').play(); estadoMusica(true); }
    catch { estadoMusica(false); texto('aviso-musica', C.musica.error); $('aviso-musica').hidden = false; setTimeout(() => $('aviso-musica').hidden = true, 5000); }
  }
  function estadoMusica(sonando) {
    $('control-musica').setAttribute('aria-pressed', String(sonando)); $('control-musica').setAttribute('aria-label', sonando ? C.musica.silenciar : C.musica.activar); $('musica-silenciada').hidden = sonando;
  }
  function iniciarFormulario() {
    if (!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(C.rsvp.urlAppsScript)) return;
    tokenFormulario = Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('');
    const u = new URL(C.rsvp.urlAppsScript); u.searchParams.set('token', tokenFormulario);
    const frame = document.createElement('iframe'); frame.className = 'rsvp-frame'; frame.title = C.rsvp.titulo; frame.src = u.href; frame.hidden = true;
    const autorizado = origin => /^https:\/\/(?:[a-z0-9-]+\.)?script\.googleusercontent\.com$/.test(origin) || origin === 'https://script.google.com';
    const temporizador = setTimeout(() => texto('estado-rsvp', C.rsvp.error), 20000);
    window.addEventListener('message', event => {
      const d = event.data;
      if (!autorizado(event.origin) || !d || d.canal !== 'vanessa-emilio-rsvp' || d.token !== tokenFormulario) return;
      if (d.tipo === 'listo') { clearTimeout(temporizador); frame.hidden = false; $('formulario-pendiente').hidden = true; $('estado-rsvp').hidden = true; }
      if (d.tipo === 'guardado') { confirmacionGuardada = true; reloj(); }
      if (Number.isFinite(d.alto)) frame.style.height = Math.max(180, Math.min(1800, Math.ceil(d.alto))) + 'px';
    });
    $('contenedor-formulario').append(frame);
  }
  async function copiar(valor) {
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(valor);
      else { const t = document.createElement('textarea'); t.value = valor; t.style.position = 'fixed'; t.style.opacity = '0'; $('datos-banco').append(t); t.focus(); t.select(); const ok = document.execCommand('copy'); t.remove(); if (!ok) throw new Error(); }
      texto('mensaje-copia', C.regalo.copiado);
    } catch { texto('mensaje-copia', C.regalo.errorCopia); }
  }
  $('abrir').addEventListener('click', () => {
    if (!C) return;
    if (!abierta) { abierta = true; $('contenido').hidden = false; if (C.musica.archivo) { $('control-musica').hidden = false; tocarMusica(); } iniciarFormulario(); }
    $('titulo-bienvenida').focus({ preventScroll: true }); $('bienvenida').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  });
  $('control-musica').addEventListener('click', () => { if ($('audio').paused) tocarMusica(); else { $('audio').pause(); estadoMusica(false); } });
  $('banco').addEventListener('click', () => { texto('mensaje-copia', ''); $('datos-banco').showModal(); });
  $('cerrar-banco').addEventListener('click', () => $('datos-banco').close());
  $('datos-banco').addEventListener('click', e => { const b = $('datos-banco').getBoundingClientRect(); if (e.target === $('datos-banco') && (e.clientX < b.left || e.clientX > b.right || e.clientY < b.top || e.clientY > b.bottom)) $('datos-banco').close(); });
  $('copiar-cuenta').addEventListener('click', () => copiar(C.datosBancarios.cuenta)); $('copiar-cedula').addEventListener('click', () => copiar(C.datosBancarios.cedula));
  $('formulario-pendiente').addEventListener('submit', e => e.preventDefault());
  (async () => { try { C = window.CONFIG_PREVIA || await (await fetch('configuracion.json', { cache: 'no-store' })).json(); inicializar(); } catch { $('abrir').disabled = true; $('error-carga').hidden = false; texto('error-carga', 'No se pudo cargar la invitación. Por favor, vuelve a abrir el enlace.'); } })();
})();
