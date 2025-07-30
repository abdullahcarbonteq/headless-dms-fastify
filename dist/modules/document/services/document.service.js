import { Result } from '@carbonteq/fp';
// TODO: This will be injected via DI in Phase 2D
const documentRepository = new (await import('../repositories/DrizzleDocumentRepository.js')).DrizzleDocumentRepository();
export const DocumentService = {
    async uploadDocument(data) {
        try {
            const createResult = await documentRepository.createDocument(data);
            if (createResult.isErr()) {
                return Result.Err(new Error('Failed to create document'));
            }
            return Result.Ok(createResult.unwrap());
        }
        catch (error) {
            return Result.Err(error instanceof Error ? error : new Error('Failed to upload document'));
        }
    },
    async getAllDocuments() {
        try {
            const documentsResult = await documentRepository.getAllDocuments();
            if (documentsResult.isErr()) {
                return Result.Err(new Error('Failed to get documents'));
            }
            return Result.Ok(documentsResult.unwrap());
        }
        catch (error) {
            return Result.Err(error instanceof Error ? error : new Error('Failed to get documents'));
        }
    },
    async deleteDocument(id) {
        try {
            const deleteResult = await documentRepository.deleteDocument(id);
            if (deleteResult.isErr()) {
                return Result.Err(new Error('Failed to delete document'));
            }
            return Result.Ok(deleteResult.unwrap());
        }
        catch (error) {
            return Result.Err(error instanceof Error ? error : new Error('Failed to delete document'));
        }
    },
    async searchDocuments(criteria) {
        try {
            const searchResult = await documentRepository.searchDocuments(criteria);
            if (searchResult.isErr()) {
                return Result.Err(new Error('Failed to search documents'));
            }
            return Result.Ok(searchResult.unwrap());
        }
        catch (error) {
            return Result.Err(error instanceof Error ? error : new Error('Failed to search documents'));
        }
    },
    async getDocumentById(id) {
        try {
            const documentResult = await documentRepository.findById(id);
            if (documentResult.isErr()) {
                return Result.Err(new Error('Failed to get document'));
            }
            return Result.Ok(documentResult.unwrap());
        }
        catch (error) {
            return Result.Err(error instanceof Error ? error : new Error('Failed to get document'));
        }
    }
};
