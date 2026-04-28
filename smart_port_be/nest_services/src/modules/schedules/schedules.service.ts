import { Injectable } from '@nestjs/common';
import { Schedule } from '../../core/enitites/schedules.entity';

@Injectable()
export class SchedulesService {

  private schedules: Schedule[] = [
    {
      id: 1,
      vessel_id: 101,
      berth_id: 5,
      start_time: new Date(),
      end_time: new Date(),
    },
  ];

  getSchedules(): Schedule[] {
    return this.schedules;
  }

  checkAvailability(
    berth_id: number,
    start: Date,
    end: Date,
  ): boolean {

    const overlap = this.schedules.find(s =>
      s.berth_id === berth_id &&
      (
        (start >= s.start_time && start <= s.end_time) ||
        (end >= s.start_time && end <= s.end_time)
      )
    );

    return !overlap;
  }
}