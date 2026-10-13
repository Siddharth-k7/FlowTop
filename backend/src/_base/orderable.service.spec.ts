import { OrderableService, type OrderableRepository } from './orderable.service';

describe('OrderableService', () => {
  it('reorders from position 1 without gaps in one transaction', async () => {
    const positions: Array<[string, number]> = [];
    let transactions = 0;
    const repository: OrderableRepository = {
      transaction: (work) => { transactions += 1; return work({ updatePosition: (id, position) => { positions.push([id, position]); return Promise.resolve(); } }); },
    };
    await new OrderableService().reorder(['c', 'a', 'b'], repository);
    expect(transactions).toBe(1);
    expect(positions).toEqual([['c', 1], ['a', 2], ['b', 3]]);
  });

  it('rejects duplicate ids', async () => {
    await expect(new OrderableService().reorder(['a', 'a'], { transaction: <T>() => Promise.resolve(undefined as T) })).rejects.toThrow('unique');
  });
});
