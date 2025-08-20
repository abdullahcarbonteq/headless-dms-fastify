import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import { Document, DocumentStatus } from '../../../src/domain/entities/document/Document.js';
import { 
  assertSuccess, 
  assertError, 
  mockUUID, 
  mockDate,
  createTestData 
} from '../../helpers/generic-test-helpers.js';

describe('Document Entity (Generic Testing)', () => {
  let testData: any;
  let document: Document;

  beforeEach(() => {
    testData = createTestData();
    document = new Document(
      testData.document.id,
      testData.document.filename,
      testData.document.mimetype,
      testData.document.path,
      testData.document.tags,
      testData.document.description,
      testData.document.userId,
      testData.document.status,
      testData.document.createdAt,
      testData.document.updatedAt
    );
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('Constructor and Basic Properties', () => {
    it('should create a document with valid data', () => {
      expect(document.filename).to.equal(testData.document.filename);
      expect(document.mimetype).to.equal(testData.document.mimetype);
      expect(document.path).to.equal(testData.document.path);
      expect(document.tags).to.deep.equal(testData.document.tags);
      expect(document.description).to.equal(testData.document.description);
      expect(document.userId).to.equal(testData.document.userId);
      expect(document.status).to.equal(testData.document.status);
    });

    it('should have id, createdAt, and updatedAt properties', () => {
      expect(document).to.have.property('id');
      expect(document).to.have.property('createdAt');
      expect(document).to.have.property('updatedAt');
    });

    it('should return immutable tags array', () => {
      const originalTags = [...document.tags];
      document.tags.push('new-tag');
      expect(document.tags).to.deep.equal(originalTags);
    });
  });

  describe('Business Logic Methods', () => {
    it('should correctly identify document status', () => {
      expect(document.isActive()).to.be.true;
      expect(document.isArchived()).to.be.false;
      expect(document.isDeleted()).to.be.false;
    });

    it('should correctly identify document types', () => {
      expect(document.isPDF()).to.be.true;
      expect(document.isImage()).to.be.false;
      expect(document.isTextFile()).to.be.false;
    });

    it('should correctly check for tags', () => {
      expect(document.hasTag('test')).to.be.true;
      expect(document.hasTag('document')).to.be.true;
      expect(document.hasTag('nonexistent')).to.be.false;
    });
  });

  describe('Tag Management', () => {
    it('should add a new tag successfully', () => {
      const result = document.addTag('new-tag');
      assertSuccess(result, document);
      expect(document.tags).to.include('new-tag');
    });

    it('should not add duplicate tags', () => {
      const result = document.addTag('test');
      assertError(result, 'Tag already exists');
    });

    it('should remove an existing tag', () => {
      const result = document.removeTag('test');
      assertSuccess(result, document);
      expect(document.tags).to.not.include('test');
    });

    it('should not remove non-existent tags', () => {
      const result = document.removeTag('nonexistent');
      assertError(result, 'Tag does not exist');
    });

    it('should update all tags', () => {
      const newTags = ['tag1', 'tag2', 'tag3'];
      const result = document.updateTags(newTags);
      assertSuccess(result, document);
      expect(document.tags).to.deep.equal(newTags);
    });
  });

  describe('Metadata Updates', () => {
    it('should update description successfully', () => {
      const newDescription = 'Updated description';
      const result = document.updateDescription(newDescription);
      assertSuccess(result, document);
      expect(document.description).to.equal(newDescription);
    });

    it('should update filename successfully', () => {
      const newFilename = 'updated-document.pdf';
      const result = document.updateFilename(newFilename);
      assertSuccess(result, document);
      expect(document.filename).to.equal(newFilename);
    });

    it('should update MIME type successfully', () => {
      const newMimeType = 'text/plain';
      const result = document.updateMimeType(newMimeType);
      assertSuccess(result, document);
      expect(document.mimetype).to.equal(newMimeType);
    });

    it('should update path successfully', () => {
      const newPath = '/new/path/document.pdf';
      const result = document.updatePath(newPath);
      assertSuccess(result, document);
      expect(document.path).to.equal(newPath);
    });
  });

  describe('Status Management', () => {
    it('should archive an active document', () => {
      const result = document.archive();
      assertSuccess(result, document);
      expect(document.status).to.equal(DocumentStatus.ARCHIVED);
      expect(document.isArchived()).to.be.true;
    });

    it('should not archive an already archived document', () => {
      document.archive();
      const result = document.archive();
      assertError(result, 'Document is already archived');
    });

    it('should activate an archived document', () => {
      document.archive();
      const result = document.activate();
      assertSuccess(result, document);
      expect(document.status).to.equal(DocumentStatus.ACTIVE);
      expect(document.isActive()).to.be.true;
    });

    it('should not activate an already active document', () => {
      const result = document.activate();
      assertError(result, 'Document is already active');
    });

    it('should soft delete a document', () => {
      const result = document.softDelete();
      assertSuccess(result, document);
      expect(document.status).to.equal(DocumentStatus.DELETED);
      expect(document.isDeleted()).to.be.true;
    });

    it('should not delete an already deleted document', () => {
      document.softDelete();
      const result = document.softDelete();
      assertError(result, 'Document is already deleted');
    });
  });

  describe('Validation', () => {
    it('should validate a valid document', () => {
      expect(document.validate()).to.be.true;
    });

    it('should not validate a document with empty filename', () => {
      const invalidDoc = new Document(
        testData.document.id,
        '',
        'application/pdf',
        '/path/file.pdf',
        ['tag'],
        'description',
        'user-id'
      );
      expect(invalidDoc.validate()).to.be.false;
    });

    it('should not validate a document with empty MIME type', () => {
      const invalidDoc = new Document(
        testData.document.id,
        'filename.pdf',
        '',
        '/path/file.pdf',
        ['tag'],
        'description',
        'user-id'
      );
      expect(invalidDoc.validate()).to.be.false;
    });
  });

  describe('Serialization', () => {
    it('should serialize to JSON correctly', () => {
      const json = document.toJSON();
      expect(json.filename).to.equal(document.filename);
      expect(json.mimetype).to.equal(document.mimetype);
      expect(json.path).to.equal(document.path);
      expect(json.tags).to.deep.equal(document.tags);
      expect(json.description).to.equal(document.description);
      expect(json.userId).to.equal(document.userId);
      expect(json.status).to.equal(document.status);
    });

    it('should implement serialize method', () => {
      const serialized = document.serialize();
      expect(serialized).to.deep.equal(document.toJSON());
    });
  });

  describe('Static Factory Methods', () => {
    it('should create document from data', () => {
      const data = {
        id: testData.document.id,
        filename: 'factory-doc.pdf',
        mimetype: 'application/pdf',
        path: '/factory/path.pdf',
        tags: ['factory', 'test'],
        description: 'Factory created document',
        userId: testData.document.userId,
        status: DocumentStatus.ACTIVE,
        createdAt: testData.document.createdAt,
        updatedAt: testData.document.updatedAt
      };

      const result = Document.create(data);
      assertSuccess(result);
      const doc = result.unwrap();
      expect(doc.filename).to.equal(data.filename);
      expect(doc.tags).to.deep.equal(data.tags);
    });

    it('should create new document with generated ID', () => {
      const result = Document.createNew(
        'new-doc.pdf',
        'application/pdf',
        '/new/path.pdf',
        ['new', 'document'],
        'New document description',
        'user-id'
      );

      assertSuccess(result);
      const doc = result.unwrap();
      expect(doc.filename).to.equal('new-doc.pdf');
      expect(doc.status).to.equal(DocumentStatus.ACTIVE);
    });

    it('should create document from database row', () => {
      const dbRow = {
        id: testData.document.id,
        filename: 'db-doc.pdf',
        mimetype: 'application/pdf',
        path: '/db/path.pdf',
        tags: ['db', 'test'],
        description: 'DB document',
        user_id: testData.document.userId,
        status: DocumentStatus.ACTIVE,
        created_at: testData.document.createdAt,
        updated_at: testData.document.updatedAt
      };

      const result = Document.fromDatabaseRow(dbRow);
      assertSuccess(result);
      const doc = result.unwrap();
      expect(doc.filename).to.equal(dbRow.filename);
      expect(doc.userId).to.equal(dbRow.user_id);
    });
  });

  describe('Cloning', () => {
    it('should create a deep copy of the document', () => {
      const cloned = document.clone();
      expect(cloned).to.not.equal(document);
      expect(cloned.filename).to.equal(document.filename);
      expect(cloned.tags).to.deep.equal(document.tags);
    });

    it('should allow independent modification of cloned document', () => {
      const cloned = document.clone();
      cloned.addTag('cloned-tag');
      
      expect(document.tags).to.not.include('cloned-tag');
      expect(cloned.tags).to.include('cloned-tag');
    });
  });
}); 