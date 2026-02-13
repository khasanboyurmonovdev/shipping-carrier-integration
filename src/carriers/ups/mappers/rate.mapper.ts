import {
  RateRequest,
  RateResponse,
  RateQuote,
  Address,
  Package,
  ServiceLevel,
} from "../../../core/types";
import {
  UPSRateRequest,
  UPSRateResponse,
  UPSAddress,
  UPSPackage,
  UPSRatedShipment,
  UPS_SERVICE_CODES,
} from "../types/ups-api.types";

/**
 * Maps our normalized types to UPS API format and vice versa
 */
export class UPSRateMapper {
  /**
   * Convert normalized RateRequest to UPS API format
   */
  static toUPSRequest(request: RateRequest): UPSRateRequest {
    const packages = request.packages.map((pkg) => this.toUPSPackage(pkg));

    const shipment: any = {
      Shipper: {
        Address: this.toUPSAddress(request.origin),
      },
      ShipTo: {
        Address: this.toUPSAddress(request.destination),
      },
      ShipFrom: {
        Address: this.toUPSAddress(request.origin),
      },
      Package: packages,
    };

    // Add service code if specific service level requested
    if (request.serviceLevel) {
      const serviceCode = this.getUPSServiceCode(request.serviceLevel);
      if (serviceCode) {
        shipment.Service = {
          Code: serviceCode,
        };
      }
    }

    return {
      RateRequest: {
        Request: {
          TransactionReference: {
            CustomerContext: "Rating Request",
          },
        },
        Shipment: shipment,
      },
    };
  }

  /**
   * Convert UPS API response to normalized RateResponse
   */
  static fromUPSResponse(upsResponse: UPSRateResponse): RateResponse {
    const ratedShipments = upsResponse.RateResponse.RatedShipment;

    const quotes: RateQuote[] = ratedShipments.map((shipment) =>
      this.toRateQuote(shipment),
    );

    return {
      quotes,
      requestId:
        upsResponse.RateResponse.Response.TransactionReference?.CustomerContext,
    };
  }

  /**
   * Convert normalized Address to UPS Address format
   */
  private static toUPSAddress(address: Address): UPSAddress {
    return {
      AddressLine: address.streetLines,
      City: address.city,
      StateProvinceCode: address.stateOrProvince,
      PostalCode: address.postalCode,
      CountryCode: address.countryCode,
    };
  }

  /**
   * Convert normalized Package to UPS Package format
   */
  private static toUPSPackage(pkg: Package): UPSPackage {
    // Convert dimension unit
    const dimensionCode = pkg.dimensions.unit === "IN" ? "IN" : "CM";

    // Convert weight unit
    const weightCode = pkg.weight.unit === "LBS" ? "LBS" : "KGS";

    return {
      PackagingType: {
        Code: "02", // Customer Supplied Package
      },
      Dimensions: {
        UnitOfMeasurement: {
          Code: dimensionCode,
        },
        Length: pkg.dimensions.length.toString(),
        Width: pkg.dimensions.width.toString(),
        Height: pkg.dimensions.height.toString(),
      },
      PackageWeight: {
        UnitOfMeasurement: {
          Code: weightCode,
        },
        Weight: pkg.weight.value.toString(),
      },
    };
  }

  /**
   * Convert UPS RatedShipment to normalized RateQuote
   */
  private static toRateQuote(shipment: UPSRatedShipment): RateQuote {
    const serviceLevel = this.mapUPSServiceToServiceLevel(
      shipment.Service.Code,
    );

    // Extract estimated delivery date if available
    let estimatedDeliveryDate: string | undefined;
    if (
      shipment.TimeInTransit?.ServiceSummary?.EstimatedArrival?.Arrival?.Date
    ) {
      estimatedDeliveryDate =
        shipment.TimeInTransit.ServiceSummary.EstimatedArrival.Arrival.Date;
    }

    return {
      carrierName: "UPS",
      serviceName:
        shipment.Service.Description || `UPS Service ${shipment.Service.Code}`,
      serviceLevel,
      totalCost: parseFloat(shipment.TotalCharges.MonetaryValue),
      currency: shipment.TotalCharges.CurrencyCode,
      estimatedDeliveryDate,
      guaranteedDelivery: !!shipment.GuaranteedDelivery,
    };
  }

  /**
   * Get UPS service code from our normalized ServiceLevel
   */
  private static getUPSServiceCode(serviceLevel: ServiceLevel): string | null {
    const mapping: Record<ServiceLevel, string> = {
      [ServiceLevel.GROUND]: UPS_SERVICE_CODES.GROUND,
      [ServiceLevel.TWO_DAY]: UPS_SERVICE_CODES.TWO_DAY,
      [ServiceLevel.THREE_DAY]: UPS_SERVICE_CODES.THREE_DAY,
      [ServiceLevel.NEXT_DAY]: UPS_SERVICE_CODES.NEXT_DAY,
      [ServiceLevel.NEXT_DAY_EARLY_AM]: UPS_SERVICE_CODES.NEXT_DAY_EARLY_AM,
      [ServiceLevel.INTERNATIONAL_ECONOMY]:
        UPS_SERVICE_CODES.WORLDWIDE_EXPEDITED,
      [ServiceLevel.INTERNATIONAL_PRIORITY]:
        UPS_SERVICE_CODES.WORLDWIDE_EXPRESS,
    };

    return mapping[serviceLevel] || null;
  }

  /**
   * Map UPS service code back to our ServiceLevel
   */
  private static mapUPSServiceToServiceLevel(
    serviceCode: string,
  ): ServiceLevel {
    const mapping: Record<string, ServiceLevel> = {
      "03": ServiceLevel.GROUND,
      "02": ServiceLevel.TWO_DAY,
      "12": ServiceLevel.THREE_DAY,
      "01": ServiceLevel.NEXT_DAY,
      "14": ServiceLevel.NEXT_DAY_EARLY_AM,
      "07": ServiceLevel.INTERNATIONAL_PRIORITY,
      "08": ServiceLevel.INTERNATIONAL_ECONOMY,
    };

    return mapping[serviceCode] || ServiceLevel.GROUND;
  }
}
