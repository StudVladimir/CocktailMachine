import { Component } from '../types/Component';
import { Receipt } from '../types/Receipt';

/**
 * Нормализует строку для сравнения (убирает умляуты и приводит к нижнему регистру)
 */
function normalizeString(str: string): string {
	return str
		.toLowerCase()
		.trim()
		.replace(/ä/g, 'a')
		.replace(/ö/g, 'o')
		.replace(/ü/g, 'u')
		.replace(/ß/g, 'ss');
}

/**
 * Проверяет, можно ли приготовить коктейль с доступными насосами
 * @param receipt - рецепт коктейля
 * @param pumps - массив компонентов в насосах (может содержать null)
 * @returns true, если все ингредиенты доступны
 */
export function isCocktailAvailable(receipt: Receipt, pumps: (Component | null)[]): boolean {
	// Получаем список доступных ингредиентов (убираем null)
	const availableIngredients = pumps
		.filter((pump): pump is Component => pump !== null)
		.map(pump => normalizeString(pump.name));


	// Проверяем, есть ли все необходимые ингредиенты
	const ingredients = receipt.ingredients || receipt.Ingredients || [];
	
	const allIngredientsAvailable = ingredients.every(ingredient => {
		// Проверяем что у ингредиента есть имя (поддерживаем оба варианта)
		const name = ingredient.name || ingredient.Name;
		if (!name) {
			console.warn('Ingredient without name:', ingredient);
			return false;
		}
		const normalizedIngredient = normalizeString(name);
		const isAvailable = availableIngredients.includes(normalizedIngredient);
		return isAvailable;
	});

	return allIngredientsAvailable && ingredients.length > 0;
}

/**
 * Фильтрует список рецептов, оставляя только доступные для приготовления
 * @param receipts - список всех рецептов
 * @param pumps - массив компонентов в насосах
 * @returns массив доступных рецептов
 */
export function getAvailableCocktails(receipts: Receipt[], pumps: (Component | null)[]): Receipt[] {
	return receipts.filter(receipt => isCocktailAvailable(receipt, pumps));
}
