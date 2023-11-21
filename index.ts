import express, { Express, Request, Response } from 'express';
import initService from './src/loaders/service';

const main = async () => {
    const app: Express = express();

    app.use(express.json());

    const service = await initService();

    const port = 3001;

    app.get('/', (req: Request, res: Response) => {
        res.send('Hello World!');
    });

    app.post('/create-credential', async (req: Request, res: Response) => {
        const { did } = req.body;

        const credential = await service.createCredential(did);

        res.status(200).json(credential);
    });

    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
}

main();