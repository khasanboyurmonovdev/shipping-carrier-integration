import axios from "axios";

/**
 * HTTP request configuration
 */
export interface HttpRequestConfig {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  url: string;
  headers?: Record<string, string>;
  data?: any;
  params?: Record<string, string | number>;
  timeout?: number;
}

/**
 * HTTP response wrapper
 */
export interface HttpResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

/**
 * HTTP error wrapper
 */
export interface HttpError {
  message: string;
  status?: number;
  statusText?: string;
  data?: any;
  isTimeout: boolean;
  isNetworkError: boolean;
}

/**
 * HTTP Client interface for making requests
 * This abstraction allows for easy stubbing/mocking in tests
 */
export interface IHttpClient {
  request<T = any>(config: HttpRequestConfig): Promise<HttpResponse<T>>;
}

/**
 * Axios-based HTTP client implementation
 */
export class HttpClient implements IHttpClient {
  private axiosInstance: any;

  constructor(baseURL?: string, defaultTimeout: number = 30000) {
    this.axiosInstance = axios.create({
      baseURL,
      timeout: defaultTimeout,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Make an HTTP request
   */
  async request<T = any>(config: HttpRequestConfig): Promise<HttpResponse<T>> {
    try {
      const response = await this.axiosInstance.request({
        method: config.method,
        url: config.url,
        headers: config.headers,
        data: config.data,
        params: config.params,
        timeout: config.timeout,
      });

      return {
        data: response.data as T,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers as Record<string, string>,
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Convert axios errors to our HttpError format
   */
  private handleError(error: any): HttpError {
    // Check if it's an axios error
    if (error.response) {
      // HTTP error response
      return {
        message: error.message || "HTTP error",
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        isTimeout: false,
        isNetworkError: false,
      };
    }

    // Check for timeout
    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      return {
        message: "Request timeout",
        isTimeout: true,
        isNetworkError: false,
      };
    }

    // Network error (no response)
    if (error.request) {
      return {
        message: error.message || "Network error",
        isTimeout: false,
        isNetworkError: true,
      };
    }

    // Unknown error
    return {
      message: error.message || "Unknown error",
      isTimeout: false,
      isNetworkError: false,
    };
  }
}
