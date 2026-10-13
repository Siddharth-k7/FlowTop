import { PublishStateService, type PublishStateRepository } from './publish-state.service';
import type { AuditService } from '../audit/audit.service';

const recordMock = jest.fn().mockResolvedValue(undefined);
const audit = { record: recordMock } as unknown as AuditService;
const repository: PublishStateRepository = { updateStatus: jest.fn((id, status, publishedAt) => Promise.resolve({ id, status, publishedAt })) };

describe('PublishStateService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('publishes a draft and audits it', async () => {
    const result = await new PublishStateService(audit).transition({ id: '1', status: 'draft', publishedAt: null }, 'published', repository, 'product', 'user-1');
    expect(result.status).toBe('published');
    expect(result.publishedAt).toBeInstanceOf(Date);
    expect(recordMock).toHaveBeenCalledWith({ actorId: 'user-1', action: 'publish', entityType: 'product', entityId: '1' });
  });

  it('rejects illegal transitions and blocking archives', async () => {
    await expect(new PublishStateService(audit).transition({ id: '1', status: 'draft', publishedAt: null }, 'archived', repository, 'product', 'u')).rejects.toThrow('Illegal');
    await expect(new PublishStateService(audit).transition({ id: '1', status: 'published', publishedAt: new Date() }, 'archived', repository, 'product', 'u', () => Promise.resolve(true))).rejects.toThrow('referenced');
  });
});
