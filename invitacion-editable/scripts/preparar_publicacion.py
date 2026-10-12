"""Publicación estática: valida los datos y actualiza los metadatos de WhatsApp."""
from pathlib import Path
from datetime import date, datetime
from urllib.parse import urlparse
import argparse
import html
import json
import os
import re
import shutil

ROOT = Path(__file__).resolve().parents[1]
MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

def validar(c):
    for clave in ['fechaBoda', 'fechaLimiteRSVP']:
        date.fromisoformat(c[clave])
    for clave in ['horaInicio', 'horaFin']:
        datetime.strptime(c[clave], '%H:%M')
    for v in c['colores'].values():
        if not re.fullmatch(r'#[0-9a-fA-F]{6}', v):
            raise ValueError('Los colores deben tener el formato #203A32.')
    if len(c['fecha']['unidades']) != 4:
        raise ValueError('La cuenta regresiva necesita cuatro unidades.')
    if urlparse(c['ubicacion']['enlace']).scheme != 'https':
        raise ValueError('La ubicación debe ser una dirección HTTPS.')
    if c['rsvp']['urlAppsScript'] and not re.fullmatch(r'https://script\.google\.com/macros/s/[A-Za-z0-9_-]+/exec', c['rsvp']['urlAppsScript']):
        raise ValueError('La URL de Apps Script debe terminar en /exec.')
    for recurso in [c['fotografia']['archivo'], c['musica']['archivo']]:
        if recurso and not urlparse(recurso).scheme:
            if not recurso.startswith('assets/') or '..' in Path(recurso).parts or not (ROOT / recurso).is_file():
                raise ValueError('No se encontró el archivo indicado: ' + recurso)
    for momento in c['cronograma']['momentos']:
        datetime.strptime(momento['hora'], '%H:%M')
        if not momento['titulo'] or not isinstance(momento['parrafos'], list):
            raise ValueError('Revisa el cronograma.')

def publicar(destino):
    c = json.loads((ROOT / 'configuracion.json').read_text(encoding='utf-8'))
    validar(c)
    destino.mkdir(parents=True, exist_ok=True)
    for nombre in ['index.html', 'configuracion.json', 'estilos.css', 'invitacion.js', '.nojekyll']:
        shutil.copy2(ROOT / nombre, destino / nombre)
    shutil.copytree(ROOT / 'assets', destino / 'assets', dirs_exist_ok=True)
    d = date.fromisoformat(c['fechaBoda'])
    fecha = f'{d.day} de {MESES[d.month-1]} de {d.year}'
    pagina = (destino / 'index.html').read_text(encoding='utf-8')
    titulo = c['novios'] + ' · ' + fecha
    descripcion = fecha + ' · ' + c['ubicacion']['nombre'] + ', ' + c['ubicacion']['pais']
    pagina = re.sub(r'<title>.*?</title>', lambda _: '<title>' + html.escape(titulo) + '</title>', pagina)
    for atributo, clave, valor in [('name', 'description', descripcion), ('property', 'og:title', titulo), ('property', 'og:description', descripcion), ('name', 'theme-color', c['colores']['verde'])]:
        patron = r'(<meta ' + atributo + '="' + re.escape(clave) + r'" content=")[^"]*(">)'
        pagina = re.sub(patron, lambda m: m.group(1) + html.escape(valor, quote=True) + m.group(2), pagina)
    foto = c['fotografia']['archivo']
    repo = os.environ.get('GITHUB_REPOSITORY', '')
    if foto:
        if urlparse(foto).scheme == 'https':
            social = foto
        elif repo and '/' in repo:
            propietario, repositorio = repo.split('/', 1)
            social = f'https://{propietario.lower()}.github.io/{repositorio}/{foto}'
        else:
            social = ''
        if social:
            pagina = pagina.replace('</head>', '<meta property="og:image" content="' + html.escape(social, quote=True) + '">\n</head>')
    (destino / 'index.html').write_text(pagina, encoding='utf-8')
    print('Archivos publicados preparados. Toda la información procede de configuracion.json.')

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--destino', type=Path, default=ROOT / 'dist')
    args = parser.parse_args()
    publicar(args.destino)
