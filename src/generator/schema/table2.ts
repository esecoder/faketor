
export class Table2 {
    name: string
    columns: Array<string>
    is_join_table: boolean
    data_uniqueness: string //table-unique/global-unique table-unique is when this table's data it is NOT ONLY found in one table 
    // and can be found in more than one table. global-unique is when it is ONLY found in one table and nowhere else
    //distribution: string
}

/*
{
    table_name: "users",
    columns: ["email text internet.email primary-key/not-primary-key foreign-key/not-foreign-key sales not-null/null unique/not-unique custom/auto"],
    column_def: ["[column-name] [data-type] [data-desc] [primary-key] [foreign-key] [embedded-table] [nullable] [unique] [gen-type]"],
    join_table: false,
    data_uniqueness: "table-unique"
}
 */