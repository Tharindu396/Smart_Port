import { Controller, Get, UseGuards, Post, Body, Delete, Param, ParseIntPipe } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { Invoice } from '../../core/enitites/invoices.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoicesController {

  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  @Roles(Role.SHIPPING_AGENT, Role.FINANCE_OFFICER)
  @RequirePermission('view_invoices')
  getInvoices(): Invoice[] {
    return this.invoicesService.getInvoices();
  }

  @Post()
  @Roles(Role.FINANCE_OFFICER)
  @RequirePermission('set_tariff_rates')
  createInvoice(@Body() invoiceData: any) {
    return this.invoicesService.createInvoice(invoiceData);
  }

  @Delete(':id')
  @Roles(Role.FINANCE_OFFICER)
  @RequirePermission('approve_penalty_waivers')
  deleteInvoice(@Param('id', ParseIntPipe) id: number) {
    return this.invoicesService.deleteInvoice(id);
  }
}