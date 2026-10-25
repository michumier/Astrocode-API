# -*- coding: utf-8 -*-
"""
Mutador de código para las misiones de sabotaje.

Recibe un programa correcto y genera variantes con UN bug sutil cada una
(un `<` por un `<=`, un índice desplazado, un acumulador mal inicializado...).

Solo analiza el código con `ast` (nunca lo ejecuta). Cada mutación sustituye
exclusivamente el fragmento de texto del nodo afectado, así que el resto del
programa (comentarios, formato, nombres) queda idéntico y el diff es mínimo.
"""

import ast
import copy
import difflib
import random

MAX_CODIGO = 20_000

# Intercambios "de límite" (los errores típicos de principiante)
COMPARACIONES = {
    ast.Lt: (ast.LtE, '<', '<='),
    ast.LtE: (ast.Lt, '<=', '<'),
    ast.Gt: (ast.GtE, '>', '>='),
    ast.GtE: (ast.Gt, '>=', '>'),
    ast.Eq: (ast.NotEq, '==', '!='),
    ast.NotEq: (ast.Eq, '!=', '=='),
    ast.In: (ast.NotIn, 'in', 'not in'),
    ast.NotIn: (ast.In, 'not in', 'in'),
}

ARITMETICA = {
    ast.Add: (ast.Sub, '+', '-'),
    ast.Sub: (ast.Add, '-', '+'),
    ast.FloorDiv: (ast.Div, '//', '/'),
    ast.Div: (ast.FloorDiv, '/', '//'),
    ast.Mult: (ast.Add, '*', '+'),
}


class _Fragmento:
    """Convierte (línea, columna en bytes UTF-8) de `ast` a posiciones en el texto."""

    def __init__(self, codigo):
        self.codigo = codigo
        self.lineas = codigo.splitlines(keepends=True)
        self.inicio_linea = []
        pos = 0
        for linea in self.lineas:
            self.inicio_linea.append(pos)
            pos += len(linea)

    def posicion(self, lineno, col_bytes):
        linea = self.lineas[lineno - 1]
        col = len(linea.encode('utf-8')[:col_bytes].decode('utf-8', errors='ignore'))
        return self.inicio_linea[lineno - 1] + col

    def sustituir(self, nodo, texto):
        ini = self.posicion(nodo.lineno, nodo.col_offset)
        fin = self.posicion(nodo.end_lineno, nodo.end_col_offset)
        return self.codigo[:ini] + texto + self.codigo[fin:]


def _unparse(nodo):
    return ast.unparse(ast.fix_missing_locations(nodo))


def _nombres_locales(funcion):
    """Parámetros y variables asignadas dentro de una función."""
    nombres = {a.arg for a in funcion.args.args + funcion.args.kwonlyargs}
    for n in ast.walk(funcion):
        if isinstance(n, ast.Name) and isinstance(n.ctx, ast.Store):
            nombres.add(n.id)
    return nombres


