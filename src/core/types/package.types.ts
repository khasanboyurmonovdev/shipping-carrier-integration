/**
 * Package dimensions and weight
 */
export interface PackageDimensions {
  length: number;
  width: number;
  height: number;
  unit: "IN" | "CM"; // Inches or Centimeters
}

export interface PackageWeight {
  value: number;
  unit: "LBS" | "KG"; // Pounds or Kilograms
}

/**
 * Complete package information
 */
export interface Package {
  dimensions: PackageDimensions;
  weight: PackageWeight;
  description?: string;
}
