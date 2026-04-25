import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterUserDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}