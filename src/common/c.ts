
export class C {

    static PROVIDERS = ['postgres', 'mysql', 'sqlite', 'mssql', 'oracledb', 'redis', 'mariadb',
        'db2', 'mongodb', 'couchdb', 'couchbase', 'h2', 'sqlserver']

    static PORT_MAP: Map<string, number> = new Map([
        ['postgres', 5432],
        ['mysql', 3306],
        ['mssql', 1433],
        ['sqlserver', 1433],
        ['oracledb', 1521],
        ['redis', 6379],
        ['mariadb', 3306],
        ['db2', 50000],
        ['mongodb', 27017],
        ['couchdb', 5984],
        ['couchbase', 8091],
        ['h2', 9092]
    ])
    static PORT_MAP_1: Map<string, number> = new Map([
        ['couchbase', 11210]
    ])

    static FOREIGN_KEY: string = 'foreign-key'
    static NOT_FOREIGN_KEY: string = 'not-foreign-key'

    static PRIMARY_KEY: string = 'primary-key'

    static NOT_PRIMARY_KEY: string = 'not-primary-key'

    static UNIQUE: string = 'unique'

    static NOT_UNIQUE: string = 'not-unique'

    static COLUMN_PROPS_COUNT_MAX = 9

    static COLUMN_PROPS_COUNT_MIN = 8

    static COL_NAME_IND = 0

    static COL_TYPE_IND = 1

    static COL_DESC_IND = 2

    static PRIMARY_KEY_IND = 3

    static FOREIGN_KEY_IND = 4

    static EMBEDDED_TABLE_IND = 5

    static NULLABLE_IND = 6

    static NULLABLE_IND_ALT = 5

    static UNIQUE_IND = 7

    static UNIQUE_IND_ALT = 6

    static COL_GEN_TYPE_IND = 8

    static COL_GEN_TYPE_IND_ALT = 7

    static NULL: string = 'null'

    static NOT_NULL: string = 'not-null'

    static INSERT = 'insert'

    static UPDATE = 'update'

    //static SELECT = 'select'

    static SUPPORTED_TYPES = ['integer', 'int', 'smallint', 'tinyint', 'bigint', 'decimal', 'dec', 'number',
        'real', 'float', 'float(p)', 'double precision', 'char', 'character', 'varchar', 'varchar(n)', 'character varying',
        'text', 'binary', 'varbinary', 'varbinary(n)', 'blob', 'date', 'time', 'datetime', 'timestamp', 'timestamp with time zone',
        'timestamp without time zone', 'boolean', 'enum', 'geometry', 'point', 'linestring', 'polygon', 'json', 'uuid', 'guid',
        'xml', 'array', 'serial', 'bigserial', 'money', 'clob', 'nclob', 'nchar', 'nvarchar2', 'time with time zone',
        'time without time zone', 'nvarchar(n)', 'smallmoney']

    static SUPPORTED_TYPE_FUNCTION_MAP = new Map([
        ["integer", "number.int"], ["int", "number.int"], ["smallint", 'number.int'], ["tinyint", "number.int"],
        ["bigint", "number.bigint"], ["decimal", 'number.octal'], ["dec", "number.octal"], ["number", "number.int"],
        ["real", 'number.float'], ["float", "number.float"], ["float(p)", "number.float"], ["double precision", 'number.float'],
        ["char", "string.fromCharacters"], ["character", "string.fromCharacters"], ["varchar", 'lorem.text'], ["varchar(n)", "lorem.text"],
        ["character varying", "lorem.text"], ["text", 'lorem.text'], ["binary", "number.binary"], ["varbinary", "number.binary"],
        ["varbinary(n)", 'number.binary'], ["blob", "number.binary"], ["date", "date.anytime"], ["time", 'date.anytime'],
        ["datetime", "date.anytime"], ["timestamp", "date.anytime"], ["timestamp with time zone", 'date.anytime'],
        ["timestamp without time zone", "date.anytime"], ["boolean", "datatype.boolean"], ["enum", 'enum'],
        ["geometry", ""], ["point", ""], ["linestring", ''], ["polygon", ""],
        ["json", "json"], ["uuid", 'string.uuid'], ["guid", "string.uuid"], ["xml", "xml"],
        ["array", 'array'], ["serial", "serial"], ["bigserial", "serial"], ["money", 'number.float'],
        ["clob", ""], ["nclob", ""], ["nchar", ''], ["nvarchar2", "lorem.text"],
        ["time with time zone", "date.anytime"], ["time without time zone", 'date.anytime'],
        ["nvarchar(n)", "lorem.text"], ["smallmoney", "number.float"]
    ])

    // List of some common timezone offsets
    static TIMEZONES = [
        'UTC-12:00', 'UTC-11:00', 'UTC-10:00', 'UTC-09:30', 'UTC-09:00', 'UTC-08:00', 'UTC-07:00', 'UTC-06:00', 'UTC-05:00',
        'UTC-04:00', 'UTC-03:30', 'UTC-03:00', 'UTC-02:00', 'UTC-01:00', 'UTC±00:00', // Use ± for UTC+00:00 to represent both +00:00 and -00:00
        'UTC+01:00', 'UTC+02:00', 'UTC+03:00', 'UTC+03:30', 'UTC+04:00', 'UTC+04:30', 'UTC+05:00', 'UTC+05:30', 'UTC+05:45',
        'UTC+06:00', 'UTC+06:30', 'UTC+07:00', 'UTC+08:00', 'UTC+08:45', 'UTC+09:00', 'UTC+09:30', 'UTC+10:00', 'UTC+10:30',
        'UTC+11:00', 'UTC+12:00', 'UTC+12:45', 'UTC+13:00', 'UTC+14:00'
    ];

    static FAKER_MODULES = ['airline', 'animal', 'color', 'commerce', 'company', 'database', 'datatype', 'date', 'finance', 'git',
        'hacker', 'helpers', 'image', 'internet', 'location', 'lorem', 'music', 'number', 'person', 'phone', 'random', 'science',
        'string', 'system', 'vehicle', 'word'
    ]

    static FAKETOR_MODULES = ['']
}