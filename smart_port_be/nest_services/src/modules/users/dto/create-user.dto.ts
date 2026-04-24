import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum } from 'class-validator';
import { Role } from '../../../common/enums/role.enum';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsEnum(Role, {
    message:
      'Invalid role. Must be one of: shipping_agent, berth_planner, finance_officer, operations_staff',
  })
  @IsNotEmpty()
  role!: Role;

  @IsString()
  @MinLength(6)
  password!: string;
}