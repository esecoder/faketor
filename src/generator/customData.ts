import { Column } from "./schema/column";

/** This is the special data to be added to a table outside of the generated ones during insertion query. 
 * Column is the column for that data */

//Enforce it to only accept string[] or Map<string, string> types.
type StringArrayOrMap<T> = T extends string[] ? string[] : T extends Map<string, string> ? Map<string, string> : never;

export class CustomData<T extends string[] | Map<string, string>> {
    customData: StringArrayOrMap<T>;
    column: Column;

    public constructor(customData: StringArrayOrMap<T>, column: Column) {
        this.customData = customData;
        this.column = column;
    }

    getValue(): StringArrayOrMap<T> {
        return this.customData;
    }

    setValue(value: StringArrayOrMap<T>): void {
        this.customData = value;
    }
}