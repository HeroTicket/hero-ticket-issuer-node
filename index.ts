import express, { Express, Request, Response } from 'express';
import initService from './src/loaders/service';

const main = async () => {
    const app: Express = express();

    const service = await initService();

    console.log(service);

    const port = 3001;

    app.get('/', (req: Request, res: Response) => {
        res.send('Hello World!');
    });

    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
}

main();