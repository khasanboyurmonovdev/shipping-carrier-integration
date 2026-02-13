import {
  ICarrier,
  OperationType,
  IOperation,
} from "../../core/carrier.interface";
import { IRatingOperation } from "../../core/operation.interface";
import { UPSRatingOperation } from "./operations/rating.operation";
import { IHttpClient, HttpClient } from "../../http/http.client";
import { config } from "../../config/config";

/**
 * UPS Carrier Implementation
 * Main entry point for UPS integrations
 */
export class UPSCarrier implements ICarrier {
  readonly name = "UPS";

  private httpClient: IHttpClient;
  private ratingOperation: UPSRatingOperation;

  constructor(httpClient?: IHttpClient) {
    // Use injected client (for tests) or real HttpClient (production)
    this.httpClient = httpClient || new HttpClient(config.ups.apiBaseUrl);

    this.ratingOperation = new UPSRatingOperation(this.httpClient);
  }

  /**
   * Check if UPS carrier is properly configured
   */
  isConfigured(): boolean {
    return !!(
      config.ups.clientId &&
      config.ups.clientSecret &&
      config.ups.apiBaseUrl &&
      config.ups.authUrl
    );
  }

  /**
   * Get a specific operation implementation
   */
  getOperation<T extends IOperation>(operationType: OperationType): T {
    switch (operationType) {
      case OperationType.RATING:
        return this.ratingOperation as unknown as T;

      case OperationType.LABEL:
        throw new Error("Label operation not yet implemented for UPS");

      case OperationType.TRACKING:
        throw new Error("Tracking operation not yet implemented for UPS");

      case OperationType.ADDRESS_VALIDATION:
        throw new Error(
          "Address validation operation not yet implemented for UPS",
        );

      default:
        throw new Error(`Unsupported operation type: ${operationType}`);
    }
  }

  /**
   * Convenience method to get rating operation directly
   */
  getRatingOperation(): IRatingOperation {
    return this.getOperation<IRatingOperation>(OperationType.RATING);
  }
}
