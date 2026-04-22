import { IsEmail, IsNotEmpty, IsString, MinLength,IsNumber,IsDate } from 'class-validator';

export class CreateUserDto {
  @IsNumber()
  @IsNotEmpty()
  id!: number;

  @IsNumber()
  @IsNotEmpty()
  vessel_id!: number;

  @IsNumber()
  @IsNotEmpty()
  berth_id!: number;

  @IsDate()
  @IsNotEmpty()
  start_time!: Date;

  @IsDate()
  @IsNotEmpty()
  end_time!: Date;
}