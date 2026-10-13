import { ApiProperty } from '@nestjs/swagger';

export class HealthStatusDto {
  @ApiProperty({ example: 'ok' })
  status!: 'ok';

  @ApiProperty({ example: 'up' })
  database!: 'up';
}

export class HealthResponseDto {
  @ApiProperty({ type: HealthStatusDto })
  data!: HealthStatusDto;
}
