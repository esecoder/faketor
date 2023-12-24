import {Table} from "./table";
import {Table2} from "./table2";
import {Column} from "./column";
import {ColumnDataDesc} from "./columnDataDesc";
import {RelationshipMap} from "./relationshipMap";
import { C } from "../../common/c";

/** Validates a table schema */
export const isValidSchema = (tables: (Table|Table2)[]): boolean => {
    if (!Array.isArray(tables))
        return false;

    tables.forEach((table: Table|Table2) => {
        //if not of types DataSchema or DataSchema2
        if (table !instanceof Table && table !instanceof Table2) {
            return false;
        }

        //if not array
        if (!table.columns || !Array.isArray(table.columns)) {
            return false;
        }

        if (table.data_uniqueness !== C.TABLE_UNIQUE || table.data_uniqueness !== C.GLOBAL_UNIQUE) {
            return false;
        }

        table.columns.forEach((column: Column|string) => {
            //validate types
            if (column !instanceof Column && typeof column !== 'string') {
                return false;
            } else {

                if (typeof column === 'string') {
                    const colProps = column.split(' ');
                    //checks if the string version of schema is the right size
                    if (colProps.length > C.COLUMN_PROPS_COUNT_MAX || colProps.length < C.COLUMN_PROPS_COUNT_MIN
                        || (colProps.length === C.COLUMN_PROPS_COUNT_MIN && colProps[C.FOREIGN_KEY_IND] === C.FOREIGN_KEY)) {
                        return false;
                    }

                    if (colProps[C.FOREIGN_KEY_IND] === C.FOREIGN_KEY
                        && tables.find(item => item.name === colProps[C.EMBEDDED_TABLE_IND]) === undefined) {
                        return false;
                    }

                } else {
                    // @ts-ignore
                    if (!column.data || column.data !instanceof ColumnDataDesc) {
                        return false;
                    }
                    // @ts-ignore
                    if (column.data.foreign_key && tables.find(item => item.name === column.data.embedded_table) === undefined) {
                        return false;
                    }
                }
            }
        });
    });
    return true;
}

/** Gets all dependencies of every table schema */
export const getAllDependencies = (tables: (Table|Table2)[]): string[] => {
    if (!Array.isArray(tables))
        return [];

    if (!isValidSchema(tables))
        return [];

    const depTables: string[] = [];

    tables.forEach((table: Table|Table2) => {

        table.columns.forEach((column: Column|string) => {

            if (typeof column === 'string') {
                const colProps = column.split(' ');

                if (colProps[C.FOREIGN_KEY_IND] === C.FOREIGN_KEY) {
                    depTables.push(colProps[C.EMBEDDED_TABLE_IND]);
                }
            } else {
                if (column.data.foreign_key) {
                    depTables.push(column.data.embedded_table);
                }
            }
        });
    });
    return depTables;
}

/** Gets the dependencies of a particular table schema */
export const getTableDependencies = (table: Table|Table2): string[] => {
    if (table !instanceof Table && table !instanceof Table2) {
        return []
    }
    const depTables: string[] = [];
    table.columns.forEach((column: Column|string) => {

        if (typeof column === 'string') {
            const colProps = column.split(' ');

            if (colProps[C.FOREIGN_KEY_IND] === C.FOREIGN_KEY) {
                depTables.push(colProps[C.EMBEDDED_TABLE_IND]);
            }
        } else {
            if (column.data.foreign_key) {
                depTables.push(column.data.embedded_table);
            }
        }
    });
    return depTables;
}

/** Gets the dependents of a particular table */
export const getTableDependents = (tableName: string, tables: Table[]): Table[] => {
    if (!Array.isArray(tables))
        return [];

    if (!isValidSchema(tables))
        return [];

    const depTables: Table[] = []

    tables.forEach((table: Table) => {
        table.columns.forEach((column: Column) => {
            if (column.data.foreign_key && column.data.embedded_table === tableName) {
                depTables.push(table);
            }
        })
    })
    return depTables
}

