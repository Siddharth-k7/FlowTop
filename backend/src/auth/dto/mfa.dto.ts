import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { SecondFactorDto } from '../mfa/mfa.dto';

/** The second login step: the mfaToken plus exactly one of `code` or `recoveryCode`. */
export class MfaDto extends SecondFactorDto {
  @ApiProperty({ description: 'The mfaToken returned by POST /auth/login' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  mfaToken!: string;
}
