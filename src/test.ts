import { faker } from '@faker-js/faker';
import { Client as PgClient } from 'pg'; // or any other DB client if needed

interface ConnectionDetails {
    // Add required fields for DB connection
    user: string;
    host: string;
    database: string;
    password: string;
    port: number;
}

interface SchemaField {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'custom';
    fakerType?: string; // e.g., 'name.firstName', 'internet.email', etc.
}

export async function generateFakeData(connectionDetails: ConnectionDetails, schema: SchemaField[], quantity: number): Promise<string> {
    const client = new PgClient(connectionDetails);

    // Connect to database
    try {
        await client.connect();

        // Begin transaction
        await client.query('BEGIN');

        let insertCount = 0;

        for (let i = 0; i < quantity; i++) {
            // Generate fake data based on provided schema
            let rowData = {}
            schema.forEach((field) => {
                if (field.fakerType) {
                    try {
                        const fakerCategory = field.fakerType.split('.')[0]
                        const fakerFunction = field.fakerType.split('.')[1]
                        rowData[field.name] = (faker as any)[`${fakerCategory}`][`${fakerFunction}`]()
                    } catch {
                        rowData[field.name] = `Error: Invalid fakerType ${field.fakerType}`
                    }
                } else {
                    // Generate data based on primitive data type
                    switch (field.type) {
                        case 'string':
                            rowData[field.name] = faker.datatype.string();
                            break;
                        case 'number':
                            rowData[field.name] = faker.datatype.number();
                            break;
                        case 'boolean':
                            rowData[field.name] = faker.datatype.boolean();
                            break;
                        default:
                            rowData[field.name] = 'Unknown field type';
                    }
                }
            });

            // Insert data into the table (this follows a generic template; modify it to match your specific scenario)
            const columns = Object.keys(rowData).join(', ');
            const values = Object.values(rowData).map(value => `'${value}'`).join(', ');
            const insertQuery = `INSERT INTO your_table_name (${columns}) VALUES (${values})`;

            // Perform query
            await client.query(insertQuery);
            insertCount++;
        }

        // Commit transaction
        await client.query('COMMIT');

        return `Successfully inserted ${insertCount} records.`;
    } catch (error) {
        // Rollback transaction in case of error
        await client.query('ROLLBACK');
        throw error;
    } finally {
        // Close database connection
        await client.end();
    }
}

export async function generateFakeData(connectionDetails: ConnectionDetails, schema: SchemaField[], quantity: number): Promise<string> {
    const client = new PgClient(connectionDetails);

    // Connect to database
    try {
        await client.connect();

        // Begin transaction
        await client.query('BEGIN');

        let insertCount = 0;

        for (let i = 0; i < quantity; i++) {
            // Generate fake data based on provided schema
            let rowData = {};
            schema.forEach((field) => {
                if (field.fakerType) {
                    // Dynamically call faker's method if it exists
                    try {
                        const fakerCategory = field.fakerType.split('.')[0] as keyof typeof faker;
                        const fakerFunction = field.fakerType.split('.')[1];
                        const categoryObject = faker[fakerCategory];

                        // Unfortunately, the type assertion alone will not work here because
                        // TypeScript cannot infer correct method types dynamically at runtime.
                        // Here we assert any to bypass this limitation (use with caution!).
                        if (categoryObject && typeof (categoryObject as any)[fakerFunction] === 'function') {
                            rowData[field.name] = (categoryObject as any)[fakerFunction]();
                        } else {
                            rowData[field.name] = `Error: fakerType ${field.fakerType} does not refer to a function`;
                        }
                    } catch (error) {
                        rowData[field.name] = `Error: Invalid fakerType ${field.fakerType}`;
                    }
                } else {
                    // Handle primitive data type generation
                    switch (field.type) {
                        case 'string':
                            rowData[field.name] = faker.datatype.string();
                            break;
                        case 'number':
                            rowData[field.name] = faker.datatype.number();
                            break;
                        case 'boolean':
                            rowData[field.name] = faker.datatype.boolean();
                            break;
                        default:
                            rowData[field.name] = 'Unknown field type';
                    }
                }
            });

            // Insert data into the table (this follows a generic template; modify it to match your specific scenario)
            const columns = Object.keys(rowData).join(', ');
            const values = Object.values(rowData).map(value => `'${value}'`).join(', ');
            const insertQuery = `INSERT INTO your_table_name (${columns}) VALUES (${values})`;

            // Perform query
            await client.query(insertQuery);
            insertCount++;
        }

        // Commit transaction
        await client.query('COMMIT');

        return `Successfully inserted ${insertCount} records.`;
    } catch (error) {
        // Rollback transaction in case of error
        await client.query('ROLLBACK');
        throw error;
    } finally {
        // Close database connection
        await client.end();
    }
}

