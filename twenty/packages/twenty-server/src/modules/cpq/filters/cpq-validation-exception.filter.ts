import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

import { CpqValidationError } from 'src/modules/cpq/utils/cpq-validation.utils';

// Catches CpqValidationError and returns a 400 response with the error message.
// Applied to the CpqController via @UseFilters() decorator.
@Catch(CpqValidationError)
export class CpqValidationExceptionFilter implements ExceptionFilter {
  catch(exception: CpqValidationError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    response.status(HttpStatus.BAD_REQUEST).json({
      statusCode: 400,
      error: 'Bad Request',
      message: exception.message,
      source: 'cpq',
    });
  }
}
