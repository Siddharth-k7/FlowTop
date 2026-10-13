import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { AuthGuard, CurrentUser, PermissionGuard, RequirePermission } from '../auth';
import type { AuthUser } from '../auth';
import type { Paginated } from '../common/dto/pagination';
import { ListMediaQuery, UpdateMediaDto, UploadMediaDto } from './dto/media.dto';
import type { MediaAssetResponse } from './dto/media.dto';
import { MAX_UPLOAD_BYTES } from './file-types';
import { MediaService } from './media.service';

/**
 * Guards run before the file interceptor, so an unauthorised upload is
 * refused before its body is even read.
 */
@ApiTags('media')
@Controller('admin/media')
@UseGuards(AuthGuard, PermissionGuard)
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Post('upload')
  @RequirePermission('media:write')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'bucket'],
      properties: {
        file: { type: 'string', format: 'binary' },
        bucket: { type: 'string', enum: ['public', 'private'] },
        altText: { type: 'string' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_UPLOAD_BYTES, files: 1, fields: 5, parts: 6 },
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: UploadMediaDto,
    @CurrentUser() user: AuthUser,
  ): Promise<{ data: MediaAssetResponse }> {
    return { data: await this.media.upload(file, dto, user.id) };
  }

  @Get()
  @RequirePermission('media:read')
  list(@Query() query: ListMediaQuery): Promise<Paginated<MediaAssetResponse>> {
    return this.media.list(query);
  }

  @Get(':id')
  @RequirePermission('media:read')
  async get(@Param('id', ParseUUIDPipe) id: string): Promise<{ data: MediaAssetResponse }> {
    return { data: await this.media.get(id) };
  }

  @Patch(':id')
  @RequirePermission('media:write')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMediaDto,
  ): Promise<{ data: MediaAssetResponse }> {
    return { data: await this.media.updateAltText(id, dto.altText) };
  }

  @Delete(':id')
  @RequirePermission('media:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser): Promise<void> {
    await this.media.remove(id, user.id);
  }
}
