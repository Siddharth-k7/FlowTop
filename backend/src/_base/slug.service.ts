import { Injectable } from '@nestjs/common';

export interface SlugRepository {
  exists(slug: string, excludeId?: string): Promise<boolean>;
}

@Injectable()
export class SlugService {
  async unique(name: string, repository: SlugRepository, requestedSlug?: string, excludeId?: string): Promise<string> {
    const base = this.slugify(requestedSlug ?? name);
    let candidate = base;
    let suffix = 2;
    while (await repository.exists(candidate, excludeId)) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }
    return candidate;
  }

  slugify(value: string): string {
    const slug = value
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return slug || 'untitled';
  }
}
