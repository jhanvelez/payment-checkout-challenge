import type { ArgumentsHost } from '@nestjs/common';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AllExceptionsFilter } from './http-exception.filter';

function buildHost(url = '/products/123'): {
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
    const { host, json, status } = buildHost();

    filter.catch(new NotFoundException('Product not found'), host);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        message: 'Product not found',
        error: 'NotFoundException',
        path: '/products/123',
      }),
    );
  });

  it('maps a BadRequestException with array validation messages', () => {
    const { host, json, status } = buildHost();

    filter.catch(new BadRequestException(['name should not be empty']), host);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ message: ['name should not be empty'] }),
    );
  });

  it('maps an unknown thrown error to a 500 with a generic body', () => {
    const { host, json, status } = buildHost();

    filter.catch(new Error('boom'), host);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 500, message: 'boom', error: 'InternalServerError' }),
    );
  });
});
