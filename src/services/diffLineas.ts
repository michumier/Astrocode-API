/**
 * Diff por líneas (LCS) entre dos programas. Se usa para:
 * - verificar que un sabotaje generado por IA cambia pocas líneas,
 * - la insignia «Cirujano» (arreglar el sabotaje tocando lo mínimo).
 * Las líneas se comparan sin espacios finales y se ignoran las líneas en blanco.
 */
export interface ResultadoDiff {
  cambios: number;            // líneas añadidas + quitadas, contando una sustitución como 1
  primeraLinea: number | null; // primera línea cambiada del programa original (1-based)
  diff: string;               // formato «- antes / + después»
}

const MAX_LINEAS = 2000;

export function diffLineas(antes: string, despues: string): ResultadoDiff {
  const preparar = (texto: string) =>
    texto.replace(/\r\n/g, '\n').split('\n').map((linea, i) => ({ texto: linea.trimEnd(), numero: i + 1 })).filter((l) => l.texto !== '');
  const a = preparar(antes).slice(0, MAX_LINEAS);
  const b = preparar(despues).slice(0, MAX_LINEAS);

  // Tabla LCS
  const lcs: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      lcs[i][j] = a[i].texto === b[j].texto ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  const salida: string[] = [];
  let quitadas = 0;
  let anadidas = 0;
  let primeraLinea: number | null = null;
  let i = 0;
  let j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i].texto === b[j].texto) {
      i++;
      j++;
    } else if (i < a.length && (j >= b.length || lcs[i + 1][j] >= lcs[i][j + 1])) {
      salida.push(`- ${a[i].texto}`);
      if (primeraLinea === null) primeraLinea = a[i].numero;
      quitadas++;
      i++;
    } else {
      salida.push(`+ ${b[j].texto}`);
      if (primeraLinea === null) primeraLinea = a[i]?.numero ?? (a[a.length - 1]?.numero ?? 0) + 1;
      anadidas++;
      j++;
    }
  }

  return { cambios: Math.max(quitadas, anadidas), primeraLinea, diff: salida.join('\n') };
}
