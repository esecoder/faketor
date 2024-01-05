import { QueryProperties } from '../generator/queryProperties';
import { Connectable } from "../db-connector/connectable";
import { ConnectionDataEntity } from "../db-connector/connectionDataEntity";
import { ConnectionFactory } from "../db-connector/connectionFactory";
import { Table } from "../generator/schema/table";
import { Table2 } from "../generator/schema/table2";
import { Column } from "../generator/schema/column";
import * as schemaHelper from "../generator/schema/schemaHelper";
import { C } from '../common/c';
import { FakerEntityProvider } from '../generator/faker/FakerEntityProvider';
import { CustomAugmenter } from '../generator/customAugmenter';
import { randomInt } from 'crypto';
import * as helper from '../generator/helper'
import fs from 'fs';
import ProgressBar from 'progress';

class TableList { tables: (Table|Table2)[] }

export const generate = async (connection_details: ConnectionDataEntity|string, db_provider: string, 
    tableList: TableList|string, quantity: number) => {

    try {
        //process.stdout.write('Generating table rows...');
        console.info('Generating table rows...');

        const bar = new ProgressBar('[:bar] :percent :etas', {
            complete: '▓',
            incomplete: '░',
            width: 30,
            total: 100
        });
        bar.tick();

        console.info('Validations started.');

        if (!connection_details) {
            console.error('Error. Connection data or connection string not supplied.');
            process.exit(1);
        }

        if (!db_provider) {
            console.error('Error. Database provider not supplied.');
            process.exit(1);
        }

        if (!tableList) {
            console.error('Error. Data schema not supplied or not valid. Make sure every table schema is supplied correctly. Please check https://faketor.com/doc/schema');
            process.exit(1);
        }

        let tables: (Table|Table2)[] = []

        if (typeof tableList === 'string') {
            //is a path to the schema file
            try {
                if (fs.existsSync(tableList) && fs.lstatSync(tableList).isFile()) {
                    const tl: TableList = JSON.parse(fs.readFileSync(tableList, 'utf8'));
                    if (!Array.isArray(tl.tables) || !schemaHelper.isValidSchema(tl.tables)) {
                        console.error('Error. Invalid table schema');
                        process.exit(1);
                    }
                    tables = tl.tables;
                } else {
                    console.error('Error. Invalid table list or schema.');
                    process.exit(1);
                }
            } catch (e) {
                console.error(`Error. Failed to read the table schema file: ${e.message}`);
                process.exit(1);
            }
        } else if (tableList instanceof TableList) {
            if (!Array.isArray(tableList.tables) || !schemaHelper.isValidSchema(tableList.tables)) {
                console.error('Error. Invalid table schema');
                process.exit(1);
            }
            tables = tableList.tables;
        } else {
            console.error('Error. Invalid table list or schema.');
            process.exit(1);
        }

        if (!quantity) {
            console.error('Error. Quantity not supplied.');
            process.exit(1);
        }

        if (!helper.isDbProviderSupported(db_provider)) {
            console.error('Error. Database provider not supported. Check https://faketor.com/doc/supported-dbs ' +
                    'to see the database providers supported.');
                    process.exit(1);
        }

        if (quantity > 2000000000) {
            console.error('Error. Quantity not supported. Quantity must not exceed 2 billion.');
            process.exit(1);
        }

        if (quantity < 1) {
            console.error('Error. Quantity not supported. Quantity must be greater then zero');
            process.exit(1);
        }

        let connection: Connectable
        if (typeof connection_details === 'string') {
            if (!helper.isValidConnectionUri(connection_details)) {
                console.error('Error. Invalid database connection url.');
                process.exit(1);
            }

            if (!helper.isValidConnectionProtocol(helper.getConnectionProtocol(connection_details))) {
                console.error('Error. Invalid or unsupported database connection protocol.');
                process.exit(1);
            }

            connection = ConnectionFactory.prototype.getConnection(connection_details, db_provider);

        } else if (connection_details instanceof ConnectionDataEntity) {
            const {host, database_name, username, password, port, dialect, ssl}: ConnectionDataEntity = connection_details;
            if (!host) {
                console.error('Error. Database host not supplied.');
                process.exit(1);
            }
            if (!database_name) {
                console.error('Error. Database name not supplied.');
                process.exit(1);
            }
            if (!username) {
                console.error('Error. Database username not supplied.');
                process.exit(1);
            }
            if (!password) {
                console.error('Error. Database password not supplied.');
                process.exit(1);
            }
            if (!port) {
                console.error('Error. Database port not supplied.');
                process.exit(1);
            }

            connection = ConnectionFactory.prototype.getConnection(connection_details, db_provider);
        } else {
            console.error('Error. Connection details not valid.');
            process.exit(1);
        }

        if (quantity > 5000) {
            console.warn('Warning. Quantity is large. Sit tight this my take a while.');
        }

        console.info('Validations completed.');

        //schema is an array of objects. objects describing table, columns and column data

        const isolatedTables: Table[] = []; //tables that aren't dependent nor dependencies
        const independentTables: Table[] = []; //tables with no dependencies but have dependents
        const dependentTables: Table[] = []; //tables with dependencies

        console.info('Mapping table relationships');

        const allDeps: string[] = schemaHelper.getAllDependencies(tables);

        //Iterate over tables from schema and convert Table2s to Tables and sort tables into isolated, independents and dependents.
        tables.forEach((table: Table|Table2) => {
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

            console.log('Sorting tables');
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

        console.info('Mapping done.');

        console.info('Populating database...');
        //populate isolated tables first
        saveIsolatedTables(isolatedTables, quantity, connection);

        //populate independent tables
        saveIndependentTables(tables, independentTables, quantity, connection);

        console.info('Populating done.');

        console.info('Completed successfully.');
        //TODO: show more info about the operation. Number of Rows generated and inserted. Etc.

        process.exit(0);
        
    } catch (e) {
        console.error(e);
        process.exit(1);
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