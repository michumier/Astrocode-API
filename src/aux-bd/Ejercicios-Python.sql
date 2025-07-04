-- Inserción de ejercicios para el Reto Diario (Dificultad ID 4, Categoría ID 16)

-- Ejercicio 1: Encontrar el número faltante en una lista
INSERT INTO tarea (titulo, descripcion, categoria_id, dificultad_id, puntos_recompensa, sintaxis_inicial, solucion, casos_prueba) VALUES
('Encontrar el Número Faltante', 'Dada una lista de `n-1` enteros únicos en el rango de 1 a `n`, escribe una función para encontrar el número que falta. Por ejemplo, para `[1, 2, 4, 5]`, el número faltante es 3.', 16, 4, 50,
'def encontrar_faltante(numeros):
    # Tu código aquí
    pass',
'def encontrar_faltante(numeros):
    n = len(numeros) + 1
    suma_esperada = n * (n + 1) // 2
    suma_real = sum(numeros)
    return suma_esperada - suma_real',
'[{"input": [[1, 2, 4, 5]], "output": 3}, {"input": [[1, 3]], "output": 2}, {"input": [[2, 3, 4, 5]], "output": 1}]');

-- Ejercicio 2: Validar si una cadena de paréntesis es válida
INSERT INTO tarea (titulo, descripcion, categoria_id, dificultad_id, puntos_recompensa, sintaxis_inicial, solucion, casos_prueba) VALUES
('Validar Paréntesis', 'Escribe una función que determine si una cadena que contiene solo los caracteres `(`, `)`, `{`, `}`, `[` y `]` es válida. La cadena es válida si los paréntesis de apertura se cierran en el orden correcto.', 16, 4, 60,
'def es_valido(cadena):
    # Tu código aquí
    pass',
'def es_valido(cadena):
    pila = []
    mapa = {")": "(", "}": "{", "]": "["}
    for char in cadena:
        if char in mapa:
            elemento_pop = pila.pop() if pila else "#"
            if mapa[char] != elemento_pop:
                return False
        else:
            pila.append(char)
    return not pila',
'[{"input": ["()"], "output": true}, {"input": ["()[]{}"], "output": true}, {"input": ["(]"], "output": false}, {"input": ["([)]"], "output": false}, {"input": ["{[]}"], "output": true}]');

-- Ejercicio 3: Invertir un Árbol Binario
INSERT INTO tarea (titulo, descripcion, categoria_id, dificultad_id, puntos_recompensa, sintaxis_inicial, solucion, casos_prueba) VALUES
('Invertir un Árbol Binario', 'Escribe una función para invertir un árbol binario. La función debe intercambiar los subárboles izquierdo y derecho de cada nodo del árbol. Asume que la clase `Nodo` está definida.', 16, 4, 70,
'class Nodo:
    def __init__(self, valor):
        self.valor = valor
        self.izquierda = None
        self.derecha = None

def invertir_arbol(raiz):
    # Tu código aquí
    pass',
'def invertir_arbol(raiz):
    if raiz is None:
        return None
    raiz.izquierda, raiz.derecha = invertir_arbol(raiz.derecha), invertir_arbol(raiz.izquierda)
    return raiz',
'# Los casos de prueba para árboles son más complejos de representar en JSON, se validará la lógica.');