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
import { MessagePattern, Payload } from '@nestjs/microservices'; 
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

@MessagePattern('berthing.allocated') // Listens for Berthing success
  async handleBerthAllocated(@Payload() data: any) {
    console.log(`📥 Logistics received allocation update for Visit: ${data.visitId}`);
    return await this.vesselService.updateStatus(data.visitId, 'ALLOCATED');
  }

  @MessagePattern('berthing.failed') // Listens for Berthing failure
  async handleBerthFailed(@Payload() data: any) {
    console.warn(`📥 Logistics received allocation failure for Visit: ${data.visitId}`);
    return await this.vesselService.updateStatus(data.visitId, 'REJECTED');
  }


}