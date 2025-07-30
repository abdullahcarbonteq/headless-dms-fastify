export async function verifyJWT(request, reply) {
    try {
        await request.jwtVerify();
    }
    catch (err) {
        return reply.status(401).send({ error: 'Unauthorized' });
    }
}
