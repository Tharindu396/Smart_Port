import { Injectable } from '@nestjs/common';
import { Document } from '../../core/enitites/documents.entity';

@Injectable()
export class DocumentsService {
  private readonly documents: Document[] = [
    {
      id: 1,
      vessel_id: 101,
      type: 'Bill of Lading',
      file_url: 'http://example.com/doc.pdf',
      status: 'APPROVED',
    },
  ];

  getDocuments(): Document[] {
    return this.documents;
  }

  createDocument(documentData: Omit<Document, 'id'>): Document {
    const document: Document = {
      ...documentData,
      id: this.documents.length + 1,
    };
    this.documents.push(document);
    return document;
  }

  deleteDocument(id: number): { deleted: boolean } {
    const index = this.documents.findIndex((document) => document.id === id);
    if (index !== -1) {
      this.documents.splice(index, 1);
      return { deleted: true };
    }
    return { deleted: false };
  }
}