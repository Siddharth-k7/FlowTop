import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

const CODE_MESSAGE = 'Enter the 6-digit code from your authenticator app';

/** A second factor: exactly one of the two, checked by the service. */
export class SecondFactorDto {
  @ApiPropertyOptional({ example: '123456', description: 'From the authenticator app' })
  @IsOptional()
  @Matches(/^\d{6}$/, { message: CODE_MESSAGE })
  code?: string;

  @ApiPropertyOptional({ example: 'ABCD-EFGH-JKMN-PQRS', description: 'One of the recovery codes shown at setup. Each works once.' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  recoveryCode?: string;
}

export class MfaVerifyDto {
  @ApiProperty({ example: '123456' })
  @Matches(/^\d{6}$/, { message: CODE_MESSAGE })
  code!: string;
}

export class MfaDisableDto extends SecondFactorDto {
  @ApiProperty({ description: 'The current password' })
  @IsString()
  @MaxLength(256)
  password!: string;
}

export interface MfaSetupResponse {
  /** Base32, for typing in by hand when the QR code cannot be scanned. */
  secret: string;
  /** otpauth:// URI. The admin app renders it as a QR code. */
  otpauthUri: string;
  expiresAt: string;
}

export interface MfaEnabledResponse {
  /** Shown once. Never returned again, and stored only as hashes. */
  recoveryCodes: string[];
}
