import { C } from "../common/c";

export const isDbProviderSupported = (dbProvider: string|null): boolean => {
    if (dbProvider) {
        return C.PROVIDERS.includes(dbProvider.toLowerCase())
    } else return false
}

export const isValidConnectionUri = (connectionUrl: string): boolean => {
    return /^(\w+):\/\/([^:@]+):([^@]+)@([^:@]+):(\d+)\/(.+)$/i.test(connectionUrl)
}

export const getConnectionProtocol = (connectionUrl: string): string|null => {
    if (!isValidConnectionUri(connectionUrl))
        return null
    return connectionUrl.split(':')[0];
}

export const getConnectionPort = (connectionUrl: string): number|null => {
    if (!isValidConnectionUri(connectionUrl))
        return null
    return parseInt(connectionUrl.split(':')[3])
}

export const isValidConnectionProtocol = (protocol: string|null): boolean => {
    if (protocol) {
        return isDbProviderSupported(protocol)
    } else return false
}

//Probably never going to use this as the port number can be changed during configuration
export const isValidConnectionPort = (protocol: string, port: number): boolean => {
    return (C.PORT_MAP.has(protocol) || C.PORT_MAP_1.has(protocol))
        && (C.PORT_MAP.get(protocol) === port || C.PORT_MAP_1.get(protocol) === port)
}