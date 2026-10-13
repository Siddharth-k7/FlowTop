import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { NormalizeEmail } from './normalize-email';

export class PasswordResetRequestDto {
  @ApiProperty({ example: 'priya@flowtop.in' })
  @NormalizeEmail()
  @IsEmail()
  @MaxLength(254)
  email!: string;
}

export class PasswordResetConfirmDto {
  @ApiProperty({ description: 'The token from the reset link' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  token!: string;

  @ApiProperty({ minLength: 12 })
  @IsString()
  @MinLength(12, { message: 'Use at least 12 characters' })
  @MaxLength(256)
  password!: string;
}
