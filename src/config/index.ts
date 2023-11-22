import config from './config.json';

const env = process.env.NODE_ENV || 'development';
const devConfig = env === 'development' ? config.development : config.production;

export default {
    RHS_URL: devConfig.rhs_url,
    CONTRACT_ADDRESS: devConfig.contract_address,
    CIRCUITS_PATH: devConfig.circuits_path,
    RPC_URL: devConfig.rpc_url,
    WALLET_KEY: devConfig.wallet_key,
    MONGO_URL: devConfig.mongo_url,
};
