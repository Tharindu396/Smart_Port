import {
  Controller,
  Get,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam, ApiResponse } from '@nestjs/swagger';
import { InvoiceService } from './invoice.service';
import { InvoiceStatus } from './entities/invoice.entity';

@ApiTags('invoices')
@Controller('api/v1/invoices')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  /**
   * GET /api/v1/invoices
   * Returns all invoices. Finance Officers use this for overview.
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all invoices' })
  @ApiQuery({ name: 'status', enum: InvoiceStatus, required: false })
  @ApiResponse({ status: 200, description: 'List of invoices' })
  async findAll(@Query('status') status?: InvoiceStatus) {
    if (status) {
      const invoices = await this.invoiceService.findByStatus(status);
      return { invoices, count: invoices.length };
    }
    const invoices = await this.invoiceService.findAll();
    return { invoices, count: invoices.length };
  }

  /**
   * GET /api/v1/invoices/:id
   * Returns a single invoice by its UUID.
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get invoice by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Invoice UUID' })
  @ApiResponse({ status: 200, description: 'Invoice found' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.invoiceService.findById(id);
  }

  /**
   * GET /api/v1/invoices/vessel/:vesselId
   * Returns all invoices for a specific vessel.
   * Shipping Agents use this to see their billing history.
   */
  @Get('vessel/:vesselId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get invoices by vessel ID' })
  @ApiParam({ name: 'vesselId', type: String, description: 'Vessel ID from Berthing Service' })
  @ApiResponse({ status: 200, description: 'Invoices for vessel' })
  async findByVessel(@Param('vesselId') vesselId: string) {
    const invoices = await this.invoiceService.findByVesselId(vesselId);
    return { invoices, count: invoices.length };
  }
}