def _candidatos(arbol, frag):
    """Genera tuplas (operador, descripción, nodo, código_mutado)."""
    # Para el operador "return" hace falta saber en qué función está cada nodo
    funcion_de = {}
    for f in ast.walk(arbol):
        if isinstance(f, (ast.FunctionDef, ast.AsyncFunctionDef)):
            for n in ast.walk(f):
                funcion_de.setdefault(id(n), f)

    for nodo in ast.walk(arbol):
        if not hasattr(nodo, 'lineno'):
            continue

        # 1. Comparaciones: < ↔ <=, == ↔ !=, in ↔ not in...
        if isinstance(nodo, ast.Compare):
            for i, op in enumerate(nodo.ops):
                if type(op) in COMPARACIONES:
                    nuevo_op, antes, despues = COMPARACIONES[type(op)]
                    mutado = copy.deepcopy(nodo)
                    mutado.ops[i] = nuevo_op()
                    yield ('comparacion', f'`{antes}` cambiado por `{despues}`', nodo, frag.sustituir(nodo, _unparse(mutado)))

        # 2. Aritmética: + ↔ -, // ↔ /, * → +
        elif isinstance(nodo, ast.BinOp) and type(nodo.op) in ARITMETICA:
            # "x + 1" → "x": desplazamiento de uno
            if isinstance(nodo.op, (ast.Add, ast.Sub)) and isinstance(nodo.right, ast.Constant) and nodo.right.value == 1:
                yield ('desplazamiento', f'quitado el `{"+" if isinstance(nodo.op, ast.Add) else "-"} 1`', nodo, frag.sustituir(nodo, _unparse(nodo.left)))
            nuevo_op, antes, despues = ARITMETICA[type(nodo.op)]
            mutado = copy.deepcopy(nodo)
            mutado.op = nuevo_op()
            yield ('aritmetica', f'`{antes}` cambiado por `{despues}`', nodo, frag.sustituir(nodo, _unparse(mutado)))

        elif isinstance(nodo, ast.AugAssign) and type(nodo.op) in ARITMETICA:
            nuevo_op, antes, despues = ARITMETICA[type(nodo.op)]
            mutado = copy.deepcopy(nodo)
            mutado.op = nuevo_op()
            yield ('aritmetica', f'`{antes}=` cambiado por `{despues}=`', nodo, frag.sustituir(nodo, _unparse(mutado)))

        # 3. Lógica: and ↔ or
        elif isinstance(nodo, ast.BoolOp) and len(nodo.values) == 2:
            mutado = copy.deepcopy(nodo)
            mutado.op = ast.Or() if isinstance(nodo.op, ast.And) else ast.And()
            antes, despues = ('and', 'or') if isinstance(nodo.op, ast.And) else ('or', 'and')
            yield ('booleano', f'`{antes}` cambiado por `{despues}`', nodo, frag.sustituir(nodo, _unparse(mutado)))

        # 4. Quitar un `not`
        elif isinstance(nodo, ast.UnaryOp) and isinstance(nodo.op, ast.Not):
            yield ('negacion', 'quitado un `not`', nodo, frag.sustituir(nodo, _unparse(nodo.operand)))

        # 5. range(n) → range(n - 1), range(a, b) → range(a + 1, b)
        elif isinstance(nodo, ast.Call) and isinstance(nodo.func, ast.Name) and nodo.func.id == 'range' and 1 <= len(nodo.args) <= 2:
            mutado = copy.deepcopy(nodo)
            if len(nodo.args) == 1:
                mutado.args[0] = ast.BinOp(left=mutado.args[0], op=ast.Sub(), right=ast.Constant(1))
                desc = 'el `range` se queda una vuelta corto'
            else:
                mutado.args[0] = ast.BinOp(left=mutado.args[0], op=ast.Add(), right=ast.Constant(1))
                desc = 'el `range` empieza una posición tarde'
            yield ('desplazamiento', desc, nodo, frag.sustituir(nodo, _unparse(mutado)))

        # 6. min ↔ max
        elif isinstance(nodo, ast.Call) and isinstance(nodo.func, ast.Name) and nodo.func.id in ('min', 'max'):
            mutado = copy.deepcopy(nodo)
            otro = 'max' if nodo.func.id == 'min' else 'min'
            mutado.func.id = otro
            yield ('min_max', f'`{nodo.func.id}` cambiado por `{otro}`', nodo, frag.sustituir(nodo, _unparse(mutado)))

        # 7. lista.pop() → lista.pop(0)
        elif (isinstance(nodo, ast.Call) and isinstance(nodo.func, ast.Attribute) and nodo.func.attr == 'pop'
              and not nodo.args and not nodo.keywords):
            mutado = copy.deepcopy(nodo)
            mutado.args = [ast.Constant(0)]
            yield ('mutable', '`pop()` cambiado por `pop(0)` (saca el primero, no el último)', nodo, frag.sustituir(nodo, _unparse(mutado)))

        # 8. Índices: x[0] → x[1], x[-1] → x[-2]
        elif isinstance(nodo, ast.Subscript):
            indice = nodo.slice
            valor = None
            if isinstance(indice, ast.Constant) and isinstance(indice.value, int) and not isinstance(indice.value, bool):
                valor = indice.value
            elif (isinstance(indice, ast.UnaryOp) and isinstance(indice.op, ast.USub)
                  and isinstance(indice.operand, ast.Constant) and isinstance(indice.operand.value, int)):
                valor = -indice.operand.value
            if valor is not None:
                nuevo = valor - 1 if valor < 0 else valor + 1
                yield ('desplazamiento', f'índice `[{valor}]` cambiado por `[{nuevo}]`', indice, frag.sustituir(indice, str(nuevo)))

        # 9. Valor inicial de un acumulador: total = 0 → total = 1 · True ↔ False
        elif (isinstance(nodo, ast.Assign) and len(nodo.targets) == 1 and isinstance(nodo.targets[0], ast.Name)
              and isinstance(nodo.value, ast.Constant)):
            v = nodo.value.value
            if isinstance(v, bool):
                yield ('valor_inicial', f'`{v}` cambiado por `{not v}`', nodo.value, frag.sustituir(nodo.value, str(not v)))
            elif isinstance(v, int):
                nuevo = 1 if v == 0 else v + 1
                yield ('valor_inicial', f'`{nodo.targets[0].id}` empieza en `{nuevo}` en vez de `{v}`', nodo.value, frag.sustituir(nodo.value, str(nuevo)))

        # 10. return x → return otra_variable
        elif isinstance(nodo, ast.Return) and isinstance(nodo.value, ast.Name):
            funcion = funcion_de.get(id(nodo))
            if funcion is not None:
                for otro in sorted(_nombres_locales(funcion) - {nodo.value.id}):
                    yield ('return', f'devuelve `{otro}` en vez de `{nodo.value.id}`', nodo.value, frag.sustituir(nodo.value, otro))

        # 11. Sangría: la última línea de un bucle se queda fuera del bucle
        if isinstance(nodo, (ast.For, ast.While)) and len(nodo.body) >= 2:
            ultima = nodo.body[-1]
            if ultima.lineno == ultima.end_lineno and not isinstance(ultima, (ast.If, ast.For, ast.While, ast.With, ast.Try)):
                linea = frag.lineas[ultima.lineno - 1]
                sangria_bucle = len(frag.lineas[nodo.lineno - 1]) - len(frag.lineas[nodo.lineno - 1].lstrip(' '))
                nueva = ' ' * sangria_bucle + linea.lstrip(' ')
                ini = frag.inicio_linea[ultima.lineno - 1]
                codigo = frag.codigo[:ini] + nueva + frag.codigo[ini + len(linea):]
                yield ('sangria', 'la última línea del bucle quedó fuera de él', ultima, codigo)


