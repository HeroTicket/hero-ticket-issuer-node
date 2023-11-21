import { Request, Response } from 'express';
import morgan, { } from 'morgan';
import { Logger } from 'winston';

const format = () => {
    return process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
};

// 로그 작성을 위한 Output stream옵션.
const newStream = (logger: Logger) => {
    return {
        write: (message: string) => {
            logger.info(message);
        }
    }
};

const skip = (_: Request, res: Response) => {
    if (process.env.NODE_ENV === 'production') {
        return res.statusCode < 400;
    }
    return false;
};

const loggerMiddleware = (logger: Logger) => morgan(format(), { stream: newStream(logger), skip });

export default loggerMiddleware;