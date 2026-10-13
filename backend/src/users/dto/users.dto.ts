import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ROLES } from '../../auth';
import type { RoleName } from '../../auth';
import { NormalizeEmail } from '../../auth/dto/normalize-email';
import { PaginationQueryDto } from '../../common/dto/pagination';

export class ListUsersQuery extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Matches name or email' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;
}

export class InviteUserDto {
  @ApiProperty({ example: 'Priya Nair' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: 'priya@flowtop.in' })
  @NormalizeEmail()
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({ enum: ROLES })
  @IsIn(ROLES)
  role!: RoleName;
}

export class ChangeRoleDto {
  @ApiProperty({ enum: ROLES })
  @IsIn(ROLES)
  role!: RoleName;
}

/** An admin user as the users endpoints return it. Never includes credentials or secrets. */
export interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: string | null;
  isActive: boolean;
  mfaEnabled: boolean;
  createdAt: string;
}
