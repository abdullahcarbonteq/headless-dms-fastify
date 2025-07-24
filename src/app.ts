// src/app.ts
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import documentRoutes from './modules/document/document.routes';
import userRoutes from './modules/user/user.routes';
import multipart from '@fastify/multipart';
// import your routes here when read

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
app.register(multipart);

// Register routes here, e.g.:
app.register(documentRoutes, { prefix: '/api/documents' });
app.register(userRoutes, { prefix: '/api/users' });

export default app;
