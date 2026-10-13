import { BaseRepository, type RepositoryDelegate } from './base-repository';
import type { PaginationQueryDto } from '../common/dto/pagination';

interface Row { id: string }
type Args = { where?: unknown };
class TestRepository extends BaseRepository<Row, Args, Args, { data: Row }, { where: { id: string }; data: Row }> {
  protected readonly delegate: RepositoryDelegate<Row, Args, Args, { data: Row }, { where: { id: string }; data: Row }> = {
    findUnique: () => Promise.resolve({ id: '1' }),
    findMany: () => Promise.resolve([{ id: '1' }]),
    count: () => Promise.resolve(1),
    create: ({ data }) => Promise.resolve(data),
    update: ({ data }) => Promise.resolve(data),
  };
}

describe('BaseRepository', () => {
  it('returns the contract pagination envelope', async () => {
    const query: PaginationQueryDto = { page: 2, perPage: 1 };
    await expect(new TestRepository().findMany({}, query)).resolves.toEqual({
      data: [{ id: '1' }], meta: { page: 2, perPage: 1, total: 1, totalPages: 1 },
    });
  });
});
