// src/app.ts
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import documentRoutes from './modules/document/document.routes';
// import your routes here when ready

const app = Fastify();

// Register plugins
app.register(cors);
app.register(jwt, { secret: process.env.JWT_SECRET || 'supersecret' });
app.register(swagger, {
  swagger: {
    info: {
      title: 'DMS API',
      description: 'API for Document Management System',
      version: '1.0.0',
    },
  },
});
app.register(swaggerUI, {
  routePrefix: '/docs',
});

// Register routes here, e.g.:
app.register(documentRoutes, { prefix: '/api/documents' });

export default app;
