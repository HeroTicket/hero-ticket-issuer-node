import { AbstractPrivateKeyStore } from '@0xpolygonid/js-sdk';
import { Collection, Db } from 'mongodb';

class MongoPrivateKeyStore extends AbstractPrivateKeyStore {
    private _collection: Collection;
    private _data: Map<string, string> = new Map();

    constructor(db: Db) {
        super();
        this._collection = db.collection('private-keys');
    }
    async get(args: {
        alias: string;
    }): Promise<string> {
        const cached = this._data.get(args.alias);
        if (cached) {
            return cached;
        }

        const document = await this._collection.findOne({ alias: args.alias });
        if (!document) {
            throw new Error('no key under given alias');
        }

        return document.key;
    }
    async importKey(args: {
        alias: string;
        key: string;
    }): Promise<void> {
        await this._collection.insertOne({ alias: args.alias, key: args.key });
        this._data.set(args.alias, args.key);
    }
}

export default MongoPrivateKeyStore;