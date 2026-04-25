import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from '../../core/enitites/user.entity';
import { AdminBootstrapService } from './admin-bootstrap.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService, AdminBootstrapService],
  exports: [UsersService],
})
export class UsersModule {}