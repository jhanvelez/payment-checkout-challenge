import type { ArgumentsHost } from '@nestjs/common';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AllExceptionsFilter } from './http-exception.filter';

function construirHost(url = '/products/123'): {
  host: ArgumentsHost;
  json: jest.Mock;
  status: jest.Mock;
} {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({
      getResponse: () => ({ status }),
      getRequest: () => ({ url, method: 'GET' }),
    }),
  } as unknown as ArgumentsHost;

  return { host, json, status };
}

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
  });

  it('maps a NotFoundException to a 404 body with its message', () => {
    const { host, json, status } = construirHost();

    filter.catch(new NotFoundException('Producto no encontrado'), host);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        message: 'Producto no encontrado',
        error: 'NotFoundException',
        path: '/products/123',
      }),
    );
  });

  it('maps a BadRequestException with array validation messages', () => {
    const { host, json, status } = construirHost();

    filter.catch(new BadRequestException(['el nombre no puede estar vacío']), host);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ message: ['el nombre no puede estar vacío'] }),
    );
  });

  it('maps an unknown thrown error to a 500 with a generic body', () => {
    const { host, json, status } = construirHost();

    filter.catch(new Error('fallo inesperado'), host);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        message: 'fallo inesperado',
        error: 'InternalServerError',
      }),
    );
  });
});