type FakerCategory = keyof typeof faker;

interface FakerParams {
    min?: number;
    max?: number;
    count?: number;
}

// Function to parse the input string and call the appropriate faker method
function callFakerFunction(input: string): any {
    // Extract the category name, method name, and parameters
    const [fullMatch, categoryName, methodName, paramString] =
    input.match(/(\w+)\.(\w+)(\((.*)\))?/) || [];

    // If the pattern does not match, return undefined or throw an exception
    if (!fullMatch) return undefined;

    // Convert the category name to a Faker property type
    const category: FakerCategory | undefined = categoryName as FakerCategory;

    // Get the faker category object
    const fakerCategoryObject = faker[category];

    // Check if the faker method exists and is a function
    if (fakerCategoryObject && typeof fakerCategoryObject[methodName as keyof typeof fakerCategoryObject] === 'function') {
        // Parse parameters; we're assuming parameters are either a number or an object
        const params: number | FakerParams | undefined = paramString ? JSON.parse(paramString) : undefined;

        // Call the method with the parameters and return the result
        try {
            if (typeof params === 'object') {
                return fakerCategoryObject[methodName as keyof typeof fakerCategoryObject](params);
            } else if (typeof params === 'number') {
                return fakerCategoryObject[methodName as keyof typeof fakerCategoryObject](params);
            } else {
                return fakerCategoryObject[methodName as keyof typeof fakerCategoryObject]();
            }
        } catch (error) {
            // Handle errors if the function call failed
            console.error('Error calling the faker function:', error);
            return undefined;
        }
    } else {
        // If the method does not exist on the category, return undefined or throw an exception
        console.error('Invalid faker category or method name');
        return undefined;
    }
}

// Examples:

// Shorthand syntax, default parameters for method
console.log(callFakerFunction("datatype.number()"))  // Outputs a random number

// Shorthand with one parameter
console.log(callFakerFunction("datatype.number(255)"))  // Outputs a random number up to 255

// Using object parameters including min and max values
console.log(callFakerFunction("datatype.number({\"min\": 0, \"max\": 65535})"))  // Outputs a random number between 0 and 65535

//This code uses regular expressions to extract the relevant parts of the input string including the category, method, and parameters. It then uses `JSON.parse()` to convert the parameters string into a JavaScript object or number. Finally, it calls the method using these parameters.

//Please note:

//1. This code assumes the parameters in the brackets are well-formed JSON, which may not always be the case with function arguments. It works with basic numbers and object literals, but if the string representation isn't valid JSON (e.g., doesn't use double quotes around keys), `JSON.parse()` will throw an error.

//2. It is dangerous to use `JSON.parse()` on user input as it can lead to security vulnerabilities. Only use it if you have control over the input, or better, use a safer method of parsing the parameters (like a custom parser).

//3. This example heavily relies on the structure provided by `faker`, any changes in the library might require updates in the code.

//4. Using dynamic method access and dynamic parameters like this leaves the code vulnerable to runtime errors if incorrect input is provided. Ensure that you have error handling in place to deal with these cases.