import {ConnectionDataEntity} from "./connectionDataEntity";
import {PROVIDERS} from "../common/c";
import {PgConnection} from "./pgConnection";
import {Connectable} from "./connectable";

export class ConnectionFactory {

    getConnection(connectionUri: string, provider: string): Connectable;

    getConnection(connectionData: ConnectionDataEntity, provider: string): Connectable;

    getConnection(connectionValue: any, provider: string): Connectable {
        if (typeof connectionValue === 'string') {
            switch (provider) {
                case PROVIDERS[0]: {
                    return new PgConnection(connectionValue)
                }
            }
        } else if (typeof connectionValue === 'object' && connectionValue instanceof ConnectionDataEntity) {
            switch (provider) {
                case PROVIDERS[0]: {
                    return new PgConnection(connectionValue)
                }
            }
        } else {
            throw new Error('Invalid constructor argument.');
        }
    }
}