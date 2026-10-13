import { paginate, pageToSkipTake, type Paginated, type PaginationQueryDto } from '../common/dto/pagination';

export interface RepositoryDelegate<T, FindArgs, ListArgs, CreateArgs, UpdateArgs> {
  findUnique(args: FindArgs): Promise<T | null>;
  findMany(args: ListArgs & { skip: number; take: number }): Promise<T[]>;
  count(args: ListArgs): Promise<number>;
  create(args: CreateArgs): Promise<T>;
  update(args: UpdateArgs): Promise<T>;
}

/** Common typed repository operations. Prisma-specific argument types stay in each concrete repository. */
export abstract class BaseRepository<
  T,
  FindArgs extends object = { where: unknown },
  ListArgs extends object = { where?: unknown },
  CreateArgs extends object = { data: unknown },
  UpdateArgs extends object = { where: unknown; data: unknown },
> {
  protected abstract readonly delegate: RepositoryDelegate<T, FindArgs, ListArgs, CreateArgs, UpdateArgs>;

  find(args: FindArgs): Promise<T | null> {
    return this.delegate.findUnique(args);
  }

  async findMany(args: ListArgs, query: PaginationQueryDto): Promise<Paginated<T>> {
    const [data, total] = await Promise.all([
      this.delegate.findMany({ ...args, ...pageToSkipTake(query) }),
      this.delegate.count(args),
    ]);
    return paginate(data, total, query);
  }

  create(args: CreateArgs): Promise<T> {
    return this.delegate.create(args);
  }

  update(args: UpdateArgs): Promise<T> {
    return this.delegate.update(args);
  }

  softDelete(args: UpdateArgs): Promise<T> {
    return this.delegate.update(args);
  }
}
