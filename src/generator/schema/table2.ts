
export class Table2 {
    name: string
    columns: Array<string>
    is_join_table: boolean
    data_uniqueness: string //table-unique/global-unique table-unique is when it is NOT ONLY found in this table 
    // and can be found in more than one table. global-unique is when it is ONLY found in this table and nowhere else
    //distribution: string
}

/*
{
    table_name: "users",
    columns: ["email text email_address primary-key/not-primary-key foreign-key/not-foreign-key sales global-unique not-null/null unique/not-unique custom/auto"],
    column_def: ["[column-name] [data-type] [data-desc] [primary-key] [foreign-key] [embedded-table] [fk_uniqueness] [nullable] [unique] [gen-type]"],
    join_table: false,
    data_uniqueness: "table-unique"
}
 */