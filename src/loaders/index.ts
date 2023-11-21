import express, { Express, NextFunction, Request, Response } from 'express';
import logger from './logger';
import initService from './service';
import cors from '../api/middlewares/cors';
import loggerMiddleware from '../api/middlewares/logger';
import Controller from '../api/routes';
import errorMiddleware from '../api/middlewares/error';
import HttpException from '../api/utils/error';

const init = async (): Promise<Express> => {
    const app: Express = express();

    const service = await initService();

    app.use(loggerMiddleware(logger));

    app.use(cors);
    app.use(express.json());

    app.use('/credentials', new Controller(logger, service).routes());

    app.use(errorMiddleware(logger));

    return app;
}

export default init;