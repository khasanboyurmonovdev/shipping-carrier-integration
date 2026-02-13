/**
 * UPS OAuth Token Response
 */
export interface UPSTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  issued_at: string;
  client_id: string;
  scope?: string;
}

/**
 * UPS Address format
 */
export interface UPSAddress {
  AddressLine: string[];
  City: string;
  StateProvinceCode: string;
  PostalCode: string;
  CountryCode: string;
}

/**
 * UPS Package dimensions
 */
export interface UPSDimensions {
  UnitOfMeasurement: {
    Code: string; // "IN" or "CM"
  };
  Length: string;
  Width: string;
  Height: string;
}

/**
 * UPS Package weight
 */
export interface UPSPackageWeight {
  UnitOfMeasurement: {
    Code: string; // "LBS" or "KGS"
  };
  Weight: string;
}

/**
 * UPS Package
 */
export interface UPSPackage {
  PackagingType: {
    Code: string; // "02" = Customer Supplied Package
  };
  Dimensions: UPSDimensions;
  PackageWeight: UPSPackageWeight;
}

/**
 * UPS Shipment for rating request
 */
export interface UPSShipment {
  Shipper: {
    Address: UPSAddress;
  };
  ShipTo: {
    Address: UPSAddress;
  };
  ShipFrom: {
    Address: UPSAddress;
  };
  Service?: {
    Code: string; // Service code (e.g., "03" for Ground)
  };
  Package: UPSPackage[];
}

/**
 * UPS Rating Request
 */
export interface UPSRateRequest {
  RateRequest: {
    Request: {
      TransactionReference?: {
        CustomerContext?: string;
      };
    };
    Shipment: UPSShipment;
  };
}

/**
 * UPS Rated Shipment (response)
 */
export interface UPSRatedShipment {
  Service: {
    Code: string;
    Description?: string;
  };
  RatedShipmentAlert?: Array<{
    Code: string;
    Description: string;
  }>;
  BillingWeight?: {
    UnitOfMeasurement: {
      Code: string;
    };
    Weight: string;
  };
  TotalCharges: {
    CurrencyCode: string;
    MonetaryValue: string;
  };
  GuaranteedDelivery?: {
    BusinessDaysInTransit: string;
    DeliveryByTime?: string;
  };
  TimeInTransit?: {
    ServiceSummary: {
      EstimatedArrival: {
        Arrival: {
          Date: string;
          Time: string;
        };
      };
    };
  };
}

/**
 * UPS Rating Response
 */
export interface UPSRateResponse {
  RateResponse: {
    Response: {
      ResponseStatus: {
        Code: string;
        Description: string;
      };
      TransactionReference?: {
        CustomerContext?: string;
      };
    };
    RatedShipment: UPSRatedShipment[];
  };
}

/**
 * UPS Error Response
 */
export interface UPSErrorResponse {
  response: {
    errors: Array<{
      code: string;
      message: string;
    }>;
  };
}

/**
 * UPS Service Code Mapping
 */
export const UPS_SERVICE_CODES = {
  GROUND: "03",
  THREE_DAY: "12",
  TWO_DAY: "02",
  NEXT_DAY: "01",
  NEXT_DAY_EARLY_AM: "14",
  WORLDWIDE_EXPRESS: "07",
  WORLDWIDE_EXPEDITED: "08",
} as const;
