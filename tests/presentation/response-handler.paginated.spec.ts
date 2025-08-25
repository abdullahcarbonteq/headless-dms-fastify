import { expect } from 'chai';
import { ResponseHandler } from '../../src/presentation/http/utils/ResponseHandler.js';

// Minimal FastifyReply stub
class ReplyStub {
  public statusCode?: number;
  public sent?: any;
  status(code: number) { this.statusCode = code; return this; }
  send(payload: any) { this.sent = payload; return this; }
}

describe('ResponseHandler.paginated (hexapp Paginated)', () => {
  it('formats hexapp Paginated<T> into hexapp pagination block', () => {
    const reply = new ReplyStub() as any;
    const paginated = {
      data: [{ a: 1 }, { a: 2 }],
      pageNum: 2,
      pageSize: 2,
      totalPages: 5,
    };

    const result = {
      isErr: () => false,
      unwrap: () => paginated,
    } as any;

    ResponseHandler.paginated(reply, result);

    expect(reply.statusCode).to.equal(200);
    expect(reply.sent.success).to.equal(true);
    expect(reply.sent.data).to.deep.equal(paginated.data);
    expect(reply.sent.pagination).to.deep.equal({
      pageNum: 2,
      pageSize: 2,
      totalPages: 5,
    });
  });

  it('handles single-page input (normalized) with HexPaginated shape', () => {
    const reply = new ReplyStub() as any;
    const paginated = {
      data: [{ a: 1 }, { a: 2 }],
      pageNum: 1,
      pageSize: 2,
      totalPages: 1,
    };

    const result = {
      isErr: () => false,
      unwrap: () => paginated,
    } as any;

    ResponseHandler.paginated(reply, result);

    expect(reply.statusCode).to.equal(200);
    expect(reply.sent.success).to.equal(true);
    expect(reply.sent.data).to.deep.equal(paginated.data);
    expect(reply.sent.pagination).to.deep.equal({
      pageNum: 1,
      pageSize: 2,
      totalPages: 1,
    });
  });
});

