import { FastifyRequest, FastifyReply } from 'fastify';
import { AppResult, AppError } from '@carbonteq/hexapp';
import { ResponseHandler } from '../utils/ResponseHandler.js';
import type { JWTPayload } from '../../../application/ports/AuthPort.js';


async function verifyJWTToken(request: FastifyRequest): Promise<AppResult<JWTPayload>> {
  try {
    await request.jwtVerify();
    return AppResult.Ok(request.user as JWTPayload);
  } catch (error) {
    return AppResult.Err(AppError.Generic('Invalid or expired token'));
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
    return ResponseHandler.error(reply, AppError.Generic('Forbidden: Admin access required'), 403);
  }

  return;
}
