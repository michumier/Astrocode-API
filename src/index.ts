import express from 'express';
import { configurarApp } from './graphql/schemas/index';

const app = express();
const listo = configurarApp(app);

// En Vercel no se llama a listen: la plataforma recibe la app exportada y la ejecuta como función
if (!process.env.VERCEL) {
  const port = process.env.PORT || 4000;
  listo()
    .then(() => {
      app.listen(port, () => {
        console.log(`🚀 Server ready at http://localhost:${port}/graphql`);
      });
    })
    .catch((error) => {
      console.error('Error al iniciar el servidor:', error);
      process.exit(1);
    });
}

export default app;
