import { QueryProperties } from "../generator/queryProperties"

export interface Connectable {
    //query(tableName: string, columnNames: string[], primaryKeyCol: string, entities: string[]): Promise<string[]>
    query(queryProps: QueryProperties): Promise<string[]>
    exit(): void
}