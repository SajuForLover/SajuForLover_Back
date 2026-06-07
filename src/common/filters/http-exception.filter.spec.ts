import { ArgumentsHost, BadRequestException, HttpStatus, InternalServerErrorException, Logger } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  const errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);

  afterEach(() => {
    errorSpy.mockClear();
    warnSpy.mockClear();
  });

  it('should include reason in 400 response body', () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const response = { status };
    const host = {
      switchToHttp: () => ({
        getResponse: () => response,
      }),
    } as unknown as ArgumentsHost;

    const filter = new HttpExceptionFilter();
    const exception = new BadRequestException('유효하지 않은 여행 예산입니다.');

    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        status: HttpStatus.BAD_REQUEST,
        error: expect.objectContaining({
          code: 'BAD_REQUEST',
          message: '유효하지 않은 여행 예산입니다.',
          reason: '유효하지 않은 여행 예산입니다.',
        }),
      }),
    );
  });

  it('should log 500 errors to the backend console', () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const response = { status };
    const host = {
      switchToHttp: () => ({
        getRequest: () => ({ method: 'POST', url: '/api/travel/create' }),
        getResponse: () => response,
      }),
    } as unknown as ArgumentsHost;

    const filter = new HttpExceptionFilter();
    const exception = new InternalServerErrorException('DB 연결 실패');

    filter.catch(exception, host);

    expect(errorSpy).toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
  });
});