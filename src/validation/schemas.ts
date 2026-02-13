import { z } from "zod";
import { ServiceLevel } from "../core/types";

/**
 * Address validation schema
 */
export const AddressSchema = z.object({
  streetLines: z.array(z.string().min(1)).min(1).max(3),
  city: z.string().min(1),
  stateOrProvince: z.string().min(1),
  postalCode: z.string().min(1),
  countryCode: z.string().length(2).toUpperCase(),
  isResidential: z.boolean().optional(),
});

/**
 * Package dimensions validation schema
 */
export const PackageDimensionsSchema = z.object({
  length: z.number().positive(),
  width: z.number().positive(),
  height: z.number().positive(),
  unit: z.enum(["IN", "CM"]),
});

/**
 * Package weight validation schema
 */
export const PackageWeightSchema = z.object({
  value: z.number().positive(),
  unit: z.enum(["LBS", "KG"]),
});

/**
 * Package validation schema
 */
export const PackageSchema = z.object({
  dimensions: PackageDimensionsSchema,
  weight: PackageWeightSchema,
  description: z.string().optional(),
});

/**
 * Service level validation schema
 */
export const ServiceLevelSchema = z.nativeEnum(ServiceLevel);

/**
 * Rate request validation schema
 */
export const RateRequestSchema = z.object({
  origin: AddressSchema,
  destination: AddressSchema,
  packages: z.array(PackageSchema).min(1),
  serviceLevel: ServiceLevelSchema.optional(),
});

/**
 * Validation helper function
 */
export function validateRateRequest(data: unknown): any {
  return RateRequestSchema.parse(data);
}

/**
 * Safe validation (returns result object instead of throwing)
 */
export function safeValidateRateRequest(data: unknown) {
  return RateRequestSchema.safeParse(data);
}
