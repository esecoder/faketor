import {ColumnDataDesc} from "./columnDataDesc";

export class Column {
    name: string
    data: ColumnDataDesc
    primary_key: boolean
    nullable: boolean
    unique: boolean
    gen_type: string
}