import { NextFunction, Request, Response } from 'express';
import { Logger } from 'winston';
import HttpException from '../utils/error';

const errorMiddleware = (logger: Logger) => {
    return (err: HttpException, req: Request, res: Response, next: NextFunction) => {
        const status = err.status || 500;
        const message = err.message || 'Something went wrong';

        logger.error(`[${status}] ${message}`);
        res.status(status).json({ status, message });
    }
}

export default errorMiddleware;

