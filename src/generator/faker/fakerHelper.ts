import { CustomAugmenter } from './../customAugmenter';
//import { faker } from '@faker-js/faker'
import {faker} from '@faker-js/faker'
import {Column} from "../schema/column"
import {randomInt} from "crypto"
import { C } from "../../common/c"

//const fkr = new Faker({ locale: [en_NG] })
//TODO support user defined locale later
export const generateEntities = (columns: Column[], quantity: number, 
    customAugmenter: CustomAugmenter = null): Array<string[]> => {
    if (!columns || !quantity)
        return [];

    const entities: Array<string[]> = [] //array of string arrays for all records generated
    for (let i = 0; i <= quantity; i++) {
        const entity: string[] = []; //array for column values
        columns.forEach((column: Column, j: number) => {
            //if there is a custom augmentation data for this column, then use that
            if (customAugmenter) {
                if (customAugmenter.column === column) {
                    if (customAugmenter.augmentationData instanceof Map) {
                        entity.push(customAugmenter.augmentationData.get(`${i}`));
                    } else {
                        entity.push(customAugmenter.augmentationData[i]);
                    }
                    return;
                }
            }
            //if auto, we allow the database generate this, if custom, we generate
            if (column.gen_type === 'auto') {
                entity.push('');
                return;
            }

            //check if nullability is based on being a foreign key. if not, randomly assign a null or value
            if (column.nullable && !column.data.foreign_key) {
                const c = randomInt(2);
                if (c === 0) {
                    entity.push(null);
                    return;
                } else {
                    if (!isSupportedType(column.data.type))
                        throw Error(`Unsupported data type. Column name ${column.name} unsupported data type ${column.data.type}. 
                        Kindly visit https://faketor.com/doc/supported-data-types`);
                    entity.push(resolveTypeDesc(column.data.type, column.data.desc));
                    return;
                }
            }
            if (!column.nullable) {
                if (!isSupportedType(column.data.type))
                    throw Error(`Unsupported data type. Column name ${column.name} unsupported data type ${column.data.type}. 
                        Kindly visit https://faketor.com/doc/supported-data-types`);
                entity.push(resolveTypeDesc(column.data.type, column.data.desc));
                return;
            }
        })
        entities.push(entity);
    }
    return entities;
}

const isSupportedType = (type: string): boolean => {
    return C.SUPPORTED_TYPES.includes(type);
}

const resolveTypeDesc = (type: string, desc: string): string => {
    if (!isSupportedType(type))
        throw Error(`Unsupported data type ${type}. Kindly visit https://faketor.com/doc/supported-data-types`);

    // Extract the category name, method name, and parameters
    if (!/(\w+)\.(\w+)(?:\(([^()]*)\))?/.test(desc))
        throw Error(`Unsupported data desc ${desc}. Kindly visit https://faketor.com/doc/supported-data-desc`);

    const descArr = desc.split(".");
    const module = descArr[0];
    let faketorDesc = false;

    if (!C.FAKER_MODULES.includes(module) && !C.FAKETOR_MODULES.includes(module))
        throw Error(`Unsupported module ${desc} ${module}. Kindly visit https://faketor.com/doc/supported-data-desc`);

    if (C.FAKETOR_MODULES.includes(module))
        faketorDesc = true;

    let method = descArr[1];
    let params = '';
    if(descArr[1].includes("(")) {
        if(!descArr[1].includes(")") && descArr[1].charAt(descArr[1].length - 1) === ')')
            throw Error(`Malformed data desc ${desc}. Kindly visit https://faketor.com/doc/supported-data-desc`);
        const arr =  descArr[1].split("(");
        method = arr[0];
        params = arr[1].substring(0, arr[1].lastIndexOf(')'));
    }
    const paramsArr = params.split(", ");
    if ((faker as any)[module][method]() === undefined)
        throw Error(`Unavailable method ${desc} ${method}. Kindly visit https://faketor.com/doc/supported-data-desc`);

    if (!faketorDesc) {
        try {
            return (faker as any)[module][method](...paramsArr);
        } catch (e) {
            throw e;
        }
    }
}

function getRandomTimezone() {
    // Generate a random index
    const randomIndex = Math.floor(Math.random() * C.TIMEZONES.length);
    // Return the randomly selected timezone
    return C.TIMEZONES[randomIndex];
}