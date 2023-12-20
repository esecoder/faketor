export interface ConnectionOption {
    connectionUri?: string
    connectionData?: {
        host: string
        database_name: string
        username: string
        password: string
        port: number
        dialect: string
        ssl: boolean
    }
}