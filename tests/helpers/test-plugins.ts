import { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';

// Test-specific plugin registration
export async function registerTestPlugins(app: FastifyInstance) {
  // Register CORS
  await app.register(cors, {
    origin: true,
    credentials: true
  });

  // Register JWT with test secret
  await app.register(jwt, {
    secret: process.env.JWT_SECRET || 'test-secret-key'
  });

  // Register multipart for file uploads
  await app.register(multipart);
} 