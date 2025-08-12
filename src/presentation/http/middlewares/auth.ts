import { FastifyRequest, FastifyReply } from 'fastify';
import { Result } from '@carbonteq/fp';
import { ResponseHandler } from '../utils/ResponseHandler.js';
import type { JWTPayload } from '../../../application/ports/AuthPort.js';


async function verifyJWTToken(request: FastifyRequest): Promise<Result<JWTPayload, Error>> {
  try {
    await request.jwtVerify();
    return Result.Ok(request.user as JWTPayload);
  } catch (error) {
    return Result.Err(new Error('Invalid or expired token'));
  }
}

export async function verifyJWT(request: FastifyRequest, reply: FastifyReply) {
  const result = await verifyJWTToken(request);
  
  if (result.isErr()) {
    return ResponseHandler.error(reply, result.unwrapErr(), 401);
  }
  return;
}

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  const result = await verifyJWTToken(request);
  
  if (result.isErr()) {
    return ResponseHandler.error(reply, result.unwrapErr(), 401);
  }
  
  const user = result.unwrap();
  if (user.role !== 'admin') {
    return ResponseHandler.error(reply, new Error('Forbidden: Admin access required'), 403);
  }

  return;
}
