"""Crea un HTML autónomo para revisar sin servidor ni cuentas externas."""
from pathlib import Path
import base64
import json
import sys

root = Path(__file__).resolve().parents[1]
destino = Path(sys.argv[1]) if len(sys.argv) > 1 else root / 'vista-previa.html'
c = json.loads((root / 'configuracion.json').read_text(encoding='utf-8'))
# La vista previa nunca envía respuestas a un servidor real.
c['rsvp']['urlAppsScript'] = ''
musica = root / c['musica']['archivo']
if musica.is_file() and musica.suffix.lower() == '.wav':
    c['musica']['archivo'] = 'data:audio/wav;base64,' + base64.b64encode(musica.read_bytes()).decode('ascii')
foto = root / c['fotografia']['archivo']
if c['fotografia']['archivo'] and foto.is_file():
    mime = {'.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp'}.get(foto.suffix.lower())
    if mime:
        c['fotografia']['archivo'] = 'data:' + mime + ';base64,' + base64.b64encode(foto.read_bytes()).decode('ascii')
        # Se conserva el archivo separado en el proyecto si el recurso no es incorporable.
pagina = (root / 'index.html').read_text(encoding='utf-8')
pagina = pagina.replace('<link rel="stylesheet" href="estilos.css">', '<style>' + (root / 'estilos.css').read_text(encoding='utf-8') + '</style>')
datos = json.dumps(c, ensure_ascii=False).replace('<','\\u003c').replace('\u2028','\\u2028').replace('\u2029','\\u2029')
js = (root / 'invitacion.js').read_text(encoding='utf-8')
pagina = pagina.replace('<script src="invitacion.js" defer></script>', '')
pagina = pagina.replace('</body>', '<script>window.CONFIG_PREVIA=' + datos + ';</script>\n<script>' + js + '</script>\n</body>')
destino.parent.mkdir(parents=True, exist_ok=True)
destino.write_text(pagina, encoding='utf-8')
print('Vista previa autónoma preparada. RSVP deshabilitado hasta configurar la publicación real.')
