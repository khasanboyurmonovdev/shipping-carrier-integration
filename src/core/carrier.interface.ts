import { ServiceError } from "./types";

/**
 * Base interface that all carriers must implement
 */
export interface ICarrier {
  readonly name: string; // e.g., "UPS", "FedEx", "USPS"

  /**
   * Check if carrier is properly configured and ready
   */
  isConfigured(): boolean;

  /**
   * Get a specific operation implementation
   */
  getOperation<T extends IOperation>(operationType: OperationType): T;
}

/**
 * Operation types that carriers can support
 */
export enum OperationType {
  RATING = "RATING",
  LABEL = "LABEL",
  TRACKING = "TRACKING",
  ADDRESS_VALIDATION = "ADDRESS_VALIDATION",
}

/**
 * Base interface for all operations (rating, labeling, tracking, etc.)
 */
export interface IOperation {
  readonly type: OperationType;
  readonly carrierName: string;
}
