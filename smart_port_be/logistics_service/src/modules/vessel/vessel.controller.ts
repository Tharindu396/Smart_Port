import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  Get, Param, Delete
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { VesselService } from './vessel.service';
import { EventPattern, Payload } from '@nestjs/microservices';
import { CreateVisitDto } from './dto/create-visit.dto';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('vessel')
export class VesselController {
  constructor(private readonly vesselService: VesselService) {}

  @Post('request-berth')
  @UseInterceptors(
    FileInterceptor('manifestFile', {
      storage: diskStorage({
        destination: './uploads/manifests',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async requestBerth(
    @Body() createVisitDto: CreateVisitDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const filePath = file?.path || '';
    return this.vesselService.createVisit(createVisitDto, filePath);
  }


  @Get()
async getAll() {
  return this.vesselService.findAll();
}

@Get(':id')
async getOne(@Param('id') id: string) {
  return this.vesselService.findOne(id);
}

@Delete(':id')
async delete(@Param('id') id: string) {
  return this.vesselService.remove(id);
}

  @EventPattern('allocation.confirmed')
  async handleBerthAllocated(@Payload() data: any) {
    console.log(`📥 Logistics: berth confirmed for Visit: ${data.visitId}`);
    await this.vesselService.updateStatus(data.visitId, 'ALLOCATED');
  }

  @EventPattern('allocation.failed')
  async handleBerthFailed(@Payload() data: any) {
    console.warn(`📥 Logistics: allocation failed for Visit: ${data.visitId} — ${data.reason}`);
    await this.vesselService.updateStatus(data.visitId, 'REJECTED');
  }

  @EventPattern('invoice.paid')
  async handleInvoicePaid(@Payload() data: any) {
    console.log(`📥 Logistics: invoice paid for vessel: ${data.vessel_id}`);
    await this.vesselService.updateStatus(data.vessel_id, 'CONFIRMED');
  }

  @EventPattern('invoice.cancelled')
  async handleInvoiceCancelled(@Payload() data: any) {
    console.warn(`📥 Logistics: invoice cancelled for vessel: ${data.vessel_id}`);
    await this.vesselService.updateStatus(data.vessel_id, 'CANCELLED');
  }
}