import axios from "axios";

export interface ApiError {
  message: string;
  status: number;
}

export function handleApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 403) {
      return {
        message: 'Unable to access FPL data. Please try again later.',
        status: 403
      };
    }
    return {
      message: error.response?.data?.message || 'An error occurred while fetching data',
      status: error.response?.status || 500
    };
  }
  return {
    message: 'An unexpected error occurred',
    status: 500
  };
}