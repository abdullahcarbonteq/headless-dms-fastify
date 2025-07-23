// src/server.ts
import app from './app';

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

app.listen({ port: PORT, host: '0.0.0.0' })
  .then(() => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  })
  .catch((err) => {
    console.error('Error starting server:', err);
    process.exit(1);
  });
