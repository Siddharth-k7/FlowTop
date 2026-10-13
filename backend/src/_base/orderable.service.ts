import { Injectable } from '@nestjs/common';

export interface OrderableTransaction {
  updatePosition(id: string, position: number): Promise<void>;
}

export interface OrderableRepository {
  transaction<T>(work: (transaction: OrderableTransaction) => Promise<T>): Promise<T>;
}

@Injectable()
export class OrderableService {
  async reorder(ids: string[], repository: OrderableRepository): Promise<void> {
    if (new Set(ids).size !== ids.length) {
      throw new Error('Reorder ids must be unique');
    }
    await repository.transaction(async (transaction) => {
      for (const [index, id] of ids.entries()) {
        await transaction.updatePosition(id, index + 1);
      }
    });
  }
}
