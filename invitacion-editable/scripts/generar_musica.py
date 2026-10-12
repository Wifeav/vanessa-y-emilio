"""Genera una pieza instrumental original, sin muestras ni melodías ajenas."""
from pathlib import Path
import math
import struct
import wave

DESTINO = Path(__file__).resolve().parents[1] / 'assets/musica/romantica.wav'
SR = 22050
PASO = 60 / 76 / 2
ACORDES = [(53, 57, 60, 65), (50, 57, 62, 65), (46, 53, 58, 62), (48, 55, 60, 64)]
MELODIA = [77, 76, 72, 74, 77, 81, 79, 77, 74, 72, 70, 74, 76, 72, 67, 72]
duracion = PASO * 128 + 2.2
muestras = [0.0] * math.ceil(duracion * SR)

def nota(midi, inicio, largo, volumen):
    frecuencia = 440 * 2 ** ((midi - 69) / 12)
    for i in range(int(largo * SR)):
        n = int(inicio * SR) + i
        if n >= len(muestras):
            break
        t = i / SR
        ataque = min(1, t / .015)
        salida = min(1, max(0, largo - t) / .25)
        envolvente = ataque * salida * math.exp(-2.05 * t)
        sonido = sum(a * math.sin(2 * math.pi * frecuencia * h * t) for h, a in [(1, .76), (2, .16), (3, .055), (4, .025)])
        muestras[n] += sonido * envolvente * volumen

for paso in range(128):
    acorde = ACORDES[(paso // 8) % 4]
    patron = [0, 1, 2, 3, 2, 1, 2, 1]
    nota(acorde[patron[paso % 8]], paso * PASO, 2.5, .17)
    if paso % 8 == 0:
        nota(acorde[0] - 12, paso * PASO, 3.8, .16)
        nota(MELODIA[(paso // 8) % len(MELODIA)], paso * PASO + .02, 2.9, .13)

# Una reverberación suave calculada a partir de la propia composición.
seco = muestras.copy()
for retraso, nivel in [(.12, .09), (.29, .065), (.44, .04)]:
    d = int(retraso * SR)
    for i in range(d, len(muestras)):
        muestras[i] += seco[i - d] * nivel
maximo = max(abs(x) for x in muestras) or 1
DESTINO.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(DESTINO), 'wb') as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    audio = bytearray()
    for i, valor in enumerate(muestras):
        fundido = min(1, i / (SR * .3), (len(muestras) - i) / (SR * 1.7))
        audio.extend(struct.pack('<h', round(valor / maximo * .75 * 32767 * fundido)))
    w.writeframes(audio)
print(f'Composición original: {DESTINO.name}, {duracion:.1f} segundos')
