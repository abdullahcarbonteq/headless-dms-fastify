import { registerSchema } from './dto/register.dto.js';
import { loginSchema } from './dto/login.dto.js';
import { UserService } from './user.service.js';
export const UserController = {
    async register(req, reply) {
        const parsed = registerSchema.safeParse(req.body);
        if (!parsed.success) {
            return reply.status(400).send({ error: parsed.error.format() });
        }
        const result = await UserService.register(parsed.data);
        if (result.isOk()) {
            return reply.status(201).send({ message: 'User registered', user: result.unwrap() });
        }
        else {
            return reply.status(400).send({ error: result.unwrapErr().message });
        }
    },
    async login(req, reply) {
        const parsed = loginSchema.safeParse(req.body);
        if (!parsed.success) {
            return reply.status(400).send({ error: parsed.error.format() });
        }
        const result = await UserService.login(parsed.data);
        if (result.isOk()) {
            // Generate JWT
            const token = await reply.server.jwt.sign({
                userId: result.unwrap().id,
                role: result.unwrap().role,
                email: result.unwrap().email
            });
            // Return token (and optionally user info)
            return reply.send({ message: 'Login successful', token });
        }
        else {
            return reply.status(400).send({ error: result.unwrapErr().message });
        }
    }
};
