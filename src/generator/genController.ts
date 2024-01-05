import { QueryProperties } from './queryProperties';
import express from "express";
import { Connectable } from "../db-connector/connectable";
import { ConnectionDataEntity } from "../db-connector/connectionDataEntity";
import { ConnectionFactory } from "../db-connector/connectionFactory";
import { Table } from "./schema/table";
import { Table2 } from "./schema/table2";
import { Column } from "./schema/column";
import * as schemaHelper from "./schema/schemaHelper";
import { C } from '../common/c';
import { FakerEntityProvider } from './faker/FakerEntityProvider';
import { CustomAugmenter } from './customAugmenter';
import { randomInt } from 'crypto';
import * as helper from './helper';

export const generate = async (req: express.Request, res: express.Response) => {
    try {
        const { connection_data, connection_uri, db_provider, table_list, quantity }: 
        { connection_data: ConnectionDataEntity, connection_uri: string, db_provider: string, 
            table_list: (Table|Table2)[], quantity: number } = req.body;

        if (!connection_data && !connection_uri) {
            res.status(401).send('Error. Connection data or connection string not supplied.');
        }

        if (!db_provider) {
            res.status(401).send('Error. Database provider not supplied.');
        }

        if (!table_list || !Array.isArray(table_list) || !schemaHelper.isValidSchema(table_list)) {
            res.status(401).send('Error. Data schema not supplied or not valid. Make sure every table schema is supplied correctly. Please check https://faketor.com/doc/schema')
        }

        if (!quantity) {
            res.status(401).send('Error. Quantity not supplied.')
        }

        if (!helper.isDbProviderSupported(db_provider)) {
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
            if (!helper.isValidConnectionUri(connection_uri)) {
                res.status(401).send('Error. Invalid database connection url.')
            }

            if (!helper.isValidConnectionProtocol(helper.getConnectionProtocol(connection_uri))) {
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

        const allDeps: string[] = schemaHelper.getAllDependencies(table_list);

        //Iterate over tables from schema and convert Table2s to Tables and sort tables into isolated, independents and dependents.
        table_list.forEach((table: Table|Table2, i: number, arri: (Table|Table2)[]) => {
            const columnNames: string[] = [];
            const columns: Column[] = [];
            let primaryKeyCol = '';

            table.columns.forEach((col: Column|string, j: number, arrj: (Column|string)[]) => {
                if (col instanceof Column) {
                    schemaHelper.verifyColumnRules(col);

                    if (col.primary_key)
                        primaryKeyCol = col.name;

                    columns.push(col)
                    columnNames.push(col.name)
                } else if (typeof col === 'string') {
                    const column = schemaHelper.stringToColumnSchema(col);

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
            if (schemaHelper.getForeignKeyTables(columns).length === 0) {
                //if non, check for dependents
                if(!allDeps.includes(table.name)) {
                    //isolated table
                    isolatedTables.push(table as Table);
                } else {
                    //independent table
                    independentTables.push(table as Table);
                }
            } else {
                dependentTables.push(table as Table);
            }
        });

        //populate isolated tables first
        saveIsolatedTables(isolatedTables, quantity, connection);

        //populate independent tables
        saveIndependentTables(table_list, independentTables, quantity, connection);

    } catch (e) {
        res.status(500).send(e.message);
        //TODO log error and notify adminator;
    }
}

/**
 * This function populates the isolated tables. Isolated tables are tables without dependencies and dependents.
 * @param isolatedTables Isolated tables to populate.
 * @param quantity Quantity of rows to generate.
 * @param connection Database connection.
 */
const saveIsolatedTables = async (isolatedTables: Table[], quantity: number, connection: Connectable) => {
    isolatedTables.forEach((table: Table) => {
        const queryProps = new QueryProperties(table, new FakerEntityProvider(table.columns, quantity));
        connection.query(queryProps);
    });
}

/**
 * This function populates the independent tables and their dependents. Independent tables are tables without dependencies but has dependents.
 * @param table_list List of tables in the schema.
 * @param independentTables Independent tables to populate.
 * @param quantity Quantity of rows to generate.
 * @param connection Database connection.
 */
const saveIndependentTables = async (table_list: Table[], independentTables: Table[], quantity: number, connection: Connectable) => {
    independentTables.forEach(async (indTable: Table) => {
        //get dependents and their relationship map
        const dependents: Table[] = schemaHelper.getTableDependents(indTable.name, table_list);
        const relationships: Map<string, Map<string, string>> = schemaHelper.resolveRelationships(indTable, dependents);

        //filter out one-to-ones
        const oneToOnes = dependents.filter((otoDepTable: Table) => {
            return relationships.get(otoDepTable.name).get(indTable.name) === 'one-to-one';
        });

        //filter out one-to-manys
        const oneToManys = dependents.filter((otmDepTable: Table) => {
            return relationships.get(otmDepTable.name).get(indTable.name) === 'one-to-many';
        });

        //insert query for independent table
        let indQueryProps;
        let indIds: string[];
        if (indTable.data_uniqueness === C.TABLE_UNIQUE) { //this will be repeated on more than one table
            indQueryProps = new QueryProperties(indTable,
                new FakerEntityProvider(indTable.columns, quantity));
            //returned ids from insert
            indIds = await connection.query(indQueryProps);
        }

        //iterate through one-to-ones
        oneToOnes.forEach(async (oto: Table) => {
            //if independent table data is globally unique, that means it's only available in this table throughout 
            // the database. No other table has a copy of it's reference.
            if (indTable.data_uniqueness === C.GLOBAL_UNIQUE) {
                //create new independents for each dependent
                const iQProps = new QueryProperties(indTable,
                    new FakerEntityProvider(indTable.columns, quantity));
                //returned ids from insert
                const iIds = await connection.query(iQProps);

                const augmentedColumn = oto.columns.find((c: Column) =>
                    c.data.foreign_key && c.data.embedded_table === indTable.name);
                const customAugmenter = new CustomAugmenter<string[]>(iIds, augmentedColumn);
                const fakerEntityProvider = new FakerEntityProvider(oto.columns, quantity, customAugmenter);
                const otoQueryProps = new QueryProperties(oto, fakerEntityProvider);
                    /*const otoIds = */connection.query(otoQueryProps);

            } else { //unique only in this table, the record can be found in other tables
                const augmentedColumn = oto.columns.find((c: Column) =>
                    c.data.foreign_key && c.data.embedded_table === indTable.name);
                const customAugmenter = new CustomAugmenter<string[]>(indIds, augmentedColumn);
                const fakerEntityProvider = new FakerEntityProvider(oto.columns, quantity, customAugmenter);
                const otoQueryProps = new QueryProperties(oto, fakerEntityProvider);
                    /*const otoIds = */connection.query(otoQueryProps);
            }
        });

        //iterate through one-to-manys
        oneToManys.forEach(async (otm: Table) => {
            const randMax = quantity < 5 ? quantity : 5; //random number max
            if (indTable.data_uniqueness === C.GLOBAL_UNIQUE) {
                //create new independents for each dependent
                const iQProps = new QueryProperties(indTable,
                    new FakerEntityProvider(indTable.columns, quantity));
                //returned ids from insert
                const iIds = await connection.query(iQProps);

                //random rows are selected to assign indepentable foreign key values that will be used in insertion or update query
                const augData = await getAugDataMap(iIds, randMax, quantity);
                const augmentedColumn = otm.columns.find((c: Column) =>
                    c.data.foreign_key && c.data.embedded_table === indTable.name);
                const customAugmenter = new CustomAugmenter<Map<string, string>>(augData, augmentedColumn);
                const fakerEntityProvider = new FakerEntityProvider(otm.columns, quantity, customAugmenter);
                const otmQueryProps = new QueryProperties(otm, fakerEntityProvider);
                connection.query(otmQueryProps);
            } else { //unique only in this table, the record can also be found in other tables


                //random rows are selected to assign indepentable foreign key values that will be used in insertion or update query
                const augData = await getAugDataMap(indIds, randMax, quantity);
                const augmentedColumn = otm.columns.find((c: Column) =>
                    c.data.foreign_key && c.data.embedded_table === indTable.name);
                const customAugmenter = new CustomAugmenter<Map<string, string>>(augData, augmentedColumn);
                const fakerEntityProvider = new FakerEntityProvider(otm.columns, quantity, customAugmenter);
                const otmQueryProps = new QueryProperties(otm, fakerEntityProvider);
                connection.query(otmQueryProps);
            }
        });
    });
}

/**This function selects a number of numbers from the range of rows that will be generated. The numbers selected will 
 * represent the rows whose selected column will be augmented with a pre-assigned value.
 * @param count is the number of rows to select.
 * @param min is the min of the range or the first row number.
 * @param max is the max of the range or the total number of rows.
 * @returns The numbers selected.
 */
const getRandomRows = (count: number, min: number, max: number): number[] => {
    const result = new Set<number>();

    while (result.size < count) {
        const randomNum = Math.floor(Math.random() * (max - min) + min);
        result.add(randomNum);
    }

    return Array.from(result);
}

/**
 * This function creates a map of foreign key values pre-assigments using ids supplied and randomly selected rows.
 * @param indIds Independent table ids for foreign key pre-assignments.
 * @param randMax Max of the random numbers to be generated. The number of rows to select.
 * @param quantity Quantity from which to select from. Matches the quantity of rows generated or to be generated.
 * @returns A Map of the pre-assignments.
 */
const getAugDataMap = async (indIds: string[], randMax: number, quantity: number): Promise<Map<string, string>> => {
    const augData = new Map<string, string>();
    const setCounter = new Set<number>();
    indIds.forEach((id: string) => {
        const r = randomInt(randMax);
        if (r !== 0) {
            let nums: number[] = [];
            while ((nums.length === 0 || nums.some(num => setCounter.has(num)))
                && setCounter.size !== quantity) {

                if ((quantity - setCounter.size) <= 5) {
                    nums = getRandomRows(1, 1, quantity);
                } else {
                    nums = getRandomRows(r, 1, quantity);
                }
            }
            nums.forEach((n: number) => {
                augData.set(`${n}`, id);
            });
        }
    });
    return augData;
}
