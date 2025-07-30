import { DocumentService } from './services/document.service.js';
import { FileUploadService } from './services/fileUpload.service.js';
import { FileHandlerService } from './services/fileHandler.service.js';
export const DocumentController = {
    async upload(req, reply) {
        try {
            const parts = req.parts();
            let file = null;
            const fields = {};
            // Extract file and fields from multipart request
            for await (const part of parts) {
                if (part.type === 'file') {
                    file = await FileHandlerService.saveFile(part);
                }
                else if (part.type === 'field') {
                    fields[part.fieldname] = String(part.value);
                }
            }
            if (!file || !fields.filename || !fields.mimetype) {
                return reply.status(400).send({ error: 'Missing file or required fields' });
            }
            const userId = req.user?.userId;
            if (!userId) {
                return reply.status(401).send({ error: 'Unauthorized: No userId found' });
            }
            // Process file upload with business logic
            const uploadResult = await FileUploadService.processFileUpload({
                file,
                fields: {
                    filename: fields.filename,
                    mimetype: fields.mimetype,
                    tags: fields.tags,
                    description: fields.description,
                },
                userId,
            });
            if (uploadResult.isErr()) {
                return reply.status(400).send({ error: uploadResult.unwrapErr().message });
            }
            // Save document to database
            const documentResult = await DocumentService.uploadDocument(uploadResult.unwrap());
            if (documentResult.isOk()) {
                return reply.status(201).send({
                    message: 'Document uploaded successfully',
                    document: documentResult.unwrap(),
                });
            }
            else {
                return reply.status(500).send({ error: documentResult.unwrapErr().message });
            }
        }
        catch (error) {
            return reply.status(500).send({ error: 'Upload failed' });
        }
    },
    async getAll(req, reply) {
        const result = await DocumentService.getAllDocuments();
        if (result.isOk()) {
            return reply.send({ documents: result.unwrap() });
        }
        else {
            return reply.status(500).send({ error: result.unwrapErr().message });
        }
    },
    async getById(req, reply) {
        const { id } = req.params;
        const result = await DocumentService.getDocumentById(id);
        if (result.isOk()) {
            const document = result.unwrap();
            if (!document) {
                return reply.status(404).send({ error: 'Document not found' });
            }
            return reply.send({ document });
        }
        else {
            return reply.status(500).send({ error: result.unwrapErr().message });
        }
    },
    async deleteById(req, reply) {
        const { id } = req.params;
        const result = await DocumentService.deleteDocument(id);
        if (result.isOk()) {
            const deleted = result.unwrap();
            if (deleted) {
                return reply.send({ message: 'Document deleted successfully' });
            }
            else {
                return reply.status(404).send({ error: 'Document not found' });
            }
        }
        else {
            return reply.status(500).send({ error: result.unwrapErr().message });
        }
    },
    async search(req, reply) {
        const { tags, description } = req.query;
        const tagArray = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined;
        const result = await DocumentService.searchDocuments({ tags: tagArray, description });
        if (result.isOk()) {
            return reply.send({ documents: result.unwrap() });
        }
        else {
            return reply.status(500).send({ error: result.unwrapErr().message });
        }
    },
    async generateDownloadLink(req, reply) {
        const { id } = req.params;
        const result = await DocumentService.getDocumentById(id);
        if (result.isOk()) {
            const document = result.unwrap();
            if (!document) {
                return reply.status(404).send({ error: 'Document not found' });
            }
            const token = await reply.server.jwt.sign({ docId: id }, { expiresIn: '5m' });
            const url = `/api/documents/download/${token}`;
            return reply.send({ url });
        }
        else {
            return reply.status(500).send({ error: result.unwrapErr().message });
        }
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
        const result = await DocumentService.getDocumentById(payload.docId);
        if (result.isOk()) {
            const document = result.unwrap();
            if (!document) {
                return reply.status(404).send({ error: 'Document not found' });
            }
            // Serve the file
            return reply.sendFile(document.path);
        }
        else {
            return reply.status(500).send({ error: result.unwrapErr().message });
        }
    },
};
