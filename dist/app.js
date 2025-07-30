// src/app.ts
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import documentRoutes from './modules/document/document.routes.js';
import userRoutes from './modules/user/user.routes.js';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/index.js';
// import your routes here when read
const app = Fastify();
// Register plugins
app.register(cors, {
    origin: config.app.cors.origin,
    credentials: config.app.cors.credentials,
});
app.register(jwt, { secret: config.jwt.secret });
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
app.register(fastifyStatic, {
    root: join(dirname(fileURLToPath(import.meta.url)), '..', config.app.upload.uploadDir),
    prefix: '/uploads/', // optional
});
// Register routes here, e.g.:
app.register(documentRoutes, { prefix: '/api/documents' });
app.register(userRoutes, { prefix: '/api/users' });
export default app;
