import { connect } from 'mongoose';
import config from '../config';

const connectDB = async () => {
    const { MONGO_URL } = config;

    await connect(MONGO_URL);
}

export default connectDB;