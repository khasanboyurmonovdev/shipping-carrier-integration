import {
  IHttpClient,
  HttpClient,
  HttpResponse,
} from "../../../http/http.client";
import { UPSTokenResponse } from "../types/ups-api.types";
import { config } from "../../../config/config";

/**
 * Cached token with expiry information
 */
interface CachedToken {
  accessToken: string;
  expiresAt: number; // Timestamp in milliseconds
}

/**
 * OAuth client for UPS authentication
 * Handles token acquisition, caching, and automatic refresh
 */
export class UPSOAuthClient {
  private httpClient: IHttpClient;
  private cachedToken: CachedToken | null = null;

  constructor(httpClient?: IHttpClient) {
    // Use injected client (for testing) or default HttpClient (for production)
    this.httpClient = httpClient || new HttpClient(config.ups.apiBaseUrl);
  }

  /**
   * Get a valid access token (from cache or fetch new)
   */
  async getAccessToken(): Promise<string> {
    if (this.cachedToken && this.isTokenValid(this.cachedToken)) {
      return this.cachedToken.accessToken;
    }

    return this.fetchNewToken();
  }

  /**
   * Check if cached token is still valid
   */
  private isTokenValid(token: CachedToken): boolean {
    const now = Date.now();
    const bufferMs = config.tokenCacheBufferSeconds * 1000;

    return token.expiresAt - bufferMs > now;
  }

  /**
   * Fetch a new token from UPS OAuth endpoint
   */
  private async fetchNewToken(): Promise<string> {
    try {
      const credentials = Buffer.from(
        `${config.ups.clientId}:${config.ups.clientSecret}`,
      ).toString("base64");

      const response: HttpResponse<UPSTokenResponse> =
        await this.httpClient.request({
          method: "POST",
          url: config.ups.authUrl,
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${credentials}`,
          },
          data: "grant_type=client_credentials",
        });

      const tokenData = response.data;

      const expiresAt = Date.now() + tokenData.expires_in * 1000;

      this.cachedToken = {
        accessToken: tokenData.access_token,
        expiresAt,
      };

      return tokenData.access_token;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Clear cached token (useful for testing)
   */
  clearCache(): void {
    this.cachedToken = null;
  }

  /**
   * Normalize authentication errors
   */
  private handleAuthError(error: any): Error {
    if (error.status === 401) {
      return new Error("UPS authentication failed: Invalid client credentials");
    }

    if (error.status === 403) {
      return new Error("UPS authentication failed: Access forbidden");
    }

    if (error.isTimeout) {
      return new Error("UPS authentication timeout");
    }

    if (error.isNetworkError) {
      return new Error("Network error during UPS authentication");
    }

    return new Error(`UPS authentication error: ${error.message}`);
  }
}
