import { IRatingOperation } from "../../../core/operation.interface";
import { OperationType } from "../../../core/carrier.interface";
import {
  RateRequest,
  RateResponse,
  ServiceError,
  ErrorCategory,
} from "../../../core/types";
import { IHttpClient } from "../../../http/http.client";
import { HttpClient } from "../../../http/http.client";

import { UPSOAuthClient } from "../auth/oauth.client";
import { UPSRateMapper } from "../mappers/rate.mapper";
import { UPSRateResponse, UPSErrorResponse } from "../types/ups-api.types";
import { validateRateRequest } from "../../../validation/schemas";
import { config } from "../../../config/config";

/**
 * UPS Rating Operation Implementation
 * Handles fetching shipping rates from UPS API
 */
export class UPSRatingOperation implements IRatingOperation {
  readonly type = OperationType.RATING;
  readonly carrierName = "UPS";

  private httpClient: IHttpClient;
  private oauthClient: UPSOAuthClient;

  constructor(httpClient?: IHttpClient, oauthClient?: UPSOAuthClient) {
    this.httpClient = httpClient || new HttpClient(config.ups.apiBaseUrl);
    this.oauthClient = oauthClient || new UPSOAuthClient(this.httpClient);
  }

  /**
   * Get shipping rates from UPS
   */
  async getRates(request: RateRequest): Promise<RateResponse | ServiceError> {
    try {
      // Step 1: Validate input
      const validatedRequest = this.validateRequest(request);

      // Step 2: Get access token
      const accessToken = await this.oauthClient.getAccessToken();

      // Step 3: Convert to UPS format
      const upsRequest = UPSRateMapper.toUPSRequest(validatedRequest);

      // Step 4: Make API request
      const response = await this.httpClient.request<UPSRateResponse>({
        method: "POST",
        url: "/rating/v1/rate",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        data: upsRequest,
      });

      // Step 5: Convert response to normalized format
      return UPSRateMapper.fromUPSResponse(response.data);
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Validate rate request
   */
  private validateRequest(request: RateRequest): RateRequest {
    try {
      return validateRateRequest(request);
    } catch (error: any) {
      throw {
        category: ErrorCategory.VALIDATION,
        message: `Invalid rate request: ${error.message}`,
        details: error.errors || error,
        retryable: false,
      };
    }
  }

  /**
   * Handle errors and convert to ServiceError
   */
  private handleError(error: any): ServiceError {
    // Already a ServiceError from validation
    if (error.category) {
      return error as ServiceError;
    }

    // Authentication error
    if (error.message?.includes("authentication")) {
      return {
        category: ErrorCategory.AUTHENTICATION,
        message: error.message,
        retryable: true,
      };
    }

    // Timeout error
    if (error.isTimeout) {
      return {
        category: ErrorCategory.NETWORK,
        message: "Request timeout - UPS API did not respond in time",
        retryable: true,
      };
    }

    // Network error
    if (error.isNetworkError) {
      return {
        category: ErrorCategory.NETWORK,
        message: "Network error - Unable to reach UPS API",
        retryable: true,
      };
    }

    // Rate limiting (429)
    if (error.status === 429) {
      return {
        category: ErrorCategory.RATE_LIMIT,
        message: "Rate limit exceeded - Too many requests to UPS API",
        statusCode: 429,
        retryable: true,
      };
    }

    // HTTP 4xx errors (client errors)
    if (error.status && error.status >= 400 && error.status < 500) {
      return {
        category: ErrorCategory.CARRIER_ERROR,
        message: this.parseUPSError(error.data) || "UPS API error",
        statusCode: error.status,
        carrierCode: this.extractUPSErrorCode(error.data),
        details: error.data,
        retryable: false,
      };
    }

    // HTTP 5xx errors (server errors)
    if (error.status && error.status >= 500) {
      return {
        category: ErrorCategory.CARRIER_ERROR,
        message: "UPS API server error",
        statusCode: error.status,
        details: error.data,
        retryable: true,
      };
    }

    // Unknown error
    return {
      category: ErrorCategory.UNKNOWN,
      message: error.message || "An unknown error occurred",
      details: error,
      retryable: false,
    };
  }

  /**
   * Parse UPS error message from response
   */
  private parseUPSError(errorData: any): string | null {
    try {
      const upsError = errorData as UPSErrorResponse;
      if (upsError?.response?.errors?.[0]?.message) {
        return upsError.response.errors[0].message;
      }
    } catch {
      // Ignore parsing errors
    }
    return null;
  }

  /**
   * Extract UPS error code from response
   */
  private extractUPSErrorCode(errorData: any): string | undefined {
    try {
      const upsError = errorData as UPSErrorResponse;
      if (upsError?.response?.errors?.[0]?.code) {
        return upsError.response.errors[0].code;
      }
    } catch {
      // Ignore parsing errors
    }
    return undefined;
  }
}
