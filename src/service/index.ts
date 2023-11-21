import {
    ICredentialWallet,
    IDataStorage,
    IIdentityWallet,
    W3CCredential,
    CredentialStatusType,
    core
} from '@0xpolygonid/js-sdk';

class Service {
    private _dataStorage: IDataStorage;
    private _credentialWallet: ICredentialWallet;
    private _identityWallet: IIdentityWallet;
    private _rhsUrl: string;
    private _walletKey: string;
    _adminDID: core.DID | undefined;

    constructor(_dataStorage: IDataStorage, _credentialWallet: ICredentialWallet, _identityWallet: IIdentityWallet, _rhsUrl: string, _walletKey: string) {
        this._dataStorage = _dataStorage;
        this._credentialWallet = _credentialWallet;
        this._identityWallet = _identityWallet;
        this._rhsUrl = _rhsUrl;
        this._walletKey = _walletKey;
    }

    public async init(): Promise<Service> {
        const identities = await this._dataStorage.identity.getAllIdentities();

        // check if the identity exists
        if (identities.length > 0) {
            this._adminDID = core.DID.parse(identities[0].did);
            return this;
        }

        // create the identity
        const { did } = await this._createIdentity();

        this._adminDID = did;

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
}

export default Service;