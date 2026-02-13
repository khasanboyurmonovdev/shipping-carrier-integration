import { UPSCarrier } from "../../carriers/ups/ups.carrier";
import { UPSRatingOperation } from "../../carriers/ups/operations/rating.operation";
import { IHttpClient, HttpResponse } from "../../http/http.client";
import { RateRequest, ServiceLevel, ErrorCategory } from "../../core/types";
import {
  UPSTokenResponse,
  UPSRateResponse,
} from "../../carriers/ups/types/ups-api.types";
import { OperationType } from "../../core/carrier.interface";

/**
 * Mock HTTP Client for testing
 */
class MockHttpClient implements IHttpClient {
  private responses: Map<string, any> = new Map();
  private requestLog: any[] = [];

  mockResponse(urlPattern: string, response: any) {
    this.responses.set(urlPattern, response);
  }

  getRequestLog() {
    return this.requestLog;
  }

  clear() {
    this.responses.clear();
    this.requestLog = [];
  }

  async request<T = any>(config: any): Promise<HttpResponse<T>> {
    this.requestLog.push({
      method: config.method,
      url: config.url,
      headers: config.headers,
      data: config.data,
    });

    for (const [pattern, response] of this.responses.entries()) {
      if (config.url.includes(pattern)) {
        if (response.isError) {
          throw response.error;
        }
        return {
          data: response as T,
          status: 200,
          statusText: "OK",
          headers: {},
        };
      }
    }

    throw new Error(`No mock response for: ${config.url}`);
  }
}

describe("UPS Rating Integration Tests", () => {
  let mockHttpClient: MockHttpClient;
  let ratingOperation: UPSRatingOperation;

  const validRateRequest: RateRequest = {
    origin: {
      streetLines: ["123 Main St"],
      city: "San Francisco",
      stateOrProvince: "CA",
      postalCode: "94105",
      countryCode: "US",
    },
    destination: {
      streetLines: ["456 Market St"],
      city: "Los Angeles",
      stateOrProvince: "CA",
      postalCode: "90001",
      countryCode: "US",
    },
    packages: [
      {
        dimensions: {
          length: 10,
          width: 8,
          height: 6,
          unit: "IN",
        },
        weight: {
          value: 5,
          unit: "LBS",
        },
      },
    ],
  };

  const mockTokenResponse: UPSTokenResponse = {
    access_token: "mock_access_token_12345",
    token_type: "Bearer",
    expires_in: 3600,
    issued_at: new Date().toISOString(),
    client_id: "test_client_id",
  };

  const mockRateResponse: UPSRateResponse = {
    RateResponse: {
      Response: {
        ResponseStatus: {
          Code: "1",
          Description: "Success",
        },
        TransactionReference: {
          CustomerContext: "Rating Request",
        },
      },
      RatedShipment: [
        {
          Service: {
            Code: "03",
            Description: "UPS Ground",
          },
          TotalCharges: {
            CurrencyCode: "USD",
            MonetaryValue: "15.50",
          },
          TimeInTransit: {
            ServiceSummary: {
              EstimatedArrival: {
                Arrival: {
                  Date: "2024-02-20",
                  Time: "23:59:00",
                },
              },
            },
          },
        },
        {
          Service: {
            Code: "02",
            Description: "UPS 2nd Day Air",
          },
          TotalCharges: {
            CurrencyCode: "USD",
            MonetaryValue: "25.75",
          },
          GuaranteedDelivery: {
            BusinessDaysInTransit: "2",
          },
        },
      ],
    },
  };

  beforeEach(() => {
    mockHttpClient = new MockHttpClient();
    ratingOperation = new UPSRatingOperation(mockHttpClient);
  });

  afterEach(() => {
    mockHttpClient.clear();
  });

  describe("Successful Rate Requests", () => {
    test("should fetch rates successfully with valid request", async () => {
      mockHttpClient.mockResponse("oauth/token", mockTokenResponse);
      mockHttpClient.mockResponse("rating/v1/rate", mockRateResponse);

      const result = await ratingOperation.getRates(validRateRequest);

      expect("category" in result).toBe(false);

      if ("quotes" in result) {
        expect(result.quotes).toHaveLength(2);
        expect(result.quotes[0].carrierName).toBe("UPS");
        expect(result.quotes[0].serviceName).toBe("UPS Ground");
        expect(result.quotes[0].serviceLevel).toBe(ServiceLevel.GROUND);
        expect(result.quotes[0].totalCost).toBe(15.5);
        expect(result.quotes[0].currency).toBe("USD");
      }
    });

    test("should build correct UPS request payload", async () => {
      mockHttpClient.mockResponse("oauth/token", mockTokenResponse);
      mockHttpClient.mockResponse("rating/v1/rate", mockRateResponse);

      await ratingOperation.getRates(validRateRequest);

      const requests = mockHttpClient.getRequestLog();
      const rateRequest = requests.find((r) => r.url.includes("rating"));

      expect(rateRequest).toBeDefined();
      expect(rateRequest.method).toBe("POST");
      expect(rateRequest.headers.Authorization).toBe(
        "Bearer mock_access_token_12345",
      );
    });
  });

  describe("Authentication Flow", () => {
    test("should acquire token before making rate request", async () => {
      mockHttpClient.mockResponse("oauth/token", mockTokenResponse);
      mockHttpClient.mockResponse("rating/v1/rate", mockRateResponse);

      await ratingOperation.getRates(validRateRequest);

      const requests = mockHttpClient.getRequestLog();
      expect(requests[0].url).toContain("oauth/token");
      expect(requests[0].method).toBe("POST");
    });
  });

  describe("Error Handling", () => {
    test("should handle validation errors", async () => {
      const invalidRequest = {
        ...validRateRequest,
        origin: {
          ...validRateRequest.origin,
          postalCode: "",
        },
      };

      const result = await ratingOperation.getRates(invalidRequest as any);

      if ("category" in result) {
        expect(result.category).toBe(ErrorCategory.VALIDATION);
        expect(result.retryable).toBe(false);
      }
    });

    test("should handle network timeout", async () => {
      mockHttpClient.mockResponse("oauth/token", mockTokenResponse);
      mockHttpClient.mockResponse("rating/v1/rate", {
        isError: true,
        error: {
          isTimeout: true,
          message: "Request timeout",
        },
      });

      const result = await ratingOperation.getRates(validRateRequest);

      if ("category" in result) {
        expect(result.category).toBe(ErrorCategory.NETWORK);
        expect(result.retryable).toBe(true);
      }
    });

    test("should handle rate limiting (429)", async () => {
      mockHttpClient.mockResponse("oauth/token", mockTokenResponse);
      mockHttpClient.mockResponse("rating/v1/rate", {
        isError: true,
        error: {
          status: 429,
        },
      });

      const result = await ratingOperation.getRates(validRateRequest);

      if ("category" in result) {
        expect(result.category).toBe(ErrorCategory.RATE_LIMIT);
        expect(result.statusCode).toBe(429);
      }
    });
  });

  describe("UPS Carrier Integration", () => {
    test("should properly initialize carrier", () => {
      const carrier = new UPSCarrier(mockHttpClient);
      expect(carrier.name).toBe("UPS");
      expect(carrier.isConfigured()).toBe(true);
    });

    test("should provide rating operation", () => {
      const carrier = new UPSCarrier(mockHttpClient);
      const operation = carrier.getOperation(OperationType.RATING);
      expect(operation.type).toBe(OperationType.RATING);
    });
  });
});
