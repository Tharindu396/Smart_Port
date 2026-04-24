import { IsEmail, IsOptional, IsString, MinLength, IsEnum } from 'class-validator';
import { Role } from '../../../common/enums/role.enum';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsEnum(Role, {
    message:
      'Invalid role. Must be one of: shipping_agent, berth_planner, finance_officer, operations_staff',
  })
  @IsOptional()
  role?: Role;

  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;
}