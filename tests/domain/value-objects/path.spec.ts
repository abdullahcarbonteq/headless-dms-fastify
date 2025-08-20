import { expect } from 'chai';
import { PathVO } from '../../../src/domain/value-objects/PathVO.js'

describe('Path VO ', () => {
    it('accepts valid paths', () => {
        const res = PathVO.create('/path/to/file.txt');
        expect(res.isOk()).to.equal(true);
        expect(res.unwrap().value).to.equal('/path/to/file.txt');
    });

    it('rejects empty paths', () => {
        const res = PathVO.create('   ');
        expect(res.isErr()).to.equal(true);
    });
});