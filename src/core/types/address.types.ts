/**
 * Normalized address representation used across all carriers
 */
export interface Address {
  streetLines: string[]; // Address lines (e.g., ["123 Main St", "Apt 4"])
  city: string;
  stateOrProvince: string;
  postalCode: string;
  countryCode: string; // ISO 2-letter code (e.g., "US", "CA")
  isResidential?: boolean; // Some carriers charge more for residential
}
