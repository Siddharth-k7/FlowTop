import { Body, Controller, Get, Header, Put, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthGuard, CurrentUser, PermissionGuard, RequirePermission } from '../auth';
import type { AuthUser } from '../auth';
import { clientIp } from '../common/http/client-ip';
import { enforceRateLimit } from '../common/rate-limit/enforce-rate-limit';
import { RateLimiter } from '../common/rate-limit/rate-limiter';
import { UpdateSettingDto } from './dto/settings.dto';
import type { PublicSettings, SettingItem } from './dto/settings.dto';
import { SettingsService } from './settings.service';

/** Generous: the website reads this on page loads. It still has a ceiling, like every public route. */
const PUBLIC_READS_PER_IP = { limit: 120, windowMs: 60_000 };

@ApiTags('settings')
@Controller('settings')
export class PublicSettingsController {
  constructor(
    private readonly settings: SettingsService,
    private readonly rateLimiter: RateLimiter,
  ) {}

  /** No login. Only the WhatsApp number and templates, never anything else. Cached for a minute at most. */
  @Get('public')
  @Header('Cache-Control', 'public, max-age=60')
  async getPublic(@Req() req: Request): Promise<{ data: PublicSettings }> {
    enforceRateLimit(this.rateLimiter.hit(`settings-public:ip:${clientIp(req)}`, PUBLIC_READS_PER_IP));
    return { data: await this.settings.getPublic() };
  }
}

@ApiTags('settings')
@Controller('admin/settings')
@UseGuards(AuthGuard, PermissionGuard)
export class AdminSettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  @RequirePermission('settings:read')
  async list(): Promise<{ data: SettingItem[] }> {
    return { data: await this.settings.list() };
  }

  @Put()
  @RequirePermission('settings:write')
  async update(@Body() dto: UpdateSettingDto, @CurrentUser() user: AuthUser): Promise<{ data: SettingItem }> {
    return { data: await this.settings.update(dto.key, dto.value, user.id) };
  }
}
