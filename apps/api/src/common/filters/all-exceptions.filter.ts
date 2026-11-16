import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";

/**
 * Global error handler. Unlike the original Express handler, it NEVER
 * sends the stack trace to the client (that leaked file paths / code
 * structure). Stacks are logged server-side only.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger("Exception");

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string | string[] = "Internal Server Error";
    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      message =
        typeof res === "string"
          ? res
          : ((res as Record<string, unknown>).message as string | string[]) ??
            exception.message;
    } else if (exception instanceof Error) {
      // Log full detail server-side only.
      this.logger.error(exception.message, exception.stack);
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      path: request.originalUrl,
      method: request.method,
      timestamp: new Date().toISOString(),
    });
  }
}