def mutar(codigo, max_variantes=12, semilla=0):
    """Devuelve hasta `max_variantes` variantes distintas, válidas y deterministas."""
    if len(codigo) > MAX_CODIGO:
        raise ValueError('El código es demasiado largo')
    arbol = ast.parse(codigo)
    frag = _Fragmento(codigo)
    original = codigo.splitlines()

    vistas = set()
    variantes = []
    for operador, descripcion, nodo, mutado in _candidatos(arbol, frag):
        if mutado == codigo or mutado in vistas:
            continue
        try:
            ast.parse(mutado)
        except SyntaxError:
            continue
        vistas.add(mutado)
        nuevas = mutado.splitlines()
        cambiadas = [i for i, (a, b) in enumerate(zip(original, nuevas)) if a != b]
        if len(original) != len(nuevas) or not (1 <= len(cambiadas) <= 3):
            continue
        diff = '\n'.join(difflib.unified_diff(original, nuevas, 'solucion.py', 'saboteado.py', n=1, lineterm=''))
        variantes.append({
            'codigo': mutado,
            'operador': operador,
            'descripcion': descripcion,
            'linea': cambiadas[0] + 1,
            'lineas_cambiadas': len(cambiadas),
            'diff': diff,
        })

    return _intercalar(variantes, random.Random(semilla))[:max_variantes]


def _intercalar(variantes, rng):
    """Mezcla determinista que reparte los operadores por turnos (una de cada tipo, luego otra...)
    para que las primeras variantes sean variadas y no, por ejemplo, cinco comparaciones seguidas."""
    grupos = {}
    for v in variantes:
        grupos.setdefault(v['operador'], []).append(v)
    for grupo in grupos.values():
        rng.shuffle(grupo)
    operadores = sorted(grupos)
    rng.shuffle(operadores)
    resultado = []
    while any(grupos.values()):
        for op in operadores:
            if grupos[op]:
                resultado.append(grupos[op].pop(0))
    return resultado