/** Gets every bidirectional table relationships from all the tables supplied. */
export const getBidirectionalPairs = (tables: (Table|Table2)[]): Array<string[]> => {
    if (!Array.isArray(tables))
        return [];

    if (!isValidSchema(tables))
        return [];

    const biPairs: Array<string[]> = [];

    tables.forEach((table: Table|Table2) => {

        table.columns.forEach((column: Column|string) => {

            if (typeof column === 'string') {
                const colProps = column.split(' ');

                if (colProps[C.FOREIGN_KEY_IND] === C.FOREIGN_KEY) {
                    const res = tables.find(val => val.name === colProps[C.EMBEDDED_TABLE_IND]);
                    if (res) {   
                        if (getForeignKeyTables(res.columns).includes(table.name)) {
                            biPairs.push([table.name, colProps[C.EMBEDDED_TABLE_IND]]);
                        }
                    }
                }
            } else {
                if (column.data.foreign_key) {
                    const res = tables.find(val => val.name === column.data.embedded_table);
                    if (res) {
                        if (getForeignKeyTables(res.columns).includes(table.name)) {
                            biPairs.push([table.name, column.data.embedded_table]);
                        }
                    }
                }
            }
        });
    });
    return biPairs;
}

/*export const isBidirectionalPair = (tableName: string, tables: Table[]): boolean => {
    if (!Array.isArray(tables))
        return false;

    if (!isValidSchema(tables))
        return false;

    tables.forEach((table: Table, i: number) => {
        table.columns.forEach((column: Column, i1: number) => {
            if (column.data.foreign_key) {
                const res = tables.find(val => val.name === column.data.embedded_table);
                if (res) {
                    if (getForeignKeyTables(res.columns).includes(table.name)) {
                        return true;
                    }
                }
            }
        });
    });
    return false;
}*/

/** Resolved table relationships amongst all table */
export const resolveAllRelationships = (tables: (Table|Table2)[]): Map<string, Map<string, string>>|null => {
    if (!Array.isArray(tables))
        return null;

    if (!isValidSchema(tables))
        return null;

    const relTree: Map<string, Map<string, string>> = new Map<string, Map<string, string>>()

    tables.forEach((table: Table|Table2) => {

        const map: Map<string, string> = new Map()
        table.columns.forEach((column: Column|string) => {

            if (typeof column === 'string') {
                const colProps = column.split(' ');

                if (colProps[C.FOREIGN_KEY_IND] === C.FOREIGN_KEY) {
                    if (colProps[C.UNIQUE_IND] === C.UNIQUE) {
                        map.set(colProps[C.COL_NAME_IND], 'one-to-one');
                    } else {
                        if (table.is_join_table) {
                            map.set(colProps[C.COL_NAME_IND], 'many-to-many');
                        } else
                            map.set(colProps[C.COL_NAME_IND], 'one-to-many');
                    }
                }
            } else {
                if (column.data.foreign_key) {
                    if (column.unique) {
                        map.set(column.name, 'one-to-one');
                    } else {
                        if (table.is_join_table) {
                            map.set(column.name, 'many-to-many')
                        } else
                            map.set(column.name, 'one-to-many')
                    }
                }
            }
        });
        relTree.set(table.name, map)
    });
    return relTree;
}

export const resolveRelationships = (independentTable: Table, dependentTables: Table[]): Map<string, Map<string, string>> => {

    if (!Array.isArray(dependentTables))
        return null;

    if (!isValidSchema(dependentTables))
        return null;

    const relTree: Map<string, Map<string, string>> = new Map<string, Map<string, string>>()

    dependentTables.forEach((table: Table) => {

        const map: Map<string, string> = new Map()
        const filtered = table.columns.filter((column: Column) => {
            return column.data.foreign_key && column.data.embedded_table === independentTable.name
        });

        filtered.forEach((col: Column) => {
            if (col.data.foreign_key) {
                if (col.unique) {
                    map.set(col.name, 'one-to-one');
                } else {
                    //if (table.is_join_table) {
                        //map.set(col.name, 'many-to-many')
                    //} else
                        map.set(col.name, 'one-to-many')
                }
            }
        });
        relTree.set(table.name, map)
    });
    return relTree;
}

