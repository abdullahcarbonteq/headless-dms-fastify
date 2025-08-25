UPDATE documents SET storage_provider = 'fs' WHERE storage_provider IS NULL;

UPDATE documents
SET external_key = REGEXP_REPLACE(path, '^.*/', '')
WHERE external_key IS NULL AND path IS NOT NULL;