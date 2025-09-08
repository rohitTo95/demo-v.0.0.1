import axios, { AxiosResponse } from 'axios';
import config from '../config';
import { getSocketManager, BookingData, CompletedBookingData } from '../utils/socketManager';

export interface BookingValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface BookingServiceResult {
  success: boolean;
  data?: any;
  error?: string;
}

export class BookingService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.nextApiUrl;
  }

  /**
   * Validates booking data before processing
   */
  public validateBookingData(data: any): BookingValidationResult {
    const errors: string[] = [];

    // Required fields validation
    if (!data.customer_name || typeof data.customer_name !== 'string' || data.customer_name.trim().length === 0) {
      errors.push('Customer name is required and must be a non-empty string');
    }

    if (!data.customer_email || typeof data.customer_email !== 'string') {
      errors.push('Customer email is required and must be a string');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.customer_email)) {
        errors.push('Customer email must be a valid email address');
      }
    }

    if (!data.customer_phone || typeof data.customer_phone !== 'string' || data.customer_phone.trim().length === 0) {
      errors.push('Customer phone is required and must be a non-empty string');
    }

    if (!data.check_in_date || typeof data.check_in_date !== 'string') {
      errors.push('Check-in date is required and must be a string');
    } else {
      const checkInDate = new Date(data.check_in_date);
      if (isNaN(checkInDate.getTime())) {
        errors.push('Check-in date must be a valid date');
      }
    }

    if (!data.check_out_date || typeof data.check_out_date !== 'string') {
      errors.push('Check-out date is required and must be a string');
    } else {
      const checkOutDate = new Date(data.check_out_date);
      if (isNaN(checkOutDate.getTime())) {
        errors.push('Check-out date must be a valid date');
      }
      
      // Check if check-out is after check-in
      if (data.check_in_date && !isNaN(new Date(data.check_in_date).getTime())) {
        const checkInDate = new Date(data.check_in_date);
        if (checkOutDate <= checkInDate) {
          errors.push('Check-out date must be after check-in date');
        }
      }
    }

    if (!data.guests || typeof data.guests !== 'number' || data.guests < 1) {
      errors.push('Number of guests is required and must be a positive number');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Sends booking data to Next.js API for processing
   */
  public async forwardBookingToNextJs(bookingData: BookingData): Promise<BookingServiceResult> {
    try {
      const socketManager = getSocketManager();
      
      // Emit booking received event
      socketManager.broadcast('tool:status', {
        tool: 'booking-service',
        status: 'processing',
        data: { action: 'forwarding-to-nextjs', timestamp: new Date().toISOString() }
      });

      const response: AxiosResponse = await axios.post(
        `${this.baseUrl}/booking/create`,
        bookingData,
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'MCP-Server/1.0.0'
          }
        }
      );

      // Emit success event
      socketManager.broadcast('tool:status', {
        tool: 'booking-service',
        status: 'success',
        data: { 
          action: 'booking-forwarded',
          response: response.data,
          timestamp: new Date().toISOString()
        }
      });

      return {
        success: true,
        data: response.data
      };

    } catch (error: any) {
      const socketManager = getSocketManager();
      
      // Emit error event
      socketManager.broadcast('tool:status', {
        tool: 'booking-service',
        status: 'error',
        data: { 
          action: 'booking-forward-failed',
          error: error.message,
          timestamp: new Date().toISOString()
        }
      });

      console.error('Error forwarding booking to Next.js:', {
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: `${this.baseUrl}/booking/create`
      });

      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to forward booking'
      };
    }
  }

  /**
   * Check if Next.js booking API is healthy
   */
  public async checkBookingApiHealth(): Promise<{ healthy: boolean; message: string }> {
    try {
      const response: AxiosResponse = await axios.get(
        `${this.baseUrl}/booking/health`,
        { timeout: 5000 }
      );

      return {
        healthy: response.status === 200,
        message: response.data?.message || 'Booking API is healthy'
      };

    } catch (error: any) {
      console.error('Booking API health check failed:', error.message);
      
      return {
        healthy: false,
        message: error.response?.data?.message || error.message || 'Booking API health check failed'
      };
    }
  }

  /**
   * Generate sample booking data for testing
   */
  public generateSampleBookingData(): BookingData {
    const checkInDate = new Date();
    checkInDate.setDate(checkInDate.getDate() + 7); // 7 days from now
    
    const checkOutDate = new Date(checkInDate);
    checkOutDate.setDate(checkOutDate.getDate() + 2); // 2 nights stay

    return {
      room_id: `ROOM${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      customer_name: 'John Doe',
      customer_email: 'john.doe@example.com',
      customer_phone: '+1-555-0123',
      check_in_date: checkInDate.toISOString().split('T')[0],
      check_out_date: checkOutDate.toISOString().split('T')[0],
      guests: Math.floor(Math.random() * 4) + 1,
      special_requests: 'Please provide a room with a view.'
    };
  }

  /**
   * Send booking fill event via Socket.IO
   */
  public async sendBookingFillEvent(bookingData: BookingData): Promise<BookingServiceResult> {
    try {
      const validation = this.validateBookingData(bookingData);
      
      if (!validation.isValid) {
        return {
          success: false,
          error: `Validation failed: ${validation.errors.join(', ')}`
        };
      }

      const socketManager = getSocketManager();
      socketManager.emitBookingFill(bookingData);

      return {
        success: true,
        data: { message: 'Booking fill event sent successfully', booking: bookingData }
      };

    } catch (error: any) {
      console.error('Error sending booking fill event:', error);
      
      return {
        success: false,
        error: error.message || 'Failed to send booking fill event'
      };
    }
  }
}

// Export singleton instance
export const bookingService = new BookingService();