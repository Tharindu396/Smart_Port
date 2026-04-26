import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AllocationHistoryEntry,
  AllocationHistoryResponse,
} from '../kafka/kafka.events';

/**
 * BerthingClient
 *
 * The Berthing Service (Go) emits only vesselID on the Kafka wire.
 * This client calls back to the Berthing Service HTTP API to fetch the
 * full allocation record so the Invoice Service can calculate correct fees.
 *
 * Endpoint used: GET /api/v1/allocations/history?limit=100
 * Response shape: { history: AllocationHistoryEntry[] }
 *
 * No changes to the berthing service are required.
 */
@Injectable()
export class BerthingClient {
  private readonly logger = new Logger(BerthingClient.name);
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('berthingServiceUrl');
  }

  /**
   * Finds the most recent allocation record for a given vessel ID.
   * Returns null if not found (e.g., event arrived before history was written).
   */
  async findLatestAllocationByVessel(
    vesselId: string,
  ): Promise<AllocationHistoryEntry | null> {
    const url = `${this.baseUrl}/api/v1/allocations/history?limit=100`;

    try {
      this.logger.debug(`🔍 Fetching allocation history from berthing service: ${url}`);

      const response = await fetch(url);

      if (!response.ok) {
        this.logger.error(
          `Berthing service returned HTTP ${response.status} for ${url}`,
        );
        return null;
      }

      const body: AllocationHistoryResponse = await response.json();

      const entry = body.history?.find((h) => h.vessel_id === vesselId) ?? null;

      if (!entry) {
        this.logger.warn(
          `No allocation history found for vessel ${vesselId}`,
        );
      }

      return entry;
    } catch (error) {
      this.logger.error(
        `Failed to reach berthing service at ${url}: ${error.message}`,
      );
      return null;
    }
  }
}