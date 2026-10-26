// Misiones de pilotaje iniciales (las crea la migración 012)

export interface MisionSemilla {
  titulo: string;
  categoria: string;
  nivel: string;
  puntos: number;
  descripcion: string;
  codigoBase: string;
  resultadoEsperado: string;
  solucion: string;
  config: {
    mision: string;
    escenarios: { nombre?: string; semilla: number; params?: Record<string, number>; oculto?: boolean }[];
  };
}

export const misionesIniciales: MisionSemilla[] = [
  {
    titulo: '🚀 Aterrizaje de emergencia',
    categoria: 'Estructuras Condicionales',
    nivel: 'Fácil',
    puntos: 150,
    descripcion: `¡Alerta en la cabina! El piloto automático ha fallado y la nave cae hacia la superficie.
Escribe la función piloto(sensores): se llama 10 veces por segundo y decide la potencia del motor.

Sensores que recibes (un diccionario):
- altura: metros sobre el suelo
- velocidad: m/s (negativa = cayendo)
- combustible: unidades que quedan
- gravedad: la gravedad del planeta (cambia según el escenario)

Devuelve {"empuje": x} con x entre 0 (motor apagado) y 1 (máximo).
Para salvar la nave hay que tocar el suelo a menos de 2 m/s. Con el motor encendido gastas combustible: si se acaba, caes sin remedio.

Pista: no basta con frenar siempre. Piensa en dos situaciones: cuando vas demasiado rápido y cuando ya estás cerca del suelo.`,
    codigoBase: `def piloto(sensores):
    altura = sensores["altura"]
    velocidad = sensores["velocidad"]

    # Tu código aquí: decide cuándo encender el motor

    return {"empuje": 0}
`,
    resultadoEsperado: 'Aterrizar a menos de 2 m/s en todos los escenarios (algunos ocultos).\n⭐⭐ si sobra el 40 % del combustible · ⭐⭐⭐ si sobra el 60 %',
    solucion: `def piloto(sensores):
    altura = sensores["altura"]
    velocidad = sensores["velocidad"]
    if velocidad < -6 or (altura < 25 and velocidad < -1.5):
        return {"empuje": 1}
    return {"empuje": 0}
`,
    config: {
      mision: 'aterrizaje',
      escenarios: [
        { nombre: 'Marte', semilla: 11, params: { gravedad: 3.71 } },
        { nombre: 'Luna', semilla: 12, params: { gravedad: 1.62 } },
        { semilla: 13, params: { gravedad: 2.4 }, oculto: true },
        { semilla: 14, params: { gravedad: 3.71 }, oculto: true },
        { semilla: 15, params: { gravedad: 1.62 }, oculto: true },
      ],
    },
  },
  {
    titulo: '☄️ Cinturón de asteroides',
    categoria: 'Arrays y Listas',
    nivel: 'Intermedio',
    puntos: 200,
    descripcion: `Tu nave tiene que cruzar el cinturón de asteroides de Júpiter. El cinturón tiene varios carriles y cada tick puedes moverte un carril a la izquierda, a la derecha o mantenerte.

Sensores que recibes:
- carril: en qué carril estás (0 es el de la izquierda)
- carriles: cuántos carriles hay
- distancias: una lista con, para cada carril, cuántos ticks faltan para que llegue el siguiente asteroide (99 si no hay ninguno a la vista)
- ticks_restantes: cuánto queda para salir del cinturón

Devuelve "izquierda", "derecha" o "mantener". Si un asteroide llega a tu carril, la nave se destruye.

Pista: mira las distancias de tu carril y de los dos de al lado, y ve hacia el que tenga más espacio.`,
    codigoBase: `def piloto(sensores):
    carril = sensores["carril"]
    distancias = sensores["distancias"]

    # Tu código aquí

    return "mantener"
`,
    resultadoEsperado: 'Atravesar el cinturón en todos los escenarios (algunos ocultos).\nMenos maniobras = más estrellas',
    solucion: `def piloto(sensores):
    carril = sensores["carril"]
    distancias = sensores["distancias"]
    opciones = [c for c in (carril, carril - 1, carril + 1) if 0 <= c < sensores["carriles"]]
    mejor = max(opciones, key=lambda c: distancias[c])
    if mejor < carril:
        return "izquierda"
    if mejor > carril:
        return "derecha"
    return "mantener"
`,
    config: {
      mision: 'asteroides',
      escenarios: [
        { nombre: 'Entrada al cinturón', semilla: 21, params: { densidad: 0.35 } },
        { nombre: 'Zona densa', semilla: 22, params: { densidad: 0.5 } },
        { semilla: 23, params: { densidad: 0.45 }, oculto: true },
        { semilla: 24, params: { densidad: 0.5 }, oculto: true },
        { semilla: 25, params: { densidad: 0.4 }, oculto: true },
      ],
    },
  },
  {
    titulo: '💎 Recolector de cristales',
    categoria: 'Grafos y Árboles',
    nivel: 'Difícil',
    puntos: 300,
    descripcion: `En los anillos de Saturno flotan cristales de energía. Tu nave tiene que recogerlos todos antes de quedarse sin movimientos, esquivando las rocas.

Sensores que recibes:
- mapa: lista de cadenas; "#" es roca y "." es espacio libre
- posicion: [fila, columna] de tu nave
- cristales: lista con las posiciones [fila, columna] de los cristales que faltan
- movimientos_restantes: cuántos movimientos te quedan

Devuelve "N" (arriba), "S" (abajo), "E" (derecha) u "O" (izquierda). Chocar con una roca gasta el movimiento.

Pista: una búsqueda en anchura (BFS) desde tu posición te dice el camino más corto hasta el cristal más cercano.`,
    codigoBase: `from collections import deque

def piloto(sensores):
    mapa = sensores["mapa"]
    fila, columna = sensores["posicion"]
    cristales = sensores["cristales"]

    # Tu código aquí

    return "N"
`,
    resultadoEsperado: 'Recoger todos los cristales en todos los escenarios (algunos ocultos).\nCuanto más cerca del recorrido óptimo, más estrellas',
    solucion: `from collections import deque

MOVIMIENTOS = {"N": (-1, 0), "S": (1, 0), "E": (0, 1), "O": (0, -1)}

def piloto(sensores):
    mapa = sensores["mapa"]
    inicio = tuple(sensores["posicion"])
    objetivos = {tuple(c) for c in sensores["cristales"]}
    previo = {inicio: None}
    cola = deque([inicio])
    while cola:
        actual = cola.popleft()
        if actual in objetivos:
            while previo[actual] != inicio:
                actual = previo[actual]
            for nombre, (df, dc) in MOVIMIENTOS.items():
                if (inicio[0] + df, inicio[1] + dc) == actual:
                    return nombre
        for df, dc in MOVIMIENTOS.values():
            f, c = actual[0] + df, actual[1] + dc
            if 0 <= f < len(mapa) and 0 <= c < len(mapa[0]) and mapa[f][c] != "#" and (f, c) not in previo:
                previo[(f, c)] = actual
                cola.append((f, c))
    return "N"
`,
    config: {
      mision: 'cristales',
      escenarios: [
        { nombre: 'Cráter', semilla: 31, params: { cristales: 3 } },
        { nombre: 'Laberinto', semilla: 32, params: { cristales: 4, rocas: 0.28 } },
        { semilla: 33, params: { cristales: 4 }, oculto: true },
        { semilla: 34, params: { cristales: 5 }, oculto: true },
        { semilla: 35, params: { cristales: 4 }, oculto: true },
      ],
    },
  },
];
