import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class MfaDto {
  @ApiProperty({ description: 'The mfaToken returned by POST /auth/login' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  mfaToken!: string;

  @ApiProperty({ example: '123456' })
  @Matches(/^\d{6}$/, { message: 'Enter the 6-digit code from your authenticator app' })
  code!: string;
}
