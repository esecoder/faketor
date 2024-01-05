import { Column } from "./schema/column";

/** This is the special data to be added to a table outside of the generated ones during insertion query. 
 * Column is the column for that data */

//Enforce it to only accept string[] or Map<string, string> types.
type StringArrayOrMap<T> = T extends string[] ? string[] : T extends Map<string, string> ? Map<string, string> : never;

export class CustomAugmenter<T extends string[] | Map<string, string>> {
    augmentationData: StringArrayOrMap<T>;
    column: Column;

    public constructor(augmentationData: StringArrayOrMap<T>, column: Column) {
        this.augmentationData = augmentationData;
        this.column = column;
    }

    getValue(): StringArrayOrMap<T> {
        return this.augmentationData;
    }

    setValue(value: StringArrayOrMap<T>): void {
        this.augmentationData = value;
    }

    //private value: StringArrayOrMap<T>;

    /*constructor(value: StringArrayOrMap<T>) {
        this.value = value;
    }*/
}