import { Column } from "./schema/column";

/** This is the special data to be added to a table outside of the generated ones during insertion query. 
 * Column is the column for that data */
export class CustomAugmenter {
    augmentationData: string[];
    column: Column;

    public constructor(augmentationData: string[], column: Column) {
        this.augmentationData = augmentationData;
        this.column = column;
    }
}