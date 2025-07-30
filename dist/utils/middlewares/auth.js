export async function verifyJWT(request, reply) {
    try {
        await request.jwtVerify();
    }
    catch (err) {
        return reply.status(401).send({ error: 'Unauthorized' });
    }
}
export async function requireAdmin(request, reply) {
    await verifyJWT(request, reply);
    const user = request.user;
    if (user.role !== 'admin') {
        return reply.status(403).send({ error: 'Forbidden: Admins only' });
    }
}
