# -*- coding: utf-8 -*-
"""Reto 🔍 Hay un impostor a bordo (fase 5.4). Diseño: docs/diseno/fase-5-retos.md §4.4

El alumno escribe investigar(log) y recibe el registro del sistema EN BRUTO (un único texto
de unas 1.500 líneas). Devuelve el nombre del culpable.
  variante "reactor" (I1) → el único tripulante que estaba en la sala del sabotaje en la alerta
                            (diccionarios como estado: tarjeta → nombre, tarjeta → sala)
  variante "apagon"  (I2) → el registro de puertas se apaga durante el crimen: el culpable es el
                            único que pudo ir a la sala y volver a donde aparece en el RECUENTO
                            (grafo de salas deducido de las PUERTA y distancias con BFS)

El generador simula de verdad a la tripulación y coloca el crimen para que haya exactamente un
culpable; además lo comprueba resolviendo el propio log (las mismas funciones que usan las pruebas).
"""

from collections import deque

from .base import Mision, AccionInvalida

VARIANTES = ('reactor', 'apagon')
# Todas en masculino singular para que los mensajes digan «al hangar», «del reactor»...
SALAS = ['comedor', 'hangar', 'laboratorio', 'reactor', 'puente', 'taller',
         'gimnasio', 'invernadero', 'observatorio', 'muelle']
NOMBRES = ['Vega', 'Okafor', 'Lindqvist', 'Tanaka', 'Moreau', 'Haddad',
           'Novak', 'Quispe', 'Adeyemi', 'Kowalski', 'Rossi', 'Ibarra']
MIN_PASILLO = 2          # minutos para cruzar un pasillo (lo dice el enunciado de I2)
TRIPULANTES = 6
SALAS_ESTACION = 7
TRAMPAS = {
    'reactor': ('denegado', 'despues', 'dron'),
    'apagon': ('justo', 'denegado'),
}
MENSAJES = [
    'voy al {a} -> luego al {b}',
    '¿alguien ha visto mi taza? creo que está en el {a}',
    'ruta {a} -> {b} despejada',
    'nos vemos en el {a}',
    'la puerta del {a} hace un ruido raro',
    'informe: {a} sin novedad',
    'cambio de turno en el {a} -> confirmad',
    'subo al {b} en cuanto acabe en el {a}',
]
TAREAS_DRON = ['limpieza', 'revisión de filtros', 'calibrado', 'inventario']


def hora(t):
    return f'{t // 60:02d}:{t % 60:02d}'


def distancias(vecinos, origen):
    """BFS: número mínimo de pasillos desde origen."""
    dist = {origen: 0}
    cola = deque([origen])
    while cola:
        sala = cola.popleft()
        for vecina in vecinos.get(sala, ()):
            if vecina not in dist:
                dist[vecina] = dist[sala] + 1
                cola.append(vecina)
    return dist


def ruta(vecinos, origen, destino):
    """Un camino más corto (lista de salas) para animarlo en el visor."""
    previa = {origen: None}
    cola = deque([origen])
    while cola:
        sala = cola.popleft()
        if sala == destino:
            break
        for vecina in sorted(vecinos.get(sala, ())):
            if vecina not in previa:
                previa[vecina] = sala
                cola.append(vecina)
    if destino not in previa:
        return []
    camino = [destino]
    while previa[camino[-1]] is not None:
        camino.append(previa[camino[-1]])
    return camino[::-1]


# ---------------- Soluciones de referencia (las usan el generador y las pruebas) ----------------

def _lineas(log):
    for n, linea in enumerate(log.splitlines(), start=1):
        if linea.startswith('['):
            yield n, linea.split()


