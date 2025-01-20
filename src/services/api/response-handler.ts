import { AxiosError, AxiosResponse } from 'axios';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static fromAxiosError(error: AxiosError): ApiError {
    const errorDetails = {
      status: error?.response?.status || 0,
      data: error?.response?.data || null,
      message: error?.message || 'Unknown error',
      code: error?.code || 'UNKNOWN_ERROR',
      url: error?.config?.url || 'unknown endpoint'
    };

    if (!error?.response) {
      return new ApiError(
        `Network error: ${errorDetails.message}`,
        0,
        'NETWORK_ERROR'
      );
    }

    const status = error.response.status;

    switch (status) {
      case 403:
        return new ApiError(
          'Access to FPL data is currently restricted',
          status,
          'FORBIDDEN'
        );
      case 404:
        return new ApiError(
          'Resource not found',
          status,
          'NOT_FOUND'
        );
      case 429:
        return new ApiError(
          'Too many requests',
          status,
          'RATE_LIMITED'
        );
      default:
        return new ApiError(
          status >= 500 
            ? 'FPL service is currently unavailable'
            : `Unable to fetch FPL data: ${error.message}`,
          status,
          status >= 500 ? 'SERVER_ERROR' : 'UNKNOWN'
        );
    }
  }
}

export async function handleApiResponse<T>(promise: Promise<any>): Promise<T> {
  try {
    const response = await promise;
    // Check if response exists and has data property
    if (!response) {
      console.error('No response received from API');
      throw new ApiError('No response received from API', 500, 'NO_RESPONSE');
    }
    
    // Handle both direct data responses and responses with a data property
    const data = response.data !== undefined ? response.data : response;
    
    if (data === undefined || data === null) {
      console.error('No data in API response');
      throw new ApiError('No data received from API', 500, 'NO_DATA');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    if (error instanceof AxiosError) {
      throw ApiError.fromAxiosError(error);
    }
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      'An unexpected error occurred',
      500,
      'INTERNAL_ERROR'
    );
  }
}