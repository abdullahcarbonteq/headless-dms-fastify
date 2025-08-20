import { FastifyReply, FastifyRequest } from 'fastify';
import { container } from '../../infrastructure/bootstrap/container.js';
import { ResponseHandler } from './utils/ResponseHandler.js';
import { ValidationMiddleware } from './middlewares/validation.js';
import { z } from 'zod';
import { paginationQuerySchema } from './validators/pagination.query.schema.js';
import { registerRequestSchema } from './validators/user.register.request.schema.js';
import { loginRequestSchema } from './validators/user.login.request.schema.js';
import { updateUserRequestSchema } from './validators/user.update.request.schema.js';
import type { RegisterUserInput } from '../../application/dto/user/RegisterUserDTO.js';
import type { LoginUserInput } from '../../application/dto/user/LoginUserDTO.js';
import type { UpdateUserInput } from '../../application/use-cases/user/UpdateUserUseCase.js';
import { RegisterUserUseCase } from '../../application/use-cases/user/RegisterUserUseCase.js';
import { LoginUserUseCase } from '../../application/use-cases/user/LoginUserUseCase.js';
import { GetAllUsersUseCase } from '../../application/use-cases/user/GetAllUsersUseCase.js';
import { UpdateUserUseCase } from '../../application/use-cases/user/UpdateUserUseCase.js';
import { DeleteUserUseCase } from '../../application/use-cases/user/DeleteUserUseCase.js';

const registerUser = container.resolve(RegisterUserUseCase);
const loginUser = container.resolve(LoginUserUseCase);
const getAllUsers = container.resolve(GetAllUsersUseCase);
const updateUser = container.resolve(UpdateUserUseCase);
const deleteUser = container.resolve(DeleteUserUseCase);

const userIdSchema = z.object({ id: z.uuid() });

export const UserHttpController = {
  async register(req: FastifyRequest, reply: FastifyReply) {
    // Body is validated by ValidationMiddleware.register
    const result = await registerUser.execute(req.body as RegisterUserInput);
    return ResponseHandler.success(reply, result, 201, 'User registered successfully');
  },

  async login(req: FastifyRequest, reply: FastifyReply) {
    // Body is validated by ValidationMiddleware.login
    const result = await loginUser.execute(req.body as LoginUserInput);
    if (result.isErr()) return ResponseHandler.error(reply, result.unwrapErr(), 400);
    return ResponseHandler.success(reply, result, 200, 'Login successful');
  },

  async getAll(req: FastifyRequest, reply: FastifyReply) {
    // Use validated query parameters from validation middleware
    const { page, limit } = req.query as { page?: number; limit?: number };
    const result = await getAllUsers.execute({ page, limit });
    return ResponseHandler.paginated(reply, result);
  },

  async update(req: FastifyRequest, reply: FastifyReply) {
    // Params and body are validated by ValidationMiddleware.update
    const { id } = req.params as { id: string };
    const result = await updateUser.execute({ id, ...(req.body as Omit<UpdateUserInput, 'id'>) });
    return ResponseHandler.success(reply, result, 200, 'User updated successfully');
  },

  async delete(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };
    const result = await deleteUser.execute({ id });
    return ResponseHandler.boolean(reply, result, 'User deleted successfully', 'User not found');
  },
};

export const UserHttpValidation = {
  register: ValidationMiddleware.body(registerRequestSchema),
  login: ValidationMiddleware.body(loginRequestSchema),
  getAll: ValidationMiddleware.query(paginationQuerySchema),
  update: ValidationMiddleware.all({ params: userIdSchema, body: updateUserRequestSchema }),
  delete: ValidationMiddleware.params(userIdSchema),
};

