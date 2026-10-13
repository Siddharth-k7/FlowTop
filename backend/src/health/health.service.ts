import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { HealthStatusDto } from './dto/health-response.dto';
import { HealthRepository } from './health.repository';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(private readonly repository: HealthRepository) {}

  async check(): Promise<HealthStatusDto> {
    try {
      await this.repository.pingDatabase();
    } catch (error) {
      this.logger.error('Database health check failed', error instanceof Error ? error.stack : undefined);
      throw new ServiceUnavailableException('Database unavailable');
    }
    return { status: 'ok', database: 'up' };
  }
}
