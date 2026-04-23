import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Request, Response } from 'express';
import { STATUS_CODES } from 'http';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>(); // Express의 Response 객체
        const request = ctx.getRequest<Request>();    // Express의 Request 객체
        const status = exception.getStatus();
        const errorResponse = exception.getResponse(); // 에러 발생 시 던진 메시지나 객체

        // 최종적으로 클라이언트에게 반환할 커스텀 JSON 구조
        response.status(status).json({
            success: false,
            status: status,
            error: {
                code: STATUS_CODES[status],
                message: typeof errorResponse === 'string' ? errorResponse : (errorResponse as any).message,
                timestamp: new Date().toISOString(),
            }
        });
    }
}