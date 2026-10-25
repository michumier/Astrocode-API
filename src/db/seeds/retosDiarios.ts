// Tests de los retos diarios que vienen en `BD Astrocode.sql` (los usa la migración 005)

interface TestSemilla {
  descripcion: string;
  codigo: string;
  salida: string;
  oculto?: boolean;
}

interface RetoSemilla {
  titulo: string;
  ejemplo: string;
  tests: TestSemilla[];
}

const arbolAListaHelper = `
def _a_lista(n):
    return None if n is None else [n.valor, _a_lista(n.izquierda), _a_lista(n.derecha)]
`;

export const testsRetosDiarios: RetoSemilla[] = [
  {
    titulo: 'Invertir un Árbol Binario',
    ejemplo: 'Árbol      4            4\n         /   \\   →    /   \\\n        2     7       7     2\n       / \\                 / \\\n      1   3               3   1',
    tests: [
      {
        descripcion: 'Árbol de ejemplo (4, 2, 7, 1, 3)',
        codigo: `${arbolAListaHelper}
r = Nodo(4); r.izquierda = Nodo(2); r.derecha = Nodo(7)
r.izquierda.izquierda = Nodo(1); r.izquierda.derecha = Nodo(3)
print(_a_lista(invertir_arbol(r)))`,
        salida: '[4, [7, None, None], [2, [3, None, None], [1, None, None]]]',
      },
      {
        descripcion: 'Árbol vacío',
        codigo: 'print(invertir_arbol(None))',
        salida: 'None',
      },
      {
        descripcion: 'Un solo nodo',
        codigo: `${arbolAListaHelper}
print(_a_lista(invertir_arbol(Nodo(1))))`,
        salida: '[1, None, None]',
        oculto: true,
      },
      {
        descripcion: 'Árbol torcido a la izquierda',
        codigo: `${arbolAListaHelper}
r = Nodo(1); r.izquierda = Nodo(2); r.izquierda.izquierda = Nodo(3)
print(_a_lista(invertir_arbol(r)))`,
        salida: '[1, None, [2, None, [3, None, None]]]',
        oculto: true,
      },
    ],
  },
  {
    titulo: 'Validar Paréntesis',
    ejemplo: 'es_valido("()[]{}")  →  True\nes_valido("(]")      →  False',
    tests: [
      { descripcion: 'es_valido("()[]{}")', codigo: 'print(es_valido("()[]{}"))', salida: 'True' },
      { descripcion: 'es_valido("(]")', codigo: 'print(es_valido("(]"))', salida: 'False' },
      { descripcion: 'Anidados correctos', codigo: 'print(es_valido("{[()]}"))', salida: 'True', oculto: true },
      { descripcion: 'Cruzados', codigo: 'print(es_valido("([)]"))', salida: 'False', oculto: true },
      { descripcion: 'Sin cerrar', codigo: 'print(es_valido("(("))', salida: 'False', oculto: true },
      { descripcion: 'Cadena vacía', codigo: 'print(es_valido(""))', salida: 'True', oculto: true },
    ],
  },
  {
    titulo: 'Encontrar el Número Faltante',
    ejemplo: 'encontrar_faltante([1, 2, 4, 5])  →  3',
    tests: [
      { descripcion: 'encontrar_faltante([1, 2, 4, 5])', codigo: 'print(encontrar_faltante([1, 2, 4, 5]))', salida: '3' },
      { descripcion: 'Falta el primero', codigo: 'print(encontrar_faltante([2, 3, 4]))', salida: '1', oculto: true },
      { descripcion: 'Falta el último', codigo: 'print(encontrar_faltante([1, 2, 3]))', salida: '4', oculto: true },
      {
        descripcion: 'Lista grande desordenada',
        codigo: 'import random\nl = [n for n in range(1, 1001) if n != 500]\nrandom.seed(7); random.shuffle(l)\nprint(encontrar_faltante(l))',
        salida: '500',
        oculto: true,
      },
    ],
  },
];
