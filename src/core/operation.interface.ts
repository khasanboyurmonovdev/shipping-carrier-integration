import { RateRequest, RateResponse, ServiceError } from "./types";
import { IOperation, OperationType } from "./carrier.interface";

/**
 * Interface for rating operations
 * Any carrier's rating implementation must follow this contract
 */
export interface IRatingOperation extends IOperation {
  type: OperationType.RATING;

  /**
   * Fetch shipping rates
   * @param request - Normalized rate request
   * @returns Promise with rate quotes or error
   */
  getRates(request: RateRequest): Promise<RateResponse | ServiceError>;
}

// Future operations can be added here:
// export interface ILabelOperation extends IOperation { ... }
// export interface ITrackingOperation extends IOperation { ... }
