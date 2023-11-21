import { NextFunction, Request, Response } from 'express';
import { Logger } from 'winston';

// TODO: improve error handling
const errorMiddleware = (logger: Logger) => {
    return (err: any, req: Request, res: Response, next: NextFunction) => {
        logger.error(err);
        res.status(500).json({ error: err.message });
    }
}

export default errorMiddleware;

