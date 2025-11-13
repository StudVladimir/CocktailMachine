export interface Ingredient {
    Name?: string;
    name?: string;
    Ratio?: string;
    ratio?: string;
}

export interface Receipt {
    Name: string;
    Ingredients: Ingredient[];
    Alchohol: boolean;
    // Добавляем lowercase версии для удобства
    name?: string;
    ingredients?: Ingredient[];
    alcoholic?: boolean;
}