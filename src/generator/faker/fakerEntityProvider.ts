import { CustomAugmenter } from './../customAugmenter';
import { Column } from '../schema/column';
import { EntityProvider } from '../entityProvider';
import { generateEntities } from './fakerHelper';

export class FakerEntityProvider implements EntityProvider {

    columns: Column[];
    quantity: number;
    customAugmenter: CustomAugmenter;

    public constructor(columns: Column[], quantity: number, customAugmenter: CustomAugmenter = null) {
        this.columns = columns;
        this.quantity = quantity;
        this.customAugmenter = customAugmenter;
    }

    produceEntities(): Array<string[]> {
        return generateEntities(this.columns, this.quantity, this.customAugmenter);
    }

    getQuantity(): number {
        return this.quantity
    }
}