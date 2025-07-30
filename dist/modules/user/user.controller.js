import { registerSchema } from './dto/register.dto.js';
import { loginSchema } from './dto/login.dto.js';
import { UserService } from './user.service.js';
export const UserController = {
    async register(req, reply) {
        const parsed = registerSchema.safeParse(req.body);
        if (!parsed.success) {
            return reply.status(400).send({ error: parsed.error.format() });
        }
        try {
            const user = await UserService.register(parsed.data);
            return reply.status(201).send({ message: 'User registered', user });
        }
        catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    },
    async login(req, reply) {
        const parsed = loginSchema.safeParse(req.body);
        if (!parsed.success) {
            return reply.status(400).send({ error: parsed.error.format() });
        }
        try {
            const user = await UserService.login(parsed.data);
            // Generate JWT
            const token = await reply.server.jwt.sign({
                userId: user.id,
                role: user.role,
                email: user.email
            });
            // Return token (and optionally user info)
            return reply.send({ message: 'Login successful', token });
        }
        catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    }
};
