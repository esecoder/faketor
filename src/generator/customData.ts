import { Column } from "./schema/column";

/** This is the special data to be added to a table outside of the generated ones during insertion query. 
 * Column is the column for that data */
export class CustomData {
    customData: string[];
    column: Column;

    public constructor(customData: string[], column: Column) {
        this.customData = customData;
        this.column = column;
    }
}