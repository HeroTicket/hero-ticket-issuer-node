import express, { Express, Request, Response } from 'express';

const main = async () => {
    const app: Express = express();

    const port = 3001;

    app.get('/', (req: Request, res: Response) => {
        res.send('Hello World!');
    });

    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
}

main();