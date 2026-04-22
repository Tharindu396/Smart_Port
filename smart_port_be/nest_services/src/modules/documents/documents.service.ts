import { Injectable } from '@nestjs/common';
import { Document } from './documents.entity';

@Injectable()
export class DocumentsService {

  getDocuments(): Document[] {
    return [
      {
        id: 1,
        vessel_id: 101,
        type: 'Bill of Lading',
        file_url: 'http://example.com/doc.pdf',
        status: 'APPROVED',
      },
    ];
  }
}