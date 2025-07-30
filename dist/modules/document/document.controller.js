import { DocumentService } from './document.service.js';
import { DocumentRepository } from './document.repository.js';
export const DocumentController = {
    async upload(req, reply) {
        return DocumentService.uploadDocument(req, reply);
    },
    async getAll(req, reply) {
        const docs = await DocumentRepository.getAll();
        return reply.send({ documents: docs });
    },
    async deleteById(req, reply) {
        const { id } = req.params;
        const result = await DocumentRepository.deleteById(id);
        if (result.rowCount === 0) {
            return reply.status(404).send({ error: 'Document not found' });
        }
        return reply.send({ message: 'Document deleted successfully' });
    },
    async search(req, reply) {
        const { tags, description } = req.query;
        const tagArray = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined;
        const docs = await DocumentRepository.search({ tags: tagArray, description });
        return reply.send({ documents: docs });
    },
    async generateDownloadLink(req, reply) {
        const { id } = req.params;
        // Optionally, check if the document exists
        const docs = await DocumentRepository.getAll();
        const doc = docs.find(d => d.id === id);
        if (!doc) {
            return reply.status(404).send({ error: 'Document not found' });
        }
        const token = await reply.server.jwt.sign({ docId: id }, { expiresIn: '5m' });
        const url = `/api/documents/download/${token}`;
        return reply.send({ url });
    },
    async downloadDocument(req, reply) {
        const { token } = req.params;
        let payload;
        try {
            payload = await reply.server.jwt.verify(token);
        }
        catch (err) {
            return reply.status(401).send({ error: 'Invalid or expired download link' });
        }
        const docs = await DocumentRepository.getAll();
        const doc = docs.find(d => d.id === payload.docId);
        if (!doc) {
            return reply.status(404).send({ error: 'Document not found' });
        }
        // Serve the file
        return reply.sendFile(doc.path);
    },
};
export async function minimalUploadHandler(req, reply) {
    console.log('Minimal handler hit');
    const parts = req.parts();
    for await (const part of parts) {
        if (part.type === 'file') {
            const uploadPath = require('path').join('uploads', part.filename);
            const writeStream = require('fs').createWriteStream(uploadPath);
            part.file.pipe(writeStream);
            await new Promise((resolve, reject) => {
                writeStream.on('finish', resolve);
                writeStream.on('error', reject);
                part.file.on('error', reject);
            });
            console.log('File written');
            return reply.send({ message: 'File uploaded' });
        }
    }
    reply.status(400).send({ error: 'No file found' });
}
