import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();

        const isHttpException = exception instanceof HttpException;
        const status = isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
        const errorResponse = isHttpException ? exception.getResponse() : null;

        const message = this.resolveMessage(exception, errorResponse);
        const code = this.resolveCode(status, exception);

        response.status(status).json({
            success: false,
            status,
            error: {
                code,
                message,
                timestamp: new Date().toISOString(),
            },
        });
    }

    private resolveMessage(exception: unknown, errorResponse: unknown) {
        if (typeof errorResponse === 'string') {
            return errorResponse;
        }

        if (errorResponse && typeof errorResponse === 'object') {
            const response = errorResponse as Record<string, unknown>;
            const message = response.message;

            if (Array.isArray(message)) {
                return message.join(', ');
            }

            if (typeof message === 'string') {
                return message;
            }
        }

        if (exception instanceof Error && exception.message) {
            return exception.message;
        }

        return '서버 처리 중 오류가 발생했습니다.';
    }

    private resolveCode(status: number, exception: unknown) {
        if (exception instanceof HttpException) {
            const response = exception.getResponse();
            if (response && typeof response === 'object') {
                const code = (response as Record<string, unknown>).code;
                if (typeof code === 'string' && code.trim()) {
                    return code;
                }
            }
        }

        const statusCodeMap: Record<number, string> = {
            [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
            [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
            [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
            [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
            [HttpStatus.CONFLICT]: 'CONFLICT',
            [HttpStatus.UNPROCESSABLE_ENTITY]: 'UNPROCESSABLE_ENTITY',
            [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_SERVER_ERROR',
        };

        return statusCodeMap[status] || 'ERROR';
    }
}