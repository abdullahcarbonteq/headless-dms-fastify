import { uploadSchema } from './document.dto.js';
import { config } from '../../config/index.js';
export const DocumentService = {
    async uploadDocument(req, reply) {
        // Dynamic imports
        const { v4: uuidv4 } = await import('uuid');
        const path = await import('path');
        const fs = await import('fs');
        const { DocumentRepository } = await import('./document.repository.js');
        const parts = req.parts();
        let file = null;
        const fields = {};
        for await (const part of parts) {
            if (part.type === 'file') {
                const uniqueName = `${Date.now()}-${uuidv4()}${path.default.extname(part.filename)}`;
                const uploadPath = path.default.join(config.app.upload.uploadDir, uniqueName);
                await fs.promises.mkdir(config.app.upload.uploadDir, { recursive: true });
                const writeStream = fs.createWriteStream(uploadPath);
                part.file.pipe(writeStream);
                await new Promise((resolve, reject) => {
                    writeStream.on('finish', resolve);
                    writeStream.on('error', reject);
                    part.file.on('error', reject);
                });
                file = {
                    path: uploadPath,
                    filename: part.filename,
                    mimetype: part.mimetype,
                    size: 0,
                };
                file.size = fs.statSync(uploadPath).size.toString();
            }
            else {
                fields[part.fieldname] = part.value;
            }
        }
        if (!file || !fields.filename || !fields.mimetype) {
            return reply.status(400).send({ error: 'Missing file or required fields' });
        }
        // Validate file size
        if (file.size > config.app.upload.maxFileSize) {
            return reply.status(400).send({
                error: `File too large. Maximum size is ${config.app.upload.maxFileSize / (1024 * 1024)}MB`
            });
        }
        // Validate file type
        if (!config.app.upload.allowedMimeTypes.includes(file.mimetype)) {
            return reply.status(400).send({
                error: `File type not allowed. Allowed types: ${config.app.upload.allowedMimeTypes.join(', ')}`
            });
        }
        // Parse tags if present
        let tagsString = '[]';
        if (fields.tags) {
            try {
                if (typeof fields.tags === 'string') {
                    // Accept JSON array or comma-separated string
                    const parsed = JSON.parse(fields.tags);
                    if (Array.isArray(parsed)) {
                        tagsString = JSON.stringify(parsed.map(String));
                    }
                    else if (typeof parsed === 'string') {
                        tagsString = JSON.stringify([parsed]);
                    }
                    else {
                        tagsString = '[]';
                    }
                }
                else {
                    tagsString = JSON.stringify(fields.tags);
                }
            }
            catch {
                // fallback: comma-separated string
                tagsString = JSON.stringify(fields.tags.split(',').map((t) => t.trim()));
            }
        }
        const description = fields.description || undefined;
        // Zod schema validation
        const validation = uploadSchema.safeParse({
            filename: fields.filename,
            mimetype: fields.mimetype,
            path: file ? file.path : '',
            tags: tagsString,
            description,
        });
        if (!validation.success) {
            return reply.status(400).send({ error: validation.error.format() });
        }
        // Inject userId from authenticated user
        const userId = req.user?.userId;
        if (!userId) {
            return reply.status(401).send({ error: 'Unauthorized: No userId found' });
        }
        // Save and return the full document info
        const doc = await DocumentRepository.create({ ...validation.data, userId });
        return reply.code(201).send({
            message: 'Document uploaded successfully',
            document: doc,
        });
    },
};