def sospechosos_reactor(log, ignorar_denegadas=False, por_minuto=False):
    """I1: quién está en la sala del sabotaje en la alerta. Las opciones imitan errores típicos."""
    nombres, sala_de = {}, {}
    alerta = None
    for _, partes in _lineas(log):
        if alerta and por_minuto and partes[0] != alerta[0]:
            break
        tipo = partes[1]
        if tipo == 'TRIPULACION':
            nombres[partes[2]] = partes[3]
            sala_de[partes[2]] = 'comedor'
        elif tipo == 'PUERTA' and partes[2] in nombres and (ignorar_denegadas or partes[-1] != 'DENEGADO'):
            sala_de[partes[2]] = partes[5]
        elif tipo == 'ALERTA' and partes[2] == 'SABOTAJE':
            alerta = (partes[0], partes[3])
            if not por_minuto:
                break
    if not alerta:
        return []
    return sorted(nombres[t] for t, s in sala_de.items() if s == alerta[1])


def _minutos(marca):
    hh, mm = marca.strip('[]').split(':')
    return int(hh) * 60 + int(mm)


def leer_apagon(log, ignorar_denegadas=False):
    """I2: tripulación, mapa deducido, posiciones antes/después y horas del apagón."""
    nombres, sala_de, despues = {}, {}, {}
    vecinos = {}
    apagado = crimen = restaurado = sala = None
    antes = None
    for _, partes in _lineas(log):
        tipo = partes[1]
        if tipo == 'TRIPULACION':
            nombres[partes[2]] = partes[3]
            sala_de[partes[2]] = 'comedor'
        elif tipo == 'PUERTA':
            denegada = partes[-1] == 'DENEGADO'
            if denegada and ignorar_denegadas:
                continue
            a, b = partes[3], partes[5]
            vecinos.setdefault(a, set()).add(b)
            vecinos.setdefault(b, set()).add(a)
            if partes[2] in nombres and not denegada:
                sala_de[partes[2]] = b
        elif tipo == 'ERROR' and 'puertas' in partes:
            apagado = _minutos(partes[0])
            antes = dict(sala_de)
        elif tipo == 'ALERTA' and partes[2] == 'SABOTAJE':
            crimen, sala = _minutos(partes[0]), partes[3]
        elif tipo == 'INFO' and 'restaurado' in partes:
            restaurado = _minutos(partes[0])
        elif tipo == 'RECUENTO':
            despues[partes[2]] = partes[3]
    return {'nombres': nombres, 'vecinos': vecinos, 'antes': antes or {}, 'despues': despues,
            'apagado': apagado, 'crimen': crimen, 'restaurado': restaurado, 'sala': sala}


def sospechosos_apagon(log, estricto=False, ignorar_denegadas=False):
    d = leer_apagon(log, ignorar_denegadas)
    if d['sala'] is None or d['apagado'] is None or d['restaurado'] is None:
        return []
    desde_crimen = distancias(d['vecinos'], d['sala'])
    ida, vuelta = d['crimen'] - d['apagado'], d['restaurado'] - d['crimen']
    infinito = float('inf')
    culpables = []
    for tarjeta, nombre in d['nombres'].items():
        t_ida = MIN_PASILLO * desde_crimen.get(d['antes'].get(tarjeta), infinito)
        t_vuelta = MIN_PASILLO * desde_crimen.get(d['despues'].get(tarjeta), infinito)
        if (t_ida < ida and t_vuelta < vuelta) if estricto else (t_ida <= ida and t_vuelta <= vuelta):
            culpables.append(nombre)
    return sorted(culpables)


