import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Determine the status code
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Extract the raw error response
    const rawMessage =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    // Safely extract the exact message string (NestJS validation errors are usually objects)
    const finalMessage = 
      typeof rawMessage === 'object' && rawMessage !== null && 'message' in rawMessage
        ? (rawMessage as Record<string, unknown>).message
        : rawMessage;

    // Send the standardized error response
    response.status(status).json({
      success: false,
      statusCode: status,
      message: finalMessage,
      timestamp: new Date().toISOString(),
    });
  }
}
