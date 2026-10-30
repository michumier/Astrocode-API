// Fase 7: dos retos diarios nuevos (migración 021). Con los 3 que ya había, el reto del día
// rota entre 5. Mismo formato que los anteriores: una función, un ejemplo y tests (algunos ocultos).
import { TestSemilla } from './ejercicios';

export interface RetoDiarioSemilla {
  titulo: string;
  descripcion: string;
  codigoBase: string;
  resultadoEsperado: string;
  solucion: string;
  tests: TestSemilla[];
}

export const retosDiariosNuevos: RetoDiarioSemilla[] = [
  {
    titulo: 'Comprimir una señal',
    descripcion: 'Las sondas envían señales con muchos caracteres repetidos seguidos. Escribe `comprimir(senal)`, que sustituye cada grupo de caracteres iguales seguidos por el carácter y cuántas veces se repite. Por ejemplo, `"aaabcc"` se convierte en `"a3b1c2"`. Una señal vacía se queda vacía.',
    codigoBase: `def comprimir(senal):
    # Tu código aquí
    pass
`,
    resultadoEsperado: `comprimir("aaabcc")  →  "a3b1c2"
comprimir("xyz")     →  "x1y1z1"`,
    solucion: `def comprimir(senal):
    if not senal:
        return ""
    partes = []
    actual = senal[0]
    veces = 1
    for c in senal[1:]:
        if c == actual:
            veces += 1
        else:
            partes.append(f"{actual}{veces}")
            actual = c
            veces = 1
    partes.append(f"{actual}{veces}")
    return "".join(partes)
`,
    tests: [
      { descripcion: 'comprimir("aaabcc")', codigo: 'print(comprimir("aaabcc"))', salida: 'a3b1c2' },
      { descripcion: 'comprimir("xyz")', codigo: 'print(comprimir("xyz"))', salida: 'x1y1z1' },
      { descripcion: 'Señal vacía', codigo: 'print(repr(comprimir("")))', salida: "''", oculto: true },
      { descripcion: 'Más de 9 repeticiones', codigo: 'print(comprimir("z" * 12))', salida: 'z12', oculto: true },
      { descripcion: 'El mismo carácter en grupos separados', codigo: 'print(comprimir("aabbaa"))', salida: 'a2b2a2', oculto: true },
    ],
  },
  {
    titulo: 'Dos señales que suman el objetivo',
    descripcion: 'El radar recibe una lista de intensidades y una intensidad objetivo. Escribe `dos_suma(numeros, objetivo)`, que devuelve una tupla con las posiciones `(i, j)` de los dos números que suman el objetivo, con `i < j`. Siempre hay exactamente una pareja y no se puede usar dos veces la misma posición.',
    codigoBase: `def dos_suma(numeros, objetivo):
    # Tu código aquí
    pass
`,
    resultadoEsperado: `dos_suma([2, 7, 11, 15], 9)  →  (0, 1)
dos_suma([3, 2, 4], 6)       →  (1, 2)`,
    solucion: `def dos_suma(numeros, objetivo):
    vistos = {}
    for j, n in enumerate(numeros):
        if objetivo - n in vistos:
            return (vistos[objetivo - n], j)
        vistos[n] = j
`,
    tests: [
      { descripcion: 'dos_suma([2, 7, 11, 15], 9)', codigo: 'print(dos_suma([2, 7, 11, 15], 9))', salida: '(0, 1)' },
      { descripcion: 'dos_suma([3, 2, 4], 6)', codigo: 'print(dos_suma([3, 2, 4], 6))', salida: '(1, 2)' },
      { descripcion: 'Dos números iguales', codigo: 'print(dos_suma([3, 3], 6))', salida: '(0, 1)', oculto: true },
      { descripcion: 'Con negativos', codigo: 'print(dos_suma([-4, 8, 1, -1], 0))', salida: '(2, 3)', oculto: true },
      { descripcion: 'Lista larga', codigo: 'l = list(range(1, 2001))\nprint(dos_suma(l, 3999))', salida: '(1998, 1999)', oculto: true },
    ],
  },
];
