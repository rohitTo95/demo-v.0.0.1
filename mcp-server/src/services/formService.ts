import axios, { AxiosResponse } from 'axios';
import config from '../config';
import { getSocketManager } from '../utils/socketManager';

export interface FormData {
  name: string;
  email: string;
  message: string;
}

export interface FormSubmissionResult {
  success: boolean;
  data?: any;
  error?: string;
}

export class FormService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.nextApiUrl;
  }

  /**
   * Validates form data before submission
   */
  public validateFormData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
      errors.push('Name is required and must be a non-empty string');
    }

    if (!data.email || typeof data.email !== 'string') {
      errors.push('Email is required and must be a string');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        errors.push('Email must be a valid email address');
      }
    }

    if (!data.message || typeof data.message !== 'string' || data.message.trim().length === 0) {
      errors.push('Message is required and must be a non-empty string');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Submits form data to Next.js API endpoint
   */
  public async submitForm(formData: FormData): Promise<FormSubmissionResult> {
    const socketManager = getSocketManager();
    
    try {
      // Emit form received event
      socketManager.emitFormReceived(formData);

      // Validate data
      const validation = this.validateFormData(formData);
      if (!validation.isValid) {
        const error = `Validation failed: ${validation.errors.join(', ')}`;
        socketManager.emitFormError(error);
        return {
          success: false,
          error
        };
      }

      // Emit processing event
      socketManager.emitFormProcessing('Forwarding form data to Next.js API...');

      // Submit to Next.js API
      const response: AxiosResponse = await axios.post(
        `${this.baseUrl}/fill-form`,
        formData,
        {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'MCP-Server/1.0.0'
          },
          timeout: 10000 // 10 second timeout
        }
      );

      // Emit success event
      socketManager.emitFormSubmitted(true, response.data);

      return {
        success: true,
        data: response.data
      };

    } catch (error: any) {
      const errorMessage = this.extractErrorMessage(error);
      socketManager.emitFormError(errorMessage);

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Extracts meaningful error message from axios error
   */
  private extractErrorMessage(error: any): string {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const message = error.response.data?.message || error.response.data?.error || 'Unknown server error';
      return `Next.js API error (${status}): ${message}`;
    } else if (error.request) {
      // Request was made but no response received
      return 'No response from Next.js API - please check if the server is running';
    } else {
      // Something else happened
      return `Request error: ${error.message}`;
    }
  }

  /**
   * Health check for the Next.js API
   */
  public async checkApiHealth(): Promise<{ healthy: boolean; message: string }> {
    try {
      const response = await axios.get(`${this.baseUrl}/health`, {
        timeout: 5000
      });

      return {
        healthy: true,
        message: 'Next.js API is healthy'
      };
    } catch (error: any) {
      return {
        healthy: false,
        message: this.extractErrorMessage(error)
      };
    }
  }
}

// Export singleton instance
export const formService = new FormService();
