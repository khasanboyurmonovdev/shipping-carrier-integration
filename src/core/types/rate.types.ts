import { Address } from "./address.types";
import { Package } from "./package.types";

/**
 * Service level options (carrier-agnostic)
 */
export enum ServiceLevel {
  GROUND = "GROUND",
  TWO_DAY = "TWO_DAY",
  NEXT_DAY = "NEXT_DAY",
  NEXT_DAY_EARLY_AM = "NEXT_DAY_EARLY_AM",
  THREE_DAY = "THREE_DAY",
  INTERNATIONAL_ECONOMY = "INTERNATIONAL_ECONOMY",
  INTERNATIONAL_PRIORITY = "INTERNATIONAL_PRIORITY",
}

/**
 * Request for getting shipping rates
 */
export interface RateRequest {
  origin: Address;
  destination: Address;
  packages: Package[];
  serviceLevel?: ServiceLevel; // Optional: get rates for specific service only
}

/**
 * A single rate quote from a carrier
 */
export interface RateQuote {
  carrierName: string; // e.g., "UPS"
  serviceName: string; // e.g., "Ground", "Next Day Air"
  serviceLevel: ServiceLevel;
  totalCost: number;
  currency: string; // e.g., "USD"
  estimatedDeliveryDate?: string; // ISO date string
  guaranteedDelivery?: boolean;
}

/**
 * Response containing one or more rate quotes
 */
export interface RateResponse {
  quotes: RateQuote[];
  requestId?: string; // For tracking/debugging
}
