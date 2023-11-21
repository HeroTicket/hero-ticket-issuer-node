import express, { Express, Request, Response } from 'express';
import logger from './logger';
import initService from './service';

interface CreateCredentialRequest {
    did: string;
    credentialSchema: string;
    type: string;
    credentialSubject: any;
    expiration?: number;
    revocationOpts?: any;
}

const init = async (): Promise<Express> => {
    const app: Express = express();

    app.use(express.json());

    const service = await initService();

    app.get('/', (_: Request, res: Response) => {
        res.send('Hello World!');
    });

    app.get('/credential/:id', async (req: Request, res: Response) => {
        const id = req.params.id;

        const credential = await service.findCredentialById(id);

        if (credential) {
            res.status(200).json(credential);
        } else {
            res.status(404).json({ "error": "Credential not found" });
        }
    });

    app.post('/create-credential', async (req: Request, res: Response) => {
        const body = req.body as CreateCredentialRequest;

        const { did, credentialSchema, type, credentialSubject, expiration, revocationOpts } = body;

        const credential = await service.createCredential(did, credentialSchema, type, credentialSubject, expiration, revocationOpts);

        if (!credential) {
            return res.status(500).json({ "error": "Error creating credential" });
        }

        res.status(200).json({ "id": credential.id });
    });

    return app;
}

export default init;