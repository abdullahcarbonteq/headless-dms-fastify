import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { config } from '../../../config/index.js';
export const FileHandlerService = {
    /**
     * Save uploaded file to disk
     * @param file - Multipart file from request
     * @returns Promise<FileInfo> - File information
     */
    async saveFile(file) {
        const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(file.filename)}`;
        const uploadPath = path.join(config.app.upload.uploadDir, uniqueName);
        // Ensure upload directory exists
        await fs.promises.mkdir(config.app.upload.uploadDir, { recursive: true });
        // Write file to disk
        const writeStream = fs.createWriteStream(uploadPath);
        file.file.pipe(writeStream);
        await new Promise((resolve, reject) => {
            writeStream.on('finish', resolve);
            writeStream.on('error', reject);
            file.file.on('error', reject);
        });
        // Get file size
        const stats = fs.statSync(uploadPath);
        return {
            path: uploadPath,
            filename: file.filename,
            mimetype: file.mimetype,
            size: stats.size,
        };
    },
    /**
     * Extract form fields from multipart request
     * @param parts - Multipart parts iterator
     * @returns Promise<Record<string, string>> - Form fields
     */
    async extractFields(parts) {
        const fields = {};
        for await (const part of parts) {
            if (part.type === 'field') {
                fields[part.fieldname] = part.value;
            }
        }
        return fields;
    }
};
