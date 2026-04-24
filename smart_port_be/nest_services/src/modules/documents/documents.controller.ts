import { Controller, Get, UseGuards, Post, Body, Delete, Param, ParseIntPipe } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { Document } from '../../core/enitites/documents.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {

  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  @Roles(Role.SHIPPING_AGENT, Role.BERTH_PLANNER, Role.FINANCE_OFFICER, Role.OPERATIONS_STAFF)
  @RequirePermission('view_manifest')
  getDocuments(): Document[] {
    return this.documentsService.getDocuments();
  }

  @Post()
  @Roles(Role.SHIPPING_AGENT, Role.BERTH_PLANNER)
  @RequirePermission('upload_manifest')
  createDocument(@Body() documentData: any) {
    return this.documentsService.createDocument(documentData);
  }

  @Delete(':id')
  @Roles(Role.BERTH_PLANNER)
  @RequirePermission('approve_manifest')
  deleteDocument(@Param('id', ParseIntPipe) id: number) {
    return this.documentsService.deleteDocument(id);
  }
}