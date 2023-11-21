import { Express } from 'express';
import init from './loaders';

const main = async () => {
    const app: Express = await init();

    const port = 3001;

    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
}

main();