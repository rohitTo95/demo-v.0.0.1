import { Router, Request, Response } from 'express';
import { formService, FormData } from '../services/formService';
import { bookingService } from '../services/bookingService';
import { getSocketManager, BookingData } from '../utils/socketManager';

const router = Router();

/**
 * POST /tools/booking/fill
 * Accepts booking data and emits it to Next.js via Socket.IO
 */
router.post('/booking/fill', async (req: Request, res: Response): Promise<void> => {
  try {
    const bookingData: BookingData = req.body;

    // Validate required booking fields
    const requiredFields = ['customer_name', 'customer_email', 'customer_phone', 'check_in_date', 'check_out_date', 'guests'];
    const missingFields = requiredFields.filter(field => !bookingData[field as keyof BookingData]);

    if (missingFields.length > 0) {
      res.status(400).json({
        success: false,
        message: 'Missing required booking fields',
        missingFields
      });
      return;
    }

    // Log the incoming booking request
    console.log('Received booking fill request:', {
      customer_name: bookingData.customer_name,
      customer_email: bookingData.customer_email,
      check_in_date: bookingData.check_in_date,
      check_out_date: bookingData.check_out_date,
      guests: bookingData.guests,
      timestamp: new Date().toISOString()
    });

    // Emit booking fill event to tools namespace
    const socketManager = getSocketManager();
    socketManager.emitBookingFill(bookingData);

    res.status(200).json({
      success: true,
      message: 'Booking fill event sent successfully',
      data: bookingData
    });

  } catch (error: any) {
    console.error('Unexpected error in /tools/booking/fill:', error);
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'An unexpected error occurred while processing the booking fill request'
    });
  }
});

/**
 * POST /tools/fill-form
 * Accepts form data and forwards it to Next.js API
 */
router.post('/fill-form', async (req: Request, res: Response): Promise<void> => {
  try {
    const formData: FormData = req.body;

    // Log the incoming request
    console.log('Received form submission:', {
      name: formData.name,
      email: formData.email,
      messageLength: formData.message?.length || 0,
      timestamp: new Date().toISOString()
    });

    // Submit form using service
    const result = await formService.submitForm(formData);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Form submitted successfully',
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Form submission failed',
        error: result.error
      });
    }

  } catch (error: any) {
    console.error('Unexpected error in /tools/fill-form:', error);
    
    // Emit error to socket clients
    const socketManager = getSocketManager();
    socketManager.emitFormError(`Unexpected server error: ${error.message}`);

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'An unexpected error occurred while processing the form'
    });
  }
});

/**
 * GET /tools/form/health
 * Check health of the form submission service
 */
router.get('/form/health', async (req: Request, res: Response): Promise<void> => {
  try {
    const healthCheck = await formService.checkApiHealth();
    
    res.status(healthCheck.healthy ? 200 : 503).json({
      service: 'form-service',
      healthy: healthCheck.healthy,
      message: healthCheck.message,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Error checking form service health:', error);
    
    res.status(500).json({
      service: 'form-service',
      healthy: false,
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /tools/status
 * Get general tool status and statistics
 */
router.get('/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const socketManager = getSocketManager();
    const connectedClients = await socketManager.getConnectedClientsCount();

    res.status(200).json({
      status: 'operational',
      tools: {
        'fill-form': {
          available: true,
          description: 'Form submission tool for forwarding data to Next.js API'
        },
        'booking-fill': {
          available: true,
          description: 'Hotel booking auto-fill tool for MCP integration'
        }
      },
      namespaces: {
        'tools': {
          available: true,
          description: 'Socket.IO namespace for real-time booking events'
        }
      },
      statistics: {
        connectedClients,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Error getting tool status:', error);
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to get tool status',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /tools/socket/test
 * Test endpoint for socket events (development only)
 */
router.post('/socket/test', async (req: Request, res: Response): Promise<void> => {
  try {
    const { event, data } = req.body;
    const socketManager = getSocketManager();

    switch (event) {
      case 'booking:fill':
        socketManager.emitBookingFill(data);
        break;
      case 'form:received':
        socketManager.emitFormReceived(data);
        break;
      case 'form:processing':
        socketManager.emitFormProcessing(data.message);
        break;
      case 'form:submitted':
        socketManager.emitFormSubmitted(data.success, data.response);
        break;
      case 'form:error':
        socketManager.emitFormError(data.error);
        break;
      case 'tool:status':
        socketManager.emitToolStatus(data.tool, data.status, data.data);
        break;
      default:
        res.status(400).json({
          success: false,
          message: 'Invalid event type',
          availableEvents: ['booking:fill', 'form:received', 'form:processing', 'form:submitted', 'form:error', 'tool:status']
        });
        return;
    }

    res.status(200).json({
      success: true,
      message: `Socket event '${event}' emitted successfully`
    });

  } catch (error: any) {
    console.error('Error testing socket event:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to emit socket event',
      error: error.message
    });
  }
});

export default router;
