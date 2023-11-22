import {
    BjjProvider,
    CredentialStorage,
    CredentialWallet,
    defaultEthConnectionConfig,
    EthStateStorage,
    ICredentialWallet,
    IDataStorage,
    Identity,
    IdentityStorage,
    IdentityWallet,
    IIdentityWallet,
    KMS,
    KmsKeyType,
    Profile,
    W3CCredential,
    EthConnectionConfig,
    CredentialStatusType,
    CredentialStatusResolverRegistry,
    IssuerResolver,
    RHSResolver,
    OnChainResolver,
    AgentResolver,
    AbstractPrivateKeyStore,
    ICircuitStorage,
    FSCircuitStorage,
    ProofService,
    IStateStorage
} from '@0xpolygonid/js-sdk';
import { MongoDataSourceFactory, MerkleTreeMongodDBStorage } from '@0xpolygonid/mongo-storage';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, Db } from 'mongodb';
import config from '../config';
import Service from '../service';
import MongoPrivateKeyStore from '../store';

const initMongoDB = async (): Promise<Db> => {
    let url = config.MONGO_URL;
    if (!url) {
        const mongodb = await MongoMemoryServer.create();
        url = mongodb.getUri();
    }
    const client = new MongoClient(url);
    await client.connect();
    return client.db('hero-ticket-issuer');
}

const initMongoDataStorage = async (db: Db): Promise<IDataStorage> => {
    let conf: EthConnectionConfig = defaultEthConnectionConfig;
    conf.contractAddress = config.CONTRACT_ADDRESS;
    conf.url = config.RPC_URL;

    let dataStorage = {
        credential: new CredentialStorage(
            await MongoDataSourceFactory<W3CCredential>(db, 'credentials')
        ),
        identity: new IdentityStorage(
            await MongoDataSourceFactory<Identity>(db, 'identity'),
            await MongoDataSourceFactory<Profile>(db, 'profile')
        ),
        mt: await MerkleTreeMongodDBStorage.setup(db, 40),
        states: new EthStateStorage(defaultEthConnectionConfig)
    };

    return dataStorage as unknown as IDataStorage;
}

const initIdentityWallet = async (
    dataStorage: IDataStorage,
    credentialWallet: ICredentialWallet,
    keyStore: AbstractPrivateKeyStore
): Promise<IIdentityWallet> => {
    const bjjProvider = new BjjProvider(KmsKeyType.BabyJubJub, keyStore);
    const kms = new KMS();
    kms.registerKeyProvider(KmsKeyType.BabyJubJub, bjjProvider);

    return new IdentityWallet(kms, dataStorage, credentialWallet);
}

const initCredentialWallet = async (dataStorage: IDataStorage): Promise<CredentialWallet> => {
    const resolvers = new CredentialStatusResolverRegistry();
    resolvers.register(CredentialStatusType.SparseMerkleTreeProof, new IssuerResolver());
    resolvers.register(
        CredentialStatusType.Iden3ReverseSparseMerkleTreeProof,
        new RHSResolver(dataStorage.states)
    );
    resolvers.register(
        CredentialStatusType.Iden3OnchainSparseMerkleTreeProof2023,
        new OnChainResolver([defaultEthConnectionConfig])
    );
    resolvers.register(CredentialStatusType.Iden3commRevocationStatusV1, new AgentResolver());

    return new CredentialWallet(dataStorage, resolvers);
}

const initMongoDataStorageAndWallets = async (db: Db): Promise<{ dataStorage: IDataStorage, credentialWallet: CredentialWallet, identityWallet: IIdentityWallet }> => {
    const dataStorage = await initMongoDataStorage(db);
    const credentialWallet = await initCredentialWallet(dataStorage);
    const mongoKeyStore = new MongoPrivateKeyStore(db);


    const identityWallet = await initIdentityWallet(dataStorage, credentialWallet, mongoKeyStore);

    return {
        dataStorage,
        credentialWallet,
        identityWallet
    };
}

const initCircuitStorage = async (): Promise<ICircuitStorage> => {
    return new FSCircuitStorage({
        dirname: config.CIRCUITS_PATH,
    })
};

const initProofService = async (identityWallet: IIdentityWallet,
    credentialWallet: ICredentialWallet,
    stateStorage: IStateStorage,
    circuitStorage: ICircuitStorage): Promise<ProofService> => {
    return new ProofService(identityWallet, credentialWallet, circuitStorage, stateStorage, {
        ipfsGatewayURL: 'https://ipfs.io'
    });
};

const initService = async (): Promise<Service> => {
    const db = await initMongoDB();

    const { dataStorage, credentialWallet, identityWallet } = await initMongoDataStorageAndWallets(db);

    const circuitStorage = await initCircuitStorage();

    const proofService = await initProofService(identityWallet, credentialWallet, dataStorage.states, circuitStorage);

    const service = new Service(dataStorage, credentialWallet, identityWallet, circuitStorage, proofService, config.RHS_URL, config.WALLET_KEY);

    return await service.init();
}

export default initService;