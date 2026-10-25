// Levanta un stack de pruebas aislado (proyecto "astrocode-e2e"), ejecuta las pruebas e2e y lo apaga.
// Uso: npm run e2e:docker        (MANTENER=1 para dejarlo levantado al terminar)
import { spawnSync } from 'node:child_process';
import { existsSync, copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const puerto = process.env.E2E_API_PORT || '4100';
const compose = ['compose', '-p', 'astrocode-e2e', '-f', 'docker-compose.yml', '-f', 'test/e2e/compose.e2e.yml'];

const ejecutar = (cmd, args, env = {}) => {
  const r = spawnSync(cmd, args, { cwd: raiz, stdio: 'inherit', env: { ...process.env, MSYS_NO_PATHCONV: '1', ...env }, shell: process.platform === 'win32' });
  return r.status ?? 1;
};

if (!existsSync(path.join(raiz, '.env'))) {
  console.log('No hay .env: se crea uno a partir de .env.example para las pruebas');
  copyFileSync(path.join(raiz, '.env.example'), path.join(raiz, '.env'));
}

let codigo = ejecutar('docker', [...compose, 'up', '-d', '--build', '--wait', 'astrocode-api', 'mock-ia'], { E2E_API_PORT: puerto });
if (codigo === 0) {
  codigo = ejecutar('npm', ['run', 'test:e2e'], { API_URL: `http://localhost:${puerto}/graphql` });
  if (codigo !== 0) {
    ejecutar('docker', [...compose, 'logs', '--tail', '80', 'astrocode-api']);
  }
} else {
  ejecutar('docker', [...compose, 'logs', '--tail', '80']);
}

if (!process.env.MANTENER) {
  ejecutar('docker', [...compose, 'down', '-v', '--remove-orphans']);
}
process.exit(codigo);
