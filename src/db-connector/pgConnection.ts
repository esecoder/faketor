import {Connectable} from "./connectable";
import {ConnectionOption} from "./connectionOption";
import {ConnectionDataEntity} from "./connectionDataEntity";
import {Pool, PoolConfig} from "pg";
import process from "process";
import { QueryProperties } from "../generator/queryProperties";
import { C } from "../common/c";

export class PgConnection implements Connectable {

    private connectionClient: Pool

    constructor(connectionData: ConnectionDataEntity)

    constructor(connectionUri: string)

    constructor(connectionValue: string|object) { // Actual implementation
        if (typeof connectionValue === 'string') {
            try {
                let config: PoolConfig
                this.connectionClient = new Pool({ connectionString: connectionValue, ssl: true }) //await new Pool(config).connect();
                //TODO log
                console.log("Postgres DB connected.")
            } catch (e) {
                //TODO log
                //log(LogTypes.Error, [e.name, e.message, e.stack])
                //TODO send back Internal server error 500 code
                throw Error('Failed to connect to Postgres database. Please check your connection details.')
            }
        } else if (typeof connectionValue === 'object' && connectionValue instanceof ConnectionDataEntity) {
            try {
                this.connectionClient = new Pool({
                    user: connectionValue.username,
                    host: connectionValue.host,
                    database: connectionValue.database_name,
                    password: connectionValue.password,
                    port: connectionValue.port
                }) //await new Pool(config).connect();
                //TODO log
                console.log("Postgres DB connected.")
            } catch (e) {
                //TODO log
                //log(LogTypes.Error, [e.name, e.message, e.stack])
                //TODO send back Internal server error 500 code
                throw Error('Failed to connect to Postgres database. Please check your connection details.')
            }
        } else {
            throw new Error('Invalid constructor argument.');
        }
    }
    async exit(): Promise<void> {
        await this.connectionClient.end()
    }

    /*async query(tableName: string, columnNames: string[], primaryKeyColumn: string, entities: string[]): Promise<string[]> {
        if (!tableName || !columnNames || columnNames.length === 0 || !entities || entities.length === 0)
            throw Error('Invalid query arguments. Table name, column names or entities is either missing or empty.')

        if (!await this.isValidTableName(tableName)) {
            throw Error(`Invalid table name ${tableName}`)
        }
        if (! await this.isValidColumnNames(columnNames, tableName)) {
            throw Error(`An invalid column name for the table ${tableName}`)
        }

        try {
            await this.connectionClient.query('BEGIN')
            console.log('Transaction start...')
            //Perform the batch insert
            const columnStr = columnNames.join(', ')
            const len = columnNames.length

            const text = `INSERT INTO ${tableName} (${columnStr}) VALUES `

            const valuePlaceholders = entities.map((_, i) => {
                `($${columnNames.map((_, j) => `$${i * len + (j + 1)}`).join(', ')})`
            }).join(', ')

            console.log(valuePlaceholders)
            //`($${i * len + 1}, $${i * len + 2}, $${i * len + 3})`
            //`($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`

            const queryText = `${text}${valuePlaceholders} RETURNING ${primaryKeyColumn}`
            console.log(queryText)

            // `flat()` will flatten the array of arrays into a single array that can be used in the query
            this.connectionClient.query(queryText, entities.flat(), (err, res) => {
                if (err) {
                    console.error(err)
                    throw Error(err.message)
                }
                //TODO return the inserted rows to send to user. Manage very large entries
                console.log('Data inserted successfully')
            })
            const res = await this.connectionClient.query('COMMIT')
            console.log(res.rows)
            console.log('Transaction completed successfully')
            return res.rows.map(row => row.id)
            //TODO log this
        } catch (e) {
            await this.connectionClient.query('ROLLBACK')
            //TODO log this
            throw e
        }
    }*/

    async query(queryProps: QueryProperties): Promise<string[]> {
        if (queryProps.queryType === C.INSERT) {
            return await this.insert(queryProps);
        } else if (queryProps.queryType === C.UPDATE) {
            return await this.update(queryProps);
        } else {
            throw Error(`Invalid query type.`)
        }
    }

