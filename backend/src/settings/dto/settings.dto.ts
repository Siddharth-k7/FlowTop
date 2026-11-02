import { ApiProperty } from '@nestjs/swagger';
import { Allow, IsString, MaxLength } from 'class-validator';

export class UpdateSettingDto {
  @ApiProperty({ example: 'whatsapp.number' })
  @IsString()
  @MaxLength(100)
  key!: string;

  /** Any JSON. Checked against the key's own rules by the service. */
  @ApiProperty({ example: '+919876543210', description: 'Shape depends on the key: text, an email list, or null where allowed' })
  @Allow()
  value!: unknown;
}

export interface SettingItem {
  key: string;
  value: unknown;
  description: string;
  public: boolean;
  /** Null until someone changes it from its seed value. */
  updatedBy: { id: string; name: string } | null;
  updatedAt: string | null;
}

export interface PublicSettings {
  whatsapp: {
    /** Null while Flowtop has not set one: the website hides WhatsApp. */
    number: string | null;
    generalTemplate: string;
    productTemplate: string;
  };
}
