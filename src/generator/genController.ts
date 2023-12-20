import { QueryProperties } from './queryProperties';
import express from "express";
import {Connectable} from "../db-connector/connectable";
import {PgConnection} from "../db-connector/pgConnection";
import {ConnectionDataEntity} from "../db-connector/connectionDataEntity";
import {ConnectionFactory} from "../db-connector/connectionFactory";
import {Table} from "./schema/table";
import {Table2} from "./schema/table2";
import {Column} from "./schema/column";
import {ColumnDataDesc} from "./schema/columnDataDesc";
import {getAllDependencies, getForeignKeyTables, getTableDependents, isValidSchema, resolveRelationships, stringToColumnSchema, verifyColumnRules} from "./schema/schemaHelper";
import {produceEntities} from "./faker/fakerHelper";
import { C } from '../common/c';

export const generate = async (req: express.Request, res: express.Response) => {
    try {
        const { connection_data, connection_uri, db_provider, table_list, quantity } = req.body;

        if (!connection_data && !connection_uri) {
            res.status(401).send('Error. Connection data or connection string not supplied.');
        }

        if (!db_provider) {
            res.status(401).send('Error. Database provider not supplied.');
        }

        if (!table_list || !Array.isArray(table_list) || !isValidSchema(table_list)) {
            res.status(401).send('Error. Data schema not supplied or not valid. Make sure every table schema is supplied correctly. Please check https://faketor.com/doc/schema')
        }

        if (!quantity) {
            res.status(401).send('Error. Quantity not supplied.')
        }

        if (!isDbProviderSupported(db_provider)) {
            res.status(401)
                .send('Error. Database provider not supported. Check https://faketor.com/doc/supported-dbs ' +
                    'to see the database providers supported.')
        }

        if (quantity > 2000000000) {
            res.status(401).send('Error. Quantity not supported. Quantity must not exceed 2 billion.')
        }

        if (quantity < 1) {
            res.status(401).send('Error. Quantity not supported. Quantity must be greater then zero')
        }

        let connection: Connectable
        if (connection_uri) {
            if (!isValidConnectionUri(connection_uri)) {
                res.status(401).send('Error. Invalid database connection url.')
            }

            if (!isValidConnectionProtocol(getConnectionProtocol(connection_uri))) {
                res.status(401).send('Error. Invalid or unsupported database connection protocol.')
            }

            connection = ConnectionFactory.prototype.getConnection(connection_uri, db_provider)

        } else {
            const {host, database_name, username, password, port, dialect, ssl}: ConnectionDataEntity = req.body.connection_data
            if (!host)
                res.status(401).send('Error. Database host not supplied.')
            if (!database_name)
                res.status(401).send('Error. Database name not supplied.')
            if (!username)
                res.status(401).send('Error. Database username not supplied.')
            if (!password)
                res.status(401).send('Error. Database password not supplied.')
            if (!port)
                res.status(401).send('Error. Database port not supplied.')

            connection = ConnectionFactory.prototype.getConnection(req.body.connection_data, db_provider);
        }

        //schema is an array of objects. objects describing table, columns and column data

        const isolatedTables: Table[] = []; //tables that aren't dependent nor dependencies
        const independentTables: Table[] = []; //tables with no dependencies but have dependents
        const dependentTables: Table[] = []; //tables with dependencies

        const allDeps: string[] = getAllDependencies(table_list);

        table_list.forEach((table: Table|Table2, i: number, arri: (Table|Table2)[]) => {
            const columnNames: string[] = [];
            const columns: Column[] = [];
            let primaryKeyCol = '';

            table.columns.forEach((col: Column|string, j: number, arrj: (Column|string)[]) => {
                if (col instanceof Column) {
                    verifyColumnRules(col);

                    if (col.primary_key)
                        primaryKeyCol = col.name;

                    columns.push(col)
                    columnNames.push(col.name)
                } else if (typeof col === 'string') {
                    const column = stringToColumnSchema(col);

                    if (column.primary_key)
                        primaryKeyCol = column.name;

                    columns.push(column);
                    columnNames.push(column.name);

                    arrj[j] = column;
                }
            });

            //arri[i] = table //make sure it's all converted to Table-only array

            //sort tables
            //check for dependencies
            if (getForeignKeyTables(columns).length === 0) {
                //if non, check for dependents
                if(!allDeps.includes(table.name)) {
                    //isolated table
                    isolatedTables.push(table as Table);
                } else {
                    //idenpendent table
                    independentTables.push(table as Table);
                }
            } else {
                dependentTables.push(table as Table);
            }

            //resolve for one-to-one unidirectional


            const ids = connection.query(table.name, columnNames, primaryKeyCol, produceEntities(columns, quantity));
        });

        //populate isolated tables first
        isolatedTables.forEach((table: Table) => {
            const queryProps = new QueryProperties(table, quantity);
            connection.query(queryProps);
        });

        //populate independent tables
        independentTables.forEach((table: Table) => {
            /*const columnNames: string[] = [];
            const columns: Column[] = [];
            let primaryKeyCol = '';

            table.columns.forEach((col: Column) => {
                if (col.primary_key)
                        primaryKeyCol = col.name
                columns.push(col);
                columnNames.push(col.name);
            });*/

            const dependents: Table[] = getTableDependents(table.name, table_list);
            const relationships: Map<string, Map<string, string>> = resolveRelationships(table, dependents);

            //filter one-to-one
            const oneToOnes = dependents.filter((t: Table) => {
                return relationships.get(t.name).get(table.name) === 'one-to-one';
            });

            //filter one-to-many
            const oneToManys = dependents.filter((t: Table) => {
                return relationships.get(t.name).get(table.name) === 'one-to-many';
            });

            oneToOnes.forEach((table: Table) => {
                let queryProps = new QueryProperties(table, quantity);
                const indIds = connection.query(queryProps);
                queryProps = new QueryProperties() 
            });
        });
    } catch (e) {

    }
}

const isDbProviderSupported = (dbProvider: string|null): boolean => {
    if (dbProvider) {
        return C.PROVIDERS.includes(dbProvider.toLowerCase())
    } else return false
}

const isValidConnectionUri = (connectionUrl: string): boolean => {
    return /^(\w+):\/\/([^:@]+):([^@]+)@([^:@]+):(\d+)\/(.+)$/i.test(connectionUrl)
}

const getConnectionProtocol = (connectionUrl: string): string|null => {
    if (!isValidConnectionUri(connectionUrl))
        return null
    return connectionUrl.split(':')[0]
}

const getConnectionPort = (connectionUrl: string): number|null => {
    if (!isValidConnectionUri(connectionUrl))
        return null
    return parseInt(connectionUrl.split(':')[3])
}

const isValidConnectionProtocol = (protocol: string|null): boolean => {
    if (protocol) {
        return isDbProviderSupported(protocol)
    } else return false
}

//Probably never going use this as the port number can be changed during configuration
const isValidConnectionPort = (protocol: string, port: number): boolean => {
    return (C.PORT_MAP.has(protocol) || C.PORT_MAP_1.has(protocol))
        && (C.PORT_MAP.get(protocol) === port || C.PORT_MAP_1.get(protocol) === port)
}
