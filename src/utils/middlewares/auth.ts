import { FastifyRequest, FastifyReply } from 'fastify';

export async function verifyJWT(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }
}

type JWTPayload = {
  userId: string;
  role: string;
  email: string;
};

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  await verifyJWT(request, reply);
  const user = request.user as JWTPayload;
  if (user.role !== 'admin') {
    return reply.status(403).send({ error: 'Forbidden: Admins only' });
  }
}
