import { Injectable } from '@nestjs/common';
import { Schedule } from '../../core/enitites/schedules.entity';

@Injectable()
export class SchedulesService {

  getSchedules(): Schedule[] {
    return [
      {
        id: 1,
        vessel_id: 101,
        berth_id: 5,
        start_time: new Date(),
        end_time: new Date(),
      },
    ];
  }
}