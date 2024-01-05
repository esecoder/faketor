#!/usr/bin/env node
import { Command } from 'commander';
import { generate } from '../cli/genControllerCLI';
import process from 'process';

const program = new Command();

// Your task-running logic should be encapsulated in functions

program
    .name('faketor')
    .description('This application allows developers to generate large fake data into their staging databases when supplied with schema. It supports a lot of database providers.')
    .version('0.1.0');

program.command('generate')
    .description('Generates data for the supplied schema and populates into the supplied database.')
    .argument('<connection_details>', 'Connection data json object or Connection url string.')
    .argument('<db_provider>', 'Database provider.')
    .argument('<table_list>', 'Schema to generate data for or List of tables to generate data for.')
    .argument('<quantity>', 'Number of rows to generate.')
    //.option('-d, --database', 'To save in a database.')
    //.option('-j, --json', 'To return JSON instead of writing to database.')
    //.option('-x, --xml', 'To return XML instead of writing to database.')
    //.option('-c, --csv', 'To return CSV instead of writing to database.')
    .action((connection_details, db_provider, table_list, quantity , options) => {
        const opts: string[] = [];
        if (!connection_details) {
            console.error('No connection details');
        }
        if (!db_provider) {
            console.error('No database provider');
        }
        if (!table_list) {
            console.error('No table list or schema');
        }
        if (!quantity) {
            console.error('No quantity');
        }
        if (!options) {
            opts.push('database');
        }

        generate(connection_details, db_provider, table_list,  quantity);
    });

program.parse();