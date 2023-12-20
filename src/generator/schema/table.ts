import {Column} from "./column";

export class Table {
    name: string
    columns: Array<Column>
    is_join_table: boolean
}

/*
{
    table_name: "users",
    columns: [{
        column_name: "email",
        data: {
            type: "text", //sql data types for the provider
            desc: "email_address", //phone_number, person's name, random_value etc from faker/faketor support
            foreign_key: true, //false
            embedded_table: "[table name defined in the schema array]"
        },
        primary_key: false, //true. must not be nullable or foreign key if data is primary key
        nullable: false, //true. must be nullable if data is foreign key
        unique: true, //true. if unique, relationship might will be one-to-one else one-to-many. For many-to-many relationship, we look for a join table which will contain both rows together
        gen_type: "auto" //custom. must be custom if desc is provided
   }],
   join_table: false
}
 */