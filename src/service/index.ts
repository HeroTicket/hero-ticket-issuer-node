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

    constructor(_dataStorage: IDataStorage, _credentialWallet: ICredentialWallet, _identityWallet: IIdentityWallet, _rhsUrl: string, _walletKey: string) {
        this._dataStorage = _dataStorage;
        this._credentialWallet = _credentialWallet;
        this._identityWallet = _identityWallet;
        this._rhsUrl = _rhsUrl;
        this._walletKey = _walletKey;
    }

    public async createIdentity(): Promise<{ did: core.DID, credential: W3CCredential }> {
        const { did, credential } = await this._identityWallet.createIdentity({
            method: core.DidMethod.Iden3,
            blockchain: core.Blockchain.Polygon,
            networkId: core.NetworkId.Mumbai,
            revocationOpts: {
                type: CredentialStatusType.Iden3ReverseSparseMerkleTreeProof,
                id: this._walletKey,
            }
        });

        return { did, credential };
    }
}

export default Service;