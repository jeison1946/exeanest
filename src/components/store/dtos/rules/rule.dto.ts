import { IsNotEmpty, IsString, IsNumber, IsDateString } from 'class-validator';

export class RuletDto {
  @IsNotEmpty()
  @IsDateString()
  created: Date;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  author: string;

  @IsNotEmpty()
  @IsNumber()
  song_id: number;

  @IsNotEmpty()
  @IsNumber()
  point_of_sale: number;

  @IsNotEmpty()
  @IsNumber()
  rule_id: number;

  @IsNotEmpty()
  @IsString()
  name_rule: string;
}
