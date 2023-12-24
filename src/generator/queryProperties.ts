import { EntityProvider } from './entityProvider';
import { C } from '../common/c';
import { Column } from './schema/column';
import { Table } from './schema/table';

export class QueryProperties {

    columnNames: string[];
    columns: Column[];
    primaryKeyColumn: string;
    tableName: string;
    quantity: number;
    entities: Array<string[]>;
    queryType: string;

    public constructor(table: Table, entityProvider: EntityProvider, queryType: string = C.INSERT) {
        table.columns.forEach((col: Column) => {
            if (col.primary_key)
                    this.primaryKeyColumn = col.name;
            this.columns.push(col);
            this.columnNames.push(col.name);
        });
        this.tableName = table.name;
        this.quantity = entityProvider.getQuantity();
        this.entities = entityProvider.produceEntities()
        this.queryType = queryType;
    }
}