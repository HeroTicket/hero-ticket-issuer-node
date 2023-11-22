import {
    ICredentialWallet,
    IDataStorage,
    IIdentityWallet,
    W3CCredential,
    CredentialStatusType,
    core,
    CredentialRequest,
    ICircuitStorage,
    ProofService,
    EthStateStorage
} from '@0xpolygonid/js-sdk';
import { ethers } from 'ethers';

class Service {
    private _dataStorage: IDataStorage;
    private _credentialWallet: ICredentialWallet;
    private _identityWallet: IIdentityWallet;
    private _circuitStorage: ICircuitStorage;
    private _proofService: ProofService;
    private _rhsUrl: string;
    private _walletKey: string;

    private _issuerDID: core.DID | undefined;

    constructor(_dataStorage: IDataStorage, _credentialWallet: ICredentialWallet,
        _identityWallet: IIdentityWallet, _circuitStorage: ICircuitStorage,
        _proofService: ProofService, _rhsUrl: string, _walletKey: string) {
        this._dataStorage = _dataStorage;
        this._credentialWallet = _credentialWallet;
        this._identityWallet = _identityWallet;
        this._circuitStorage = _circuitStorage;
        this._proofService = _proofService;
        this._rhsUrl = _rhsUrl;
        this._walletKey = _walletKey;
    }

    public async init(): Promise<Service> {
        const identities = await this._dataStorage.identity.getAllIdentities();

        // check if the identity exists
        if (identities.length > 0) {
            this._issuerDID = core.DID.parse(identities[0].did);

            return this;
        }

        // create the identity
        const { did } = await this._createIdentity();

        this._issuerDID = did;

        return this;
    }

    private async _createIdentity(): Promise<{ did: core.DID, credential: W3CCredential }> {
        const { did, credential } = await this._identityWallet.createIdentity({
            method: core.DidMethod.Iden3,
            blockchain: core.Blockchain.Polygon,
            networkId: core.NetworkId.Mumbai,
            revocationOpts: {
                type: CredentialStatusType.Iden3ReverseSparseMerkleTreeProof,
                id: this._rhsUrl,
            }
        });

        return { did, credential };
    }

    public async createCredential(rawDID: string, credentialSchema: string, type: string, credentialSubject: any, expiration?: number, revocationOpts?: any): Promise<W3CCredential> {
        const userDID = core.DID.parse(rawDID);

        const credentialRequest = this.createCredentialRequest(userDID, credentialSchema, type, credentialSubject, expiration, revocationOpts);

        const credential = await this._identityWallet.issueCredential(this._issuerDID!, credentialRequest, {
            ipfsNodeURL: credentialSchema.startsWith('ipfs://') ? 'https://ipfs.io' : undefined,
        });

        await this._credentialWallet.save(credential);

        return credential;
    }

    public async getCredentials(): Promise<W3CCredential[]> {
        return await this._credentialWallet.list();
    }

    public async findCredentialById(id: string): Promise<W3CCredential | undefined> {
        return await this._credentialWallet.findById(id);
    }

    public async revokeCredential(id: string): Promise<number> {
        const credential = await this._credentialWallet.findById(id)
        if (!credential) {
            return 0;
        }

        const nonce = await this._identityWallet.revokeCredential(this._issuerDID!, credential);
        await this._credentialWallet.remove(id);

        return nonce;
    }

    public async transitState(credentials: W3CCredential[]): Promise<string> {
        const issuer = await this._dataStorage.identity.getIdentity(this._issuerDID!.string());
        if (!issuer) {
            throw new Error('Issuer not found');
        }

        const res = await this._identityWallet.addCredentialsToMerkleTree(credentials, this._issuerDID!);

        await this._identityWallet.publishStateToRHS(this._issuerDID!, this._rhsUrl);

        const ethSigner = new ethers.Wallet(this._walletKey, (this._dataStorage.states as EthStateStorage).provider);

        const txId = await this._proofService.transitState(this._issuerDID!, res.oldTreeState, issuer.isStateGenesis!, this._dataStorage.states, ethSigner);

        return txId;
    }

    createCredentialRequest(did: core.DID, credentialSchema: string, type: string, credentialSubject: any, expiration?: number, revocationOpts?: any): CredentialRequest {
        const credentialRequest: CredentialRequest = {
            credentialSchema: credentialSchema,
            type: type,
            credentialSubject: {
                ...credentialSubject,
                id: did.string(),
            },
            expiration: expiration || 0,
            revocationOpts: revocationOpts || {
                type: CredentialStatusType.Iden3ReverseSparseMerkleTreeProof,
                id: this._rhsUrl,
            }
        };
        return credentialRequest;
    }
}

export default Service;

