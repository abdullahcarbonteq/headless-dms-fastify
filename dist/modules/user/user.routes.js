import { UserController } from './user.controller.js';
import { requireAdmin } from '../../utils/middlewares/auth.js';
export default async function userRoutes(app) {
    app.post('/register', UserController.register);
    app.post('/login', UserController.login);
    app.get('/protected', { preHandler: [requireAdmin] }, async (req, reply) => {
        return reply.send({ message: 'You are authenticated as admin!', user: req.user });
    });
}