class Impostor(Mision):
    id = 'impostor'
    funcion = 'investigar'
    max_ticks = 1
    espera_respuesta = 5.0

    def __init__(self, semilla, params=None):
        super().__init__(semilla, params)
        self.variante = self.params.get('variante', 'reactor')
        if self.variante not in VARIANTES:
            raise ValueError(f'Variante de impostor desconocida: {self.variante}')
        trampas = self.params.get('trampas', list(TRAMPAS[self.variante]))
        self.trampas = set(trampas)
        self.duracion = int(self.params.get('duracion', 150))
        self.respuesta = None
        for _ in range(300):
            if self._generar():
                break
        else:
            raise RuntimeError(f'No se pudo generar el impostor (semilla {semilla}, {self.params})')
        self.log = '\n'.join(self.lineas)

    # ---------------- Estación y tripulación ----------------
    def _estacion(self):
        rng = self.rng
        salas = ['comedor'] + rng.sample(SALAS[1:], SALAS_ESTACION - 1)
        pasillos = set()
        # Árbol alargado (cada sala cuelga de una de las dos anteriores) más uno o dos atajos
        for i in range(1, len(salas)):
            j = rng.randint(max(0, i - 2), i - 1)
            pasillos.add(tuple(sorted((salas[i], salas[j]))))
        for _ in range(rng.randint(1, 2)):
            a, b = rng.sample(salas, 2)
            pasillos.add(tuple(sorted((a, b))))
        self.salas = salas
        self.pasillos = sorted(pasillos)
        self.vecinos = {s: set() for s in salas}
        for a, b in self.pasillos:
            self.vecinos[a].add(b)
            self.vecinos[b].add(a)

    def _generar(self):
        rng = self.rng
        self._estacion()
        self.lineas = []
        self.vistos = set()      # pasillos que aparecen en alguna PUERTA
        self.cruzados = set()    # pasillos que alguien cruzó de verdad (sin DENEGADO)
        nombres = rng.sample(NOMBRES, TRIPULANTES)
        tarjetas = [f'K-{n}' for n in rng.sample(range(100, 1000), TRIPULANTES)]
        self.tripulacion = tarjetas
        self.nombre = dict(zip(tarjetas, nombres))
        self.drones = [f'dron-{n}' for n in sorted(rng.sample(range(1, 10), rng.randint(2, 3)))]
        self.pos = {t: 'comedor' for t in tarjetas}
        self.pos.update({d: rng.choice(self.salas) for d in self.drones})
        self.libre = {x: 0 for x in self.pos}
        self.ultima = {}
        # En I2 hay un pasillo que solo aparece en líneas DENEGADO
        self.prohibido = None
        if self.variante == 'apagon' and 'denegado' in self.trampas:
            self.prohibido = rng.choice(self.pasillos)

        self.lineas.append('=== ESTACIÓN HIPERIÓN · REGISTRO DEL SISTEMA · CICLO '
                           f'{rng.randint(1000, 9999)} ===')
        for t in tarjetas:
            self._linea(0, f'TRIPULACION {t} {self.nombre[t]}')
            self.ultima[t] = len(self.lineas)
        if self.variante == 'reactor':
            return self._generar_reactor()
        return self._generar_apagon()

    # ---------------- Simulación ----------------
    def _linea(self, t, texto):
        self.lineas.append(f'[{hora(t)}] {texto}')

    def _puerta(self, t, quien, destino, denegada):
        origen = self.pos[quien]
        pasillo = tuple(sorted((origen, destino)))
        self.vistos.add(pasillo)
        if denegada:
            self._linea(t, f'PUERTA {quien} {origen} -> {destino} DENEGADO')
            self.libre[quien] = t + 1
            return
        self.cruzados.add(pasillo)
        self._linea(t, f'PUERTA {quien} {origen} -> {destino}')
        self.pos[quien] = destino
        self.libre[quien] = t + self.rng.randint(MIN_PASILLO, 14)
        if quien in self.nombre:
            self.ultima[quien] = len(self.lineas)

    def _intento(self, t, quien):
        destino = self.rng.choice(sorted(self.vecinos[self.pos[quien]]))
        pasillo = tuple(sorted((self.pos[quien], destino)))
        self._puerta(t, quien, destino, pasillo == self.prohibido or self.rng.random() < 0.07)

    def _ruido(self, t):
        rng = self.rng
        k = rng.random()
        if k < 0.4:
            self._linea(t, f'ENERGIA {rng.choice(self.salas)} {rng.randint(35, 100)}%')
        elif k < 0.75:
            a, b = rng.sample(self.salas, 2)
            texto = rng.choice(MENSAJES).format(a=a, b=b)
            self._linea(t, f'COMMS {rng.choice(self.tripulacion)} "{texto}"')
        else:
            dron = rng.choice(self.drones)
            self._linea(t, f'MANTENIMIENTO {dron} {rng.choice(TAREAS_DRON)} en {self.pos[dron]}')

    def _minuto(self, t, quietos=(), puertas=True):
        rng = self.rng
        huecos = [None] * rng.randint(4, 10)
        if puertas:
            huecos += [x for x in self.pos if x not in quietos and self.libre[x] <= t and rng.random() < 0.3]
        rng.shuffle(huecos)
        for quien in huecos:
            if quien is None:
                self._ruido(t)
            else:
                self._intento(t, quien)

    # ---------------- I1: sabotaje en el reactor ----------------
    def _generar_reactor(self):
        rng = self.rng
        crimen = rng.randint(int(self.duracion * 0.55), int(self.duracion * 0.8))
        for t in range(crimen):
            self._minuto(t)
        if not self._crimen_reactor(crimen):
            return False
        for t in range(crimen + 1, self.duracion):
            self._minuto(t)
        log = '\n'.join(self.lineas)
        culpable = self.nombre[self.culpable]
        if sospechosos_reactor(log) != [culpable]:
            return False
        # Cada trampa tiene que morder: el error típico correspondiente da otra respuesta
        if 'denegado' in self.trampas and sospechosos_reactor(log, ignorar_denegadas=True) == [culpable]:
            return False
        if 'despues' in self.trampas and sospechosos_reactor(log, por_minuto=True) == [culpable]:
            return False
        return True

    def _crimen_reactor(self, t):
        rng = self.rng
        ocupadas = {}
        for x in self.tripulacion:
            ocupadas.setdefault(self.pos[x], []).append(x)
        opciones = [(c, sala) for c in self.tripulacion if self.libre[c] <= t
                    for sala in sorted(self.vecinos[self.pos[c]]) if not ocupadas.get(sala)]
        rng.shuffle(opciones)
        for c, sala in opciones:
            cerca = [x for x in self.tripulacion if x != c and self.pos[x] in self.vecinos[sala]]
            entra = [x for x in cerca if self.libre[x] <= t]
            drones = [d for d in self.drones if self.pos[d] in self.vecinos[sala] or self.pos[d] == sala]
            despues = rng.choice(entra) if entra else None
            denegado = rng.choice([x for x in cerca if x != despues] or cerca) if cerca else None
            dron = rng.choice(drones) if drones else None
            if ('despues' in self.trampas and not despues) or ('denegado' in self.trampas and not denegado) \
                    or ('dron' in self.trampas and not dron):
                continue
            for _ in range(rng.randint(1, 3)):
                self._ruido(t)
            if 'denegado' in self.trampas:
                self._puerta(t, denegado, sala, True)
            if 'dron' in self.trampas:
                if self.pos[dron] != sala:
                    self._puerta(t, dron, sala, False)
                self._linea(t, f'MANTENIMIENTO {dron} {rng.choice(TAREAS_DRON)} en {sala}')
            self._puerta(t, c, sala, False)
            for _ in range(rng.randint(0, 2)):
                self._ruido(t)
            self._linea(t, f'ALERTA SABOTAJE {sala}')
            self.linea_alerta = len(self.lineas)
            self.hora_alerta = hora(t)
            self.culpable, self.sala = c, sala
            self.en_alerta = {x: (self.pos[x], self.ultima[x]) for x in self.tripulacion}
            quietos = {c}
            if 'despues' in self.trampas:
                self._puerta(t, despues, sala, False)
                quietos.add(despues)
            self._minuto(t, quietos=quietos)
            return True
        return False

    # ---------------- I2: el apagón ----------------
    def _generar_apagon(self):
        rng = self.rng
        apagado = rng.randint(int(self.duracion * 0.5), int(self.duracion * 0.65))
        for t in range(apagado):
            self._minuto(t)
        for _ in range(rng.randint(1, 4)):
            self._ruido(apagado)
        self._linea(apagado, 'ERROR registro de puertas desactivado')
        antes = {x: self.pos[x] for x in self.tripulacion}
        plan = self._plan_apagon(antes)
        if not plan:
            return False
        sala, culpable, ida, vuelta, despues = plan
        crimen, restaurado = apagado + ida, apagado + ida + vuelta
        # Durante el apagón solo hay ruido (los drones se quedan quietos)
        for t in range(apagado + 1, restaurado):
            self._minuto(t, puertas=False)
            if t == crimen:
                self._linea(t, f'ALERTA SABOTAJE {sala}')
                self._minuto(t, puertas=False)
        self._linea(restaurado, 'INFO registro de puertas restaurado')
        for x in self.tripulacion:
            self._linea(restaurado, f'RECUENTO {x} {despues[x]}')
            self.pos[x] = despues[x]
            self.libre[x] = restaurado + MIN_PASILLO
        for t in range(restaurado + 1, self.duracion):
            self._minuto(t)

        # El mapa del log tiene que ser el de verdad (y el pasillo trampa, solo con DENEGADO)
        if self.vistos != set(self.pasillos):
            return False
        if self.prohibido and (self.prohibido in self.cruzados):
            return False
        log = '\n'.join(self.lineas)
        nombre = self.nombre[culpable]
        if sospechosos_apagon(log) != [nombre]:
            return False
        if 'justo' in self.trampas and sospechosos_apagon(log, estricto=True) == [nombre]:
            return False
        if 'denegado' in self.trampas and sospechosos_apagon(log, ignorar_denegadas=True) == [nombre]:
            return False
        self.culpable, self.sala = culpable, sala
        self.antes, self.despues = antes, despues
        self.horas = {'apagado': apagado, 'crimen': crimen, 'restaurado': restaurado}
        return True

    def _plan_apagon(self, antes):
        """Sala, culpable, minutos de ida y de vuelta y dónde aparece cada uno en el RECUENTO."""
        rng = self.rng
        dist = {s: distancias(self.vecinos, s) for s in self.salas}
        salas = list(self.salas)
        rng.shuffle(salas)
        for sala in salas:
            tripulacion = list(self.tripulacion)
            rng.shuffle(tripulacion)
            for culpable in tripulacion:
                destinos = list(self.salas)
                rng.shuffle(destinos)
                for final in destinos:
                    d_ida, d_vuelta = dist[antes[culpable]][sala], dist[sala][final]
                    if not d_ida or not d_vuelta:
                        continue
                    holguras = [rng.randint(0, 2), rng.randint(0, 2)]
                    if 'justo' in self.trampas:
                        holguras[rng.randint(0, 1)] = 0
                    ida = MIN_PASILLO * d_ida + holguras[0]
                    vuelta = MIN_PASILLO * d_vuelta + holguras[1]
                    despues = {culpable: final}
                    for x in self.tripulacion:
                        if x == culpable:
                            continue
                        b = antes[x]
                        # Pudo llegar a esa sala en el apagón, pero no pasando por la del crimen a tiempo
                        posibles = [s for s in self.salas
                                    if MIN_PASILLO * dist[b][s] <= ida + vuelta
                                    and not (MIN_PASILLO * dist[b][sala] <= ida and MIN_PASILLO * dist[sala][s] <= vuelta)]
                        if not posibles:
                            break
                        despues[x] = rng.choice(posibles)
                    else:
                        return sala, culpable, ida, vuelta, despues
        return None

    # ---------------- Mensajes ----------------
    def sensores(self):
        return {}

    def mensaje(self):
        return {'args': [self.log]}

    def aplicar(self, accion):
        if not isinstance(accion, str):
            raise AccionInvalida(f'Devuelve el NOMBRE del tripulante como texto (por ejemplo "Vega"), no {accion!r}'[:200])
        self.respuesta = accion
        acusado = accion.strip().lower()
        culpable = self.nombre[self.culpable]
        por_nombre = {n.lower(): t for t, n in self.nombre.items()}
        if acusado == culpable.lower():
            if self.variante == 'reactor':
                self.terminar(True, f'✅ Confesión obtenida: {culpable} era la única persona en el {self.sala} durante el sabotaje')
            else:
                self.terminar(True, f'✅ Confesión obtenida: solo {culpable} pudo ir al {self.sala} y volver a tiempo')
            return
        tarjeta = por_nombre.get(acusado) or (accion.strip().upper() if accion.strip().upper() in self.nombre else None)
        if tarjeta and acusado not in por_nombre:
            self.terminar(False, f'❌ «{accion.strip()}» es una tarjeta: devuelve el nombre del tripulante')
        elif not tarjeta:
            self.terminar(False, f'❌ «{accion.strip()[:40]}» no es nadie de la tripulación')
        elif self.variante == 'reactor':
            sala, linea = self.en_alerta[tarjeta]
            numero = f'{linea:,}'.replace(',', '.')
            self.terminar(False, f'❌ {self.nombre[tarjeta]} estaba en el {sala} en la alerta (línea {numero})')
        else:
            t = self._tiempos(tarjeta)
            self.terminar(False, f'❌ {self.nombre[tarjeta]} no pudo: ida {t["ida"]} min (máx. {t["ida_max"]}), '
                                 f'vuelta {t["vuelta"]} min (máx. {t["vuelta_max"]})')

    def _tiempos(self, tarjeta):
        dist = distancias(self.vecinos, self.sala)
        return {
            'ida': MIN_PASILLO * dist[self.antes[tarjeta]], 'vuelta': MIN_PASILLO * dist[self.despues[tarjeta]],
            'ida_max': self.horas['crimen'] - self.horas['apagado'],
            'vuelta_max': self.horas['restaurado'] - self.horas['crimen'],
        }

    # ---------------- Visor ----------------
    def fotograma(self):
        if self.fin is None:
            return {'fase': 'inicio'}
        # Solo viaja en escenarios visibles: tras el intento se enseña la solución
        datos = {'fase': 'fin', 'acusado': self.respuesta if isinstance(self.respuesta, str) else None,
                 'culpable': self.nombre[self.culpable], 'sala': self.sala}
        if self.variante == 'reactor':
            datos.update({
                'hora': self.hora_alerta, 'linea_alerta': self.linea_alerta,
                'tripulantes': [{'nombre': self.nombre[t], 'tarjeta': t, 'sala': self.en_alerta[t][0],
                                 'linea': self.en_alerta[t][1]} for t in self.tripulacion],
            })
        else:
            tripulantes = []
            for t in self.tripulacion:
                tiempos = self._tiempos(t)
                tripulantes.append({
                    'nombre': self.nombre[t], 'tarjeta': t, 'antes': self.antes[t], 'despues': self.despues[t],
                    'ida': tiempos['ida'], 'vuelta': tiempos['vuelta'],
                    'ruta_ida': ruta(self.vecinos, self.antes[t], self.sala),
                    'ruta_vuelta': ruta(self.vecinos, self.sala, self.despues[t]),
                    'pudo': tiempos['ida'] <= tiempos['ida_max'] and tiempos['vuelta'] <= tiempos['vuelta_max'],
                })
            tiempos = self._tiempos(self.culpable)
            datos.update({
                'apagado': hora(self.horas['apagado']), 'crimen': hora(self.horas['crimen']),
                'restaurado': hora(self.horas['restaurado']),
                'ida_max': tiempos['ida_max'], 'vuelta_max': tiempos['vuelta_max'], 'tripulantes': tripulantes,
            })
        return datos

    def _plano(self):
        return {'salas': list(self.salas),
                'pasillos': [{'a': a, 'b': b, 'solo_denegado': (a, b) == self.prohibido} for a, b in self.pasillos]}

    def escena(self):
        # Tras ejecutar, el visor dibuja la estación (en I2, el grafo que había que deducir)
        return {'variante': self.variante, 'lineas': len(self.lineas), **self._plano()}

    def material(self):
        datos = {'variante': self.variante, 'lineas': len(self.lineas), 'log': self.log}
        # En I1 el plano se enseña; en I2 deducirlo es parte del reto
        if self.variante == 'reactor':
            datos.update(self._plano())
        return datos

    def estrellas(self):
        return 3
