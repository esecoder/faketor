
export class Table2 {
    name: string
    columns: Array<string>
    is_join_table: boolean
}

/*
{
    table_name: "users",
    columns: ["email text email_address primary-key/not-primary-key foreign-key/not-foreign-key sales not-null/null unique/not-unique custom/auto"],
    column_def: ["[column-name] [data-type] [data-desc] [primary-key] [foreign-key] [embedded-table] [nullable] [unique] [gen-type]"],
    join_table: false
}
 */