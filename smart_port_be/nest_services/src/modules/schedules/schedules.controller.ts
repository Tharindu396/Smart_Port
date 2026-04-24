import { Controller, Get, UseGuards } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('schedules')
@UseGuards(JwtAuthGuard)
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get()
  @Roles(Role.BERTH_PLANNER, Role.OPERATIONS_STAFF)
  @RequirePermission('view_berth_graph')
  getSchedules() {
    return this.schedulesService.getSchedules();
  }
}