    async insert(queryProps: QueryProperties): Promise<string[]> {
        if (!queryProps.tableName || !queryProps.columnNames || queryProps.columnNames.length === 0 || !queryProps.entities || queryProps.entities.length === 0)
            throw Error('Invalid query arguments. Table name, column names or entities is either missing or empty.')

        if (!await this.isValidTableName(queryProps.tableName)) {
            throw Error(`Invalid table name ${queryProps.tableName}`)
        }
        if (! await this.isValidColumnNames(queryProps.columnNames, queryProps.tableName)) {
            throw Error(`An invalid column name for the table ${queryProps.tableName}`)
        }

        try {
            await this.connectionClient.query('BEGIN')
            console.log('Transaction start...')
            //Perform the batch insert
            const columnStr = queryProps.columnNames.join(', ')
            const len = queryProps.columnNames.length

            const prefix = `INSERT INTO ${queryProps.tableName} (${columnStr}) VALUES `

            const valuePlaceholders = queryProps.entities.map((_, i) => {
                `($${queryProps.columnNames.map((_, j) => `$${i * len + (j + 1)}`).join(', ')})`
            }).join(', ')

            console.log(valuePlaceholders)
            //`($${i * len + 1}, $${i * len + 2}, $${i * len + 3})`
            //`($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`

            const queryText = `${prefix}${valuePlaceholders} RETURNING ${queryProps.primaryKeyColumn}`
            console.log(queryText)

            // `flat()` will flatten the array of arrays into a single array that can be used in the query
            this.connectionClient.query(queryText, queryProps.entities.flat(), (err, res) => {
                if (err) {
                    console.error(err)
                    throw Error(err.message)
                }
                //TODO return the inserted rows to send to user. Manage very large entries
                console.log('Data inserted successfully')
            })
            const res = await this.connectionClient.query('COMMIT')
            console.log(res.rows)
            console.log('Transaction completed successfully')
            return res.rows.map(row => row.id)
            //TODO log this
        } catch (e) {
            await this.connectionClient.query('ROLLBACK')
            //TODO log this
            throw e
        }
    }

    async update(queryProps: QueryProperties): Prommise<string[]> {
        if (!queryProps.tableName || !queryProps.columnNames || queryProps.columnNames.length === 0 || !queryProps.entities || queryProps.entities.length === 0)
            throw Error('Invalid query arguments. Table name, column names or entities is either missing or empty.')

        if (!await this.isValidTableName(queryProps.tableName)) {
            throw Error(`Invalid table name ${queryProps.tableName}`)
        }
        if (! await this.isValidColumnNames(queryProps.columnNames, queryProps.tableName)) {
            throw Error(`An invalid column name for the table ${queryProps.tableName}`)
        }

        try {
            await this.connectionClient.query('BEGIN')
            console.log('Transaction start...')
            //Perform the batch insert
            const columnStr = queryProps.columnNames.join(', ')
            const len = queryProps.columnNames.length

            const prefix = `UPDATE ${queryProps.tableName} SET (${columnStr}) VALUES `

            const valuePlaceholders = queryProps.entities.map((_, i) => {
                `($${queryProps.columnNames.map((_, j) => `$${i * len + (j + 1)}`).join(', ')})`
            }).join(', ')

            console.log(valuePlaceholders)
            //`($${i * len + 1}, $${i * len + 2}, $${i * len + 3})`
            //`($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`

            const queryText = `${prefix}${valuePlaceholders} RETURNING ${queryProps.primaryKeyColumn}`
            console.log(queryText)

            // `flat()` will flatten the array of arrays into a single array that can be used in the query
            this.connectionClient.query(queryText, queryProps.entities.flat(), (err, res) => {
                if (err) {
                    console.error(err)
                    throw Error(err.message)
                }
                //TODO return the inserted rows to send to user. Manage very large entries
                console.log('Data inserted successfully')
            })
            const res = await this.connectionClient.query('COMMIT')
            console.log(res.rows)
            console.log('Transaction completed successfully')
            return res.rows.map(row => row.id)
            //TODO log this
        } catch (e) {
            await this.connectionClient.query('ROLLBACK')
            //TODO log this
            throw e
        }
    }

    private async isValidTableName(tableName: string): Promise<boolean> {
        if (!tableName)
            return false
        let validRegex = false
        if (!this.isQuotedIdentifier(tableName))
            validRegex = /^(?!_)[A-Za-z_][A-Za-z0-9_.]*$/g.test(tableName) && tableName.length <= 1000
                && await this.isReservedKeyword(tableName)
        else validRegex = tableName.length <= 1000

        try {
            const query
                = `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1`

            const result = await this.connectionClient.query(query, [tableName])
            return validRegex && result.rowCount !== 0
        } catch (e) {
            //TODO log this
            throw e
        }
    }