/** Returns the foreign keys of a particular table from its columns */
export const getForeignKeyTables = (columns: (Column|string)[]): string[] => {
    const forKeys: string[] = []

    columns.forEach((column: Column|string) => {

        if (typeof column === 'string') {
            const colProps = column.split(' ');

            if (colProps[C.FOREIGN_KEY_IND] === C.FOREIGN_KEY) {
                forKeys.push(colProps[C.EMBEDDED_TABLE_IND]);
            }
        } else {
            if (column.data.foreign_key) {
                forKeys.push(column.data.embedded_table);
            }
        }
    });
    return forKeys;
}

export const getRelationshipsMaps = (tables: (Table|Table2)[]): RelationshipMap[]|null => {
    return null
}

/**Converts a DataSchema2 object to a DataSchema object */
export const dataSchema2ToDataSchema = (table: Table2): Table => {
    const newTable: Table = new Table();
    const newTableCols: Column[] = [];

    table.columns.forEach((col: string) => {
        if (typeof col === 'string') {
            newTableCols.push(stringToColumnSchema(col));
        } else if (col instanceof Column) {
            newTableCols.push(col)
        }
    });
    newTable.name = table.name;
    newTable.is_join_table = table.is_join_table;
    newTable.columns = newTableCols;

    return newTable;
}

/**Converts a string column desc to a ColumnSchema object */
export const stringToColumnSchema = (strDesc: string): Column => {
    //convert string column data to column schema object
    const colProps = strDesc.split(' ')
    const column = new Column()
    const colDataDesc = new ColumnDataDesc()
    column.name = colProps[C.COL_NAME_IND]
    colDataDesc.type = colProps[C.COL_TYPE_IND]
    colDataDesc.desc = colProps[C.COL_DESC_IND]

    if (colProps[C.PRIMARY_KEY_IND] === C.PRIMARY_KEY && (colProps[C.FOREIGN_KEY_IND] === C.FOREIGN_KEY 
        || colProps[C.NULLABLE_IND] === C.NULL)) {
        throw Error(`Error. Table schema is invalid. Primary key can not be a foreign key or nullable. 
            Please check https://faketor.com/doc/schema \n${strDesc}`)
    }

    column.primary_key = colProps[C.PRIMARY_KEY_IND] === C.PRIMARY_KEY

    if (colProps[C.FOREIGN_KEY_IND] === C.FOREIGN_KEY) {
        colDataDesc.foreign_key = true
        colDataDesc.embedded_table = colProps[C.EMBEDDED_TABLE_IND]
        if (colProps[C.NULLABLE_IND] === C.NOT_NULL) {
            throw Error(`Error. Table schema is invalid. Foreign key must be nullable. 
                Please check https://faketor.com/doc/schema \n${strDesc}`)
        }
        column.nullable = colProps[C.NULLABLE_IND] === C.NULL
        column.unique = colProps[C.UNIQUE_IND] === C.UNIQUE
        column.gen_type = colProps[C.COL_GEN_TYPE_IND]
    } else if (colProps[C.FOREIGN_KEY_IND] === C.NOT_FOREIGN_KEY) {
        colDataDesc.foreign_key = false
        column.nullable = colProps[C.NULLABLE_IND_ALT] === C.NULL
        column.unique = colProps[C.UNIQUE_IND_ALT] === C.UNIQUE
        column.gen_type = colProps[C.COL_GEN_TYPE_IND_ALT]
    } else
        throw Error(`Error. Table schema is invalid. Foreign key not supplied. 
            Please check https://faketor.com/doc/schema \n${strDesc}`)

    column.data = colDataDesc;

    return column;
}

export const verifyColumnRules = (column: Column) => {
    if (column.data.foreign_key && !column.nullable) {
        throw Error(`Error. Table schema is invalid. Foreign key must be nullable. 
            Please check https://faketor.com/doc/schema \n${column.name}`)
    }
    if (column.primary_key && (column.nullable || column.data.foreign_key)) {
        throw Error(`Error. Table schema is invalid. Primary key cannot be nullable or foreign key. 
            Please check https://faketor.com/doc/schema \n${column.name}`)
    }
}