import { FastifyInstance } from 'fastify';
import { uploadSchema } from './document.dto';

export default async function documentRoutes(app: FastifyInstance) {
  app.post('/upload', async (req, reply) => {
    const body = req.body;
    const parsed = uploadSchema.safeParse(body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.format() });
    }
    return reply.status(201).send({ message: 'Test upload successful', data: parsed.data });
  });
}
