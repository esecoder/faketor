interface TableNode {
    name: string;
    dependencies: string[]; // Names of tables that this table depends on
}

// Example graph representing tables and relations (edges are implied by dependencies)
const tables: TableNode[] = [
    { name: 'TableA', dependencies: [] },
    { name: 'TableB', dependencies: ['TableA'] }, // TableB depends on TableA
    { name: 'TableC', dependencies: ['TableB'] }, // TableC depends on TableB
    { name: 'TableD', dependencies: ['TableA', 'TableC'] }, // TableD depends on TableA and TableC
    // ... other tables
];

// This array of TableNodes can be further processed to execute operations in the correct order.

class Graph {
    constructor() {
        this.adjacencyList = new Map();
    }

    addNode(node) {
        if (!this.adjacencyList.has(node)) {
            this.adjacencyList.set(node, new Set());
        }
    }

    addEdge(origin, destination) {
        if (!this.adjacencyList.has(origin)) {
            this.addNode(origin);
        }
        if (!this.adjacencyList.has(destination)) {
            this.addNode(destination);
        }
        this.adjacencyList.get(origin).add(destination);
    }

    // Helper function to visualize the graph
    print() {
        for (let [key, value] of this.adjacencyList) {
            console.log(key, '->', Array.from(value));
        }
    }
}

// Example usage:
const dependencyGraph = new Graph();

// Add tables as nodes
tables.forEach(table => dependencyGraph.addNode(table.name));

// Add relationships as edges
tables.forEach(table => {
    table.dependencies.forEach(dependency => {
        dependencyGraph.addEdge(dependency, table.name);
    });
});

// Visualize the graph
dependencyGraph.print();


const { Sequelize, DataTypes } = require('sequelize');

// Assuming you have already instantiated `sequelize` with the connection details
// Set up the Parent model
const Parent = sequelize.define('Parent', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    // Other fields ...
}, {});

// Set up the Child model
const Child = sequelize.define('Child', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    parentId: {
        type: DataTypes.INTEGER,
        references: {
            model: 'Parents', // name of Target model
            key: 'id',       // key in Target model
        },
    },
    // Other fields ...
}, {});

// Set up bidirectional relationships
Parent.hasOne(Child, {
    foreignKey: 'parentId',
});
Child.belongsTo(Parent, {
    foreignKey: 'parentId',
});

// Example for creating parent and child in a transaction
async function createParentAndChild() {
    const transaction = await sequelize.transaction();

    try {
        // Create Parent without reference to Child
        const parent = await Parent.create({}, { transaction });

        // Create Child with reference to Parent
        const child = await Child.create({
            parentId: parent.id
        }, { transaction });

        // Here, you could update Parent with reference to Child if needed

        // Commit transaction
        await transaction.commit();

    } catch (error) {
        // Rollback transaction on error
        await transaction.rollback();
        throw error;
    }
}

// Call the function
createParentAndChild().then(() => {
    console.log('Parent and child created successfully');
}).catch((error) => {
    console.error('Failed to create parent and child:', error);
});


interface TableColumn {
    columnName: string;
    dataType: string;
    isNullable: boolean;
    isPrimaryKey: boolean;
    isForeignKey: boolean;
    isUnique: boolean;
    references?: {
        tableName: string;
        columnName: string;
    };
}

interface TableSchema {
    tableName: string;
    columns: TableColumn[];
}

// Assume schemas for tables have been loaded and are available as TableSchema[]
const tableSchemas: TableSchema[] = [/* populated with schema definitions */];

for (const schema of tableSchemas) {
    for (const column of schema.columns) {
        if (column.isForeignKey) {
            if (column.isUnique || column.isPrimaryKey) {
                console.log(`Table ${schema.tableName} has a One-to-One relationship with ${column.references?.tableName}`);
            } else {
                console.log(`Table ${schema.tableName} has a One-to-Many relationship with ${column.references?.tableName}`);
            }
        }
        // Since Many-to-Many relationships involve a separate join table,
        // detection would require checking if the table is indeed a join table,
        // with no unique data of its own and primary or unique keys made of foreign keys
    }
}

// Additional logic would be needed to detect Many-to-Many relationships.
// This could include checking for tables with only foreign key columns, which are collectively unique.



import { Configuration, OpenAIApi, CreateChatCompletionRequest, ChatCompletion } from "openai";

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY, // Make sure to set OPENAI_API_KEY in your environment variables
});
const openai = new OpenAIApi(configuration);

async function askQuestion() {
    let messages: CreateChatCompletionRequest['messages'] = [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "I need help with my math homework." },
    ];

    for (let i = 0; i < messages.length; i++) {
        const response: ChatCompletion = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages,
        });

        const messageContent: string = response.data.choices[0].message.content;
        console.log(messageContent); // Outputs the AI's response

        // After the first API call, subsequent prompts can just add new messages to the messages array
        if (i === messages.length - 1) {
            messages.push({
                role: "user",
                content: "Can you explain Pythagorean theorem?"
            });
        }
    }
}

askQuestion().catch((error) => {
    console.error(error);
});