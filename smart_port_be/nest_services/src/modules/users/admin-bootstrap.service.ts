import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from '../../common/enums/role.enum';
import { UsersService } from './users.service';

@Injectable()
export class AdminBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminBootstrapService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const adminCount = await this.usersService.countByRole(Role.Admin);
    if (adminCount > 0) {
      return;
    }

    const name = this.configService.get<string>('INITIAL_ADMIN_NAME');
    const email = this.configService.get<string>('INITIAL_ADMIN_EMAIL');
    const password = this.configService.get<string>('INITIAL_ADMIN_PASSWORD');

    if (!name || !email || !password) {
      this.logger.warn(
        'No admin user exists. Set INITIAL_ADMIN_NAME, INITIAL_ADMIN_EMAIL, and INITIAL_ADMIN_PASSWORD to auto-create the first admin at startup.',
      );
      return;
    }

    await this.usersService.create({
      name,
      email,
      password,
      role: Role.Admin,
    });

    this.logger.log(`Initial admin user created: ${email}`);
  }
}
