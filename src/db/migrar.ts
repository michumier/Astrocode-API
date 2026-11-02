// Aplica las migraciones pendientes y termina: `npm run migrar`.
// Para la base de datos de la nube: DATABASE_URL=... npm run migrar (en Vercel no se migra al arrancar)
import { aplicarMigraciones } from './migrations';
import { pool } from '../config/db';

aplicarMigraciones()
  .then(() => {
    console.log('Migraciones al día');
    return pool.end();
  })
  .catch((error) => {
    console.error('Error al migrar:', error);
    process.exit(1);
  });
