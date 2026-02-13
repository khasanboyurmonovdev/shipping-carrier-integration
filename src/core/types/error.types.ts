/**
 * Error categories for structured error handling
 */
export enum ErrorCategory {
  AUTHENTICATION = "AUTHENTICATION",
  VALIDATION = "VALIDATION",
  NETWORK = "NETWORK",
  RATE_LIMIT = "RATE_LIMIT",
  CARRIER_ERROR = "CARRIER_ERROR",
  UNKNOWN = "UNKNOWN",
}

/**
 * Structured error response
 */
export interface ServiceError {
  category: ErrorCategory;
  message: string;
  statusCode?: number; // HTTP status code if applicable
  carrierCode?: string; // Carrier-specific error code
  details?: unknown; // Additional error context
  retryable: boolean; // Can the caller retry?
}
