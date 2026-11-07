import type { AuditService } from '../audit/audit.service';
import type { SpecificationsRepository } from './specifications.repository';
import { SpecificationsService } from './specifications.service';

describe('SpecificationsService', () => {
  it('saves and reads a specification name that is not a fixed allow-list field', async () => {
    const rows = [{ id: 's1', productId: 'p1', group: 'Performance', name: 'Aerator Noise Rating', value: '18', unit: 'dB', type: 'number', position: 0 }];
    const replace = jest.fn().mockResolvedValue(rows);
    const findByProduct = jest.fn().mockResolvedValue(rows);
    const repository = { productExists: jest.fn().mockResolvedValue(true), findByProduct, replace } as unknown as SpecificationsRepository;
    const audit = { record: jest.fn().mockResolvedValue(undefined) } as unknown as AuditService;
    const specifications = new SpecificationsService(repository, audit);
    const saved = await specifications.replace('p1', { items: [{ name: 'Aerator Noise Rating', value: '18', unit: 'dB', type: 'number' }] }, 'actor');
    expect(saved.data[0].name).toBe('Aerator Noise Rating');
    expect(await specifications.list('p1')).toEqual({ data: rows });
    expect(replace).toHaveBeenCalledWith('p1', [{ productId: 'p1', group: null, name: 'Aerator Noise Rating', value: '18', unit: 'dB', type: 'number', position: 0 }]);
  });

  it('rejects an empty value before replacement', async () => {
    const replace = jest.fn();
    const repository = { productExists: jest.fn().mockResolvedValue(true), replace } as unknown as SpecificationsRepository;
    const specifications = new SpecificationsService(repository, { record: jest.fn() } as unknown as AuditService);
    await expect(specifications.replace('p1', { items: [{ name: 'Material', value: '   ', type: 'text' }] }, 'actor')).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
    expect(replace).not.toHaveBeenCalled();
  });
});