    private async isValidTableNames(tableNames: string[]): Promise<boolean> {
        if (!tableNames || tableNames.length === 0)
            return false

        const validRegexes: boolean[] = []
        tableNames.forEach(value => {
            if (!this.isQuotedIdentifier(value))
                validRegexes.push(/^(?!_)[A-Za-z_][A-Za-z0-9_.]*$/g.test(value) && value.length <= 1000)
            else validRegexes.push(value.length <= 1000)
        })

        if (validRegexes.includes(false)) {
            const invalidTabs: string[] = []
            validRegexes.forEach((value, index) => {
                if (!value)
                    invalidTabs.push(tableNames.at(index))
            })
            invalidTabs.join(', ')
            return false
        }

        const rkys = await this.reservedKeywords(tableNames)
        if (rkys.length !== 0) {
            return false
        }

        try {
            const query
                = `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = ANY($1::text[])`

            const result = await this.connectionClient.query(query, [tableNames])
            return result.rowCount !== 0
        } catch (e) {
            //TODO log this
            throw e
        }
    }

    private async isValidColumnName(columnName: string, tableName: string): Promise<boolean> {
        if (!columnName)
            return false
        let validRegex = false
        if (!this.isQuotedIdentifier(columnName))
            validRegex = /^(?!_)[A-Za-z_][A-Za-z0-9_.]*$/g.test(columnName) && columnName.length <= 1000
                && await this.isReservedKeyword(columnName)
        else validRegex = columnName.length <= 1000

        try {
            const query =
                `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2`;

            const result = await this.connectionClient.query(query, [tableName, columnName]);
            return validRegex && result.rowCount !== 0
        } catch (e) {
            //TODO log this
            throw e
        }
    }

    private async isValidColumnNames(columnNames: string[], tableName: string): Promise<boolean> {
        if (!columnNames || columnNames.length === 0)
            return false

        const validRegexes: boolean[] = []
        columnNames.forEach(value => {
            if (!this.isQuotedIdentifier(value))
                validRegexes.push(/^(?!_)[A-Za-z_][A-Za-z0-9_.]*$/g.test(value) && value.length <= 1000)
            else validRegexes.push(value.length <= 1000)
        })

        if (validRegexes.includes(false)) {
            const invalidCols: string[] = []
            validRegexes.forEach((value, index) => {
                if (!value)
                    invalidCols.push(columnNames.at(index))
            })

            invalidCols.join(', ')
            return false
        }

        const rkws = await this.reservedKeywords(columnNames)
        if (rkws.length !== 0) {
            return false
        }

        try {
            const query =
                `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 AND column_name = ANY($2::text[])`;

            const result = await this.connectionClient.query(query, [tableName, columnNames]);
            return result.rowCount !== 0

        } catch (e) {
            //TODO log this
            throw e
        }
    }

    private isQuotedIdentifier(tableName: string): boolean {
         return tableName.charAt(0) === '"' && tableName.charAt(tableName.length - 1) === '"'
    }

    private quotedIdentifiers(names: string[]): string[] {
        const qIds: string[] = []
        names.forEach(value => {
            if (this.isQuotedIdentifier(value))
                qIds.push(value)
        })
        return qIds
    }

    async isReservedKeyword(name: string): Promise<boolean> {
        if (!name || this.isQuotedIdentifier(name))
            return false

        try {
            const query
                = `SELECT word FROM pg_catalog.pg_get_keywords() WHERE word = $1 AND catcode = 'R'`;

            const result = await this.connectionClient.query(query, [name.toLowerCase()])
            return result.rowCount > 0
        } catch (e) {
            //TODO log this
            throw e
        }
    }

    async reservedKeywords(names: string[]): Promise<string[]> {
        if (!names || names.length === 0)
            return []
        const newNames = names
        const qIds = this.quotedIdentifiers(names)
        if (qIds.length > 0) {
            qIds.forEach((value, index) => {
                newNames.splice(index, 1)
            })
        }
        if (newNames.length === 0)
            return []

        try {
            const query
                = `SELECT word FROM pg_catalog.pg_get_keywords() WHERE word = ANY($1::text[]) AND catcode = 'R'`;

            const result = await this.connectionClient.query(query, [newNames])
            return result.rows
        } catch (e) {
            //TODO log this
            throw e
        }
    }
}