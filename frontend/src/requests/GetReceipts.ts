import { Receipt, Ingredient } from '../types/Receipt';
import { API_URL } from '../config';

export async function fetchReceipts(): Promise<Receipt[]> {
    const res = await fetch(`${API_URL}/cocktails`);
    if (!res.ok) throw new Error('Failed to fetch receipts');
    const data = await res.json();
    
    // Нормализуем данные - добавляем lowercase версии для удобства
    return (data as Receipt[]).map(receipt => {
        
        const ingredients = (receipt.Ingredients || []).map((ing: any) => {
            return {
                name: ing.Name || ing.name,
                ratio: ing.Ratio || ing.ratio
            };
        });
        
        return {
            ...receipt,
            name: receipt.Name,
            ingredients: ingredients,
            alcoholic: receipt.Alchohol
        };
    });
}