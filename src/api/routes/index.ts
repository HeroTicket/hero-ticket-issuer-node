import { NextFunction, Request, Response, Router } from 'express';
import { Logger } from 'winston';
import Service from '../../service';
import HttpException from '../utils/error';

interface CreateCredentialRequest {
    did: string;
    credentialSchema: string;
    type: string;
    credentialSubject: any;
    expiration?: number;
    revocationOpts?: any;
}

class Controller {
    private _logger: Logger;
    private _service: Service;

    constructor(logger: Logger, service: Service) {
        this._logger = logger;
        this._service = service;
    }

    public routes(): Router {
        const router = Router();

        router.get('/:id', this.getCredentialById.bind(this));
        router.post('/', this.createCredential.bind(this));
        router.delete('/:id', this.revokeCredential.bind(this));
        //router.post('/transit', this.transitState.bind(this));

        return router;
    }

    private async getCredentialById(req: Request, res: Response, next: NextFunction) {
        const id = req.params.id;

        try {
            const credential = await this._service.findCredentialById(id);

            if (credential) {
                res.status(200).json(credential);
            } else {
                res.status(404).json({ "error": "Credential not found" });
            }
        } catch (error) {
            this._logger.error(error);
            next(new HttpException(500, "Error retrieving credential"));
        }
    }

    private async createCredential(req: Request, res: Response, next: NextFunction) {
        const body = req.body as CreateCredentialRequest;

        try {
            const { did, credentialSchema, type, credentialSubject, expiration, revocationOpts } = body;

            const credential = await this._service.createCredential(did, credentialSchema, type, credentialSubject, expiration, revocationOpts);

            if (!credential) {
                return res.status(500).json({ "error": "Error creating credential" });
            }

            /*
            this._service.transitState([credential]).then((txId) => {
                this._logger.info(`Credential ${credential.id} transit state txId: ${txId}`);
            }).catch((err) => {
                this._logger.error(err);
            });
            */

            res.status(201).json(credential);
        } catch (error) {
            this._logger.error(error);
            next(new HttpException(500, "Error creating credential"));
        }
    }

    private async revokeCredential(req: Request, res: Response, next: NextFunction) {
        const id = req.params.id;

        try {
            const nonce = await this._service.revokeCredential(id);

            if (nonce === 0) {
                return res.status(404).json({ "error": "Credential not found" });
            }

            res.status(200).json({ "nonce": nonce });
        } catch (error) {
            this._logger.error(error);
            next(new HttpException(500, "Error revoking credential"));
        }
    }

    /*
    private async transitState(req: Request, res: Response, next: NextFunction) {
        try {
            const credentials = await this._service.getCredentials();

            console.log(credentials);

            const txId = await this._service.transitState(credentials.slice(1));



            res.status(200).json({ "txId": txId });
        } catch (error) {
            this._logger.error(error);
            next(new HttpException(500, "Error transiting state"));
        }
    }
    */
}

export default Controller;