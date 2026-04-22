import { Controller, Get } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { Schedule } from './schedules.entity';

@Controller('schedules')
export class SchedulesController {

  constructor(private readonly schedulesService: SchedulesService) {}

  @Get()
  getSchedules(): Schedule[] {
    return this.schedulesService.getSchedules();
  }
}