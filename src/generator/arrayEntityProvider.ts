import { EntityProvider } from './entityProvider';
export class ArrayEntityProvider implements EntityProvider {

    dataArray: string[];
    quantity: number;

    public constructor(dataArray: string[], quantity: number) {
        this.dataArray = dataArray;
        this.quantity = quantity;
    }
    produceEntities(): string[][] {
        const mainArr: string[][] = [];
        this.dataArray.forEach((str: string) => {
            const newArr: string[] = [];
            newArr.push(str);
            mainArr.push(newArr);
        });
        return mainArr;
    }
    getQuantity(): number {
        return this.quantity
    }
}