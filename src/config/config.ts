import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

/**
 * Configuration interface for UPS carrier
 */
export interface UPSConfig {
  clientId: string;
  clientSecret: string;
  apiBaseUrl: string;
  authUrl: string;
}

/**
 * Application configuration
 */
export interface AppConfig {
  nodeEnv: string;
  ups: UPSConfig;
  tokenCacheBufferSeconds: number;
}

/**
 * Load and validate configuration from environment variables
 */
function loadConfig(): AppConfig {
  // Required UPS configuration
  const upsClientId = process.env.UPS_CLIENT_ID;
  const upsClientSecret = process.env.UPS_CLIENT_SECRET;
  const upsApiBaseUrl =
    process.env.UPS_API_BASE_URL || "https://onlinetools.ups.com/api";
  const upsAuthUrl =
    process.env.UPS_AUTH_URL ||
    "https://onlinetools.ups.com/security/v1/oauth/token";

  // Validate required fields
  if (!upsClientId || !upsClientSecret) {
    throw new Error(
      "Missing required UPS configuration. Please set UPS_CLIENT_ID and UPS_CLIENT_SECRET in your .env file",
    );
  }

  return {
    nodeEnv: process.env.NODE_ENV || "development",
    ups: {
      clientId: upsClientId,
      clientSecret: upsClientSecret,
      apiBaseUrl: upsApiBaseUrl,
      authUrl: upsAuthUrl,
    },
    tokenCacheBufferSeconds: parseInt(
      process.env.TOKEN_CACHE_BUFFER_SECONDS || "300",
      10,
    ),
  };
}

// Export singleton config instance
export const config = loadConfig();
