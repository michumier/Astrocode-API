/*
 * Ruta de aprendizaje (fase 11): los planetas en orden y los ejercicios de cada uno, en el orden de
 * docs/TEMARIO.md. El número de cada paso es el del temario: los que faltan son las lecciones
 * (fase 12) y los ejercicios nuevos (fase 13), que entrarán en su sitio sin renumerar nada.
 */
export interface PlanetaSemilla {
  clave: string;
  nombre: string;
  tema: string;
  // Puntos por conquistarlo (completar todos sus pasos)
  bonus: number;
  // [número de paso, id de la tarea]
  pasos: [number, number][];
}

export const rutaInicial: PlanetaSemilla[] = [
  {
    clave: 'mercurio', nombre: 'Mercurio', tema: 'Primer contacto', bonus: 100,
    pasos: [[3, 1], [5, 19], [7, 4], [9, 2]],
  },
  {
    clave: 'venus', nombre: 'Venus', tema: 'Tomar decisiones', bonus: 150,
    pasos: [[3, 25], [8, 16], [9, 8], [10, 73], [11, 68], [12, 55]],
  },
  {
    clave: 'tierra', nombre: 'Tierra', tema: 'Repetir', bonus: 200,
    pasos: [[3, 10], [4, 11], [6, 14], [7, 17], [10, 28], [12, 70], [13, 63], [15, 60]],
  },
  {
    clave: 'marte', nombre: 'Marte', tema: 'Herramientas propias', bonus: 250,
    pasos: [[3, 5], [4, 20], [8, 9], [9, 71], [10, 58]],
  },
  {
    clave: 'jupiter', nombre: 'Júpiter', tema: 'Datos y algoritmos', bonus: 300,
    pasos: [[2, 21], [4, 18], [6, 3], [7, 6], [8, 61], [9, 66], [10, 69], [12, 64], [13, 59], [14, 56]],
  },
  {
    clave: 'saturno', nombre: 'Saturno', tema: 'Pensar como un ingeniero', bonus: 400,
    pasos: [[6, 62], [7, 67], [8, 72], [10, 65], [11, 57]],
  },
];
