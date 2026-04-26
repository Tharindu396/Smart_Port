import { Module } from '@nestjs/common';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { SchedulesModule } from '../schedules/schedules.module';
import { StatusModule } from '../status/status.module';

@Module({
  imports: [SchedulesModule, StatusModule],
  controllers: [InvoicesController],
  providers: [InvoicesService],
})
export class InvoicesModule {}