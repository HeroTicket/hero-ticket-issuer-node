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
    InMemoryPrivateKeyStore,
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
    AbstractPrivateKeyStore
} from '@0xpolygonid/js-sdk';
import { MongoDataSourceFactory, MerkleTreeMongodDBStorage } from '@0xpolygonid/mongo-storage';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, Db } from 'mongodb';
import config from '../config';
import Service from '../service';

const initMongoDataStorage = async (): Promise<IDataStorage> => {
    let url = config.MONGO_URL;
    if (!url) {
        const mongodb = await MongoMemoryServer.create();
        url = mongodb.getUri();
    }
    const client = new MongoClient(url);
    await client.connect();
    const db: Db = client.db('mongodb-sdk-example');

    let conf: EthConnectionConfig = defaultEthConnectionConfig;
    conf.contractAddress = config.CONTRACT_ADDRESS;
    conf.url = config.CONTRACT_ADDRESS;

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

const initMongoDataStorageAndWallets = async (): Promise<{ dataStorage: IDataStorage, credentialWallet: CredentialWallet, identityWallet: IIdentityWallet }> => {
    const dataStorage = await initMongoDataStorage();
    const credentialWallet = await initCredentialWallet(dataStorage);
    const memoryKeyStore = new InMemoryPrivateKeyStore();

    const identityWallet = await initIdentityWallet(dataStorage, credentialWallet, memoryKeyStore);

    return {
        dataStorage,
        credentialWallet,
        identityWallet
    };
}

const initService = async (): Promise<Service> => {
    const { dataStorage, credentialWallet, identityWallet } = await initMongoDataStorageAndWallets();

    return new Service(dataStorage, credentialWallet, identityWallet, config.RHS_URL, config.WALLET_KEY);
}

export default initService;