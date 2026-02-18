import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { AppError } from '../utils/app-error';

export function validationMiddleware<T>(type: any, skipMissingProperties = false): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
        validate(plainToInstance(type, req.body), { skipMissingProperties })
            .then((errors: ValidationError[]) => {
                if (errors.length > 0) {
                    const message = errors.map((error: ValidationError) => Object.values(error.constraints || {})).join(', ');
                    next(new AppError(message, 400));
                } else {
                    // Optional: replace req.body with the typed class instance
                    // req.body = plainToInstance(type, req.body); 
                    next();
                }
            });
    };
}
