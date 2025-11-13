import { Receipt, Ingredient } from '../types/Receipt';

export async function fetchReceipts(): Promise<Receipt[]> {
    const API_URL = process.env.API_URL || 'http://localhost:3000/api';
    const res = await fetch(`${API_URL}/cocktails`);
    if (!res.ok) throw new Error('Failed to fetch receipts');
    const data = await res.json();
    
    console.log('Сырые данные из API (первый рецепт):', JSON.stringify(data[0], null, 2));
    
    // Нормализуем данные - добавляем lowercase версии для удобства
    return (data as Receipt[]).map(receipt => {
        console.log('Обработка рецепта:', receipt.Name, 'Ингредиенты:', receipt.Ingredients);
        
        const ingredients = (receipt.Ingredients || []).map((ing: any) => {
            console.log('Ингредиент:', ing);
            return {
                name: ing.Name || ing.name,
                ratio: ing.Ratio || ing.ratio
            };
        });
        
        console.log('Обработанные ингредиенты:', ingredients);
        
        return {
            ...receipt,
            name: receipt.Name,
            ingredients: ingredients,
            alcoholic: receipt.Alchohol
        };
    });
}