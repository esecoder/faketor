import { C } from '../common/c';
import { produceEntities } from './faker/fakerHelper';
import { Column } from './schema/column';
import { Table } from './schema/table';

export class QueryProperties {

    columnNames: string[];
    columns: Column[];
    primaryKeyColumn: string;
    tableName: string;
    quantity: number;
    entities: string[];
    queryType: string;

    public constructor(table: Table, quantity: number, queryType: string = C.INSERT) {
        table.columns.forEach((col: Column) => {
            if (col.primary_key)
                    this.primaryKeyColumn = col.name
            this.columns.push(col);
            this.columnNames.push(col.name);
        });
        this.tableName = table.name
        this.quantity = quantity
        this.entities = produceEntities(this.columns, quantity)
        this.queryType = queryType;
    }
}