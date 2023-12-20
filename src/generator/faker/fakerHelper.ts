//import { faker } from '@faker-js/faker'
import {Faker, faker} from '@faker-js/faker'
import {Column} from "../schema/column"
import {randomInt} from "crypto"
import {FAKER_MODULES, FAKETOR_MODULES, SUPPORTED_TYPE_FUNCTION_MAP, SUPPORTED_TYPES, TIMEZONES} from "../../common/c"

//const fkr = new Faker({ locale: [en_NG] })
//TODO support user defined locale later
export const produceEntities = (columnSchemas: Column[], quantity: number): string[] => {
    if (!columnSchemas || !quantity)
        return []

    const entities: Array<string[]> = [] //array of string arrays
    for (let i = 0; i <= quantity; i++) {
        const entity: string[] = [] //array for column values
        columnSchemas.forEach((v, j) => {
            if (v.gen_type === 'auto') {
                entity.push('')
                return
            }

            //check if nullability is based on being a foreign key. if not, randomly assign a null or value
            if (v.nullable && !v.data.foreign_key) {
                const c = randomInt(2)
                if (c === 0) {
                    entity.push(null)
                    return
                } else {
                    if (!isSupportedType(v.data.type))
                        throw Error(`Unsupported data type. Column name ${v.name} unsupported data type ${v.data.type}. 
                        Kindly visit https://faketor.com/doc/supported-data-types`)
                    entity.push(resolveTypeDesc(v.data.type, v.data.desc))
                }
            }
            if (!v.nullable) {
                if (!isSupportedType(v.data.type))
                    throw Error(`Unsupported data type. Column name ${v.name} unsupported data type ${v.data.type}. 
                        Kindly visit https://faketor.com/doc/supported-data-types`)
                entity.push(resolveTypeDesc(v.data.type, v.data.desc))
            }
        })
    }
}

const isSupportedType = (type: string): boolean => {
    return SUPPORTED_TYPES.includes(type)
}

const resolveTypeDesc = (type: string, desc: string): any => {
    if (!isSupportedType(type))
        throw Error(`Unsupported data type ${type}. Kindly visit https://faketor.com/doc/supported-data-types`)

    // Extract the category name, method name, and parameters
    if (!/(\w+)\.(\w+)(?:\(([^()]*)\))?/.test(desc))
        throw Error(`Unsupported data desc ${desc}. Kindly visit https://faketor.com/doc/supported-data-desc`)

    const descArr = desc.split(".")
    const module = descArr[0]
    let faketorDesc = false

    if (!FAKER_MODULES.includes(module) && !FAKETOR_MODULES.includes(module))
        throw Error(`Unsupported module ${desc} ${module}. Kindly visit https://faketor.com/doc/supported-data-desc`)

    if (FAKETOR_MODULES.includes(module))
        faketorDesc = true

    let method = descArr[1]
    let params = ''
    if(descArr[1].includes("(")) {
        if(!descArr[1].includes(")") && descArr[1].charAt(descArr[1].length - 1) === ')')
            throw Error(`Malformed data desc ${desc}. Kindly visit https://faketor.com/doc/supported-data-desc`)
        const arr =  descArr[1].split("(")
        method = arr[0]
        params = arr[1].substring(0, arr[1].lastIndexOf(')'))
    }
    const paramsArr = params.split(", ")
    if ((faker as any)[module][method]() === undefined)
        throw Error(`Unavailable method ${desc} ${method}. Kindly visit https://faketor.com/doc/supported-data-desc`)

    if (!faketorDesc) {
        try {
            return (faker as any)[module][method](...paramsArr)
        } catch (e) {
            throw e
        }
    }
}

function getRandomTimezone() {
    // Generate a random index
    const randomIndex = Math.floor(Math.random() * TIMEZONES.length)
    // Return the randomly selected timezone
    return TIMEZONES[randomIndex]
}