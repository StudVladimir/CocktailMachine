import { Component } from '../types/Component';
import { Receipt } from '../types/Receipt';
import { PumpInstruction } from '../types/PumpInstruction';

/**
 * Константа: производительность насоса в мл/сек
 */
const PUMP_RATE_ML_PER_SECOND = 2;

/**
 * Нормализация строки для сравнения (убирает умляуты и приводит к нижнему регистру)
 */
function normalizeString(str: string): string {
	return str
		.toLowerCase()
		.replace(/ä/g, 'a')
		.replace(/ö/g, 'o')
		.replace(/ü/g, 'u')
		.replace(/ß/g, 'ss');
}

/**
 * Находит номер насоса для указанного ингредиента
 */
function findPumpForIngredient(
	ingredientName: string,
	pumps: (Component | null)[]
): number | null {
	const normalizedIngredient = normalizeString(ingredientName);

	for (let i = 0; i < pumps.length; i++) {
		if (pumps[i]) {
			const normalizedPumpName = normalizeString(pumps[i]!.name);
			if (normalizedPumpName === normalizedIngredient) {
				return i + 1; // Насосы нумеруются с 1
			}
		}
	}

	return null;
}

/**
 * Рассчитывает инструкции для насосов на основе рецепта и объема
 * 
 * @param cocktail - Выбранный коктейль с рецептом
 * @param volume - Желаемый объем напитка в мл
 * @param pumps - Массив назначенных компонентов на насосы [pump1, pump2, pump3, pump4]
 * @returns Массив инструкций для насосов [{ pump: номер, seconds: время }]
 */
export function calculatePumpInstructions(
	cocktail: Receipt,
	volume: number,
	pumps: (Component | null)[]
): PumpInstruction[] {
	const instructions: PumpInstruction[] = [];
	
	// Получаем ингредиенты из рецепта (поддерживаем оба варианта названий полей)
	const ingredients = cocktail.ingredients || cocktail.Ingredients || [];

	console.log('=== Calculating pump instructions ===');
	console.log('Cocktail:', cocktail.name || cocktail.Name);
	console.log('Volume:', volume, 'ml');
	console.log('Ingredients:', ingredients);

	for (const ingredient of ingredients) {
		const ingredientName = ingredient.name || ingredient.Name;
		const ratioStr = ingredient.ratio || ingredient.Ratio;
		
		if (!ingredientName || !ratioStr) {
			console.warn('Ingredient without name or ratio:', ingredient);
			continue;
		}
		
		const ratio = parseFloat(ratioStr);

		// Находим номер насоса для этого ингредиента
		const pumpNumber = findPumpForIngredient(ingredientName, pumps);

		if (pumpNumber === null) {
			console.warn(
				`Pump for ingredient "${ingredientName}" not found. Skipping.`
			);
			continue;
		}

		// Рассчитываем объем этого ингредиента в мл
		const ingredientVolume = (volume * ratio) / 100;

		// Рассчитываем время работы насоса в секундах
		// Время = Объем / Скорость
		const seconds = ingredientVolume / PUMP_RATE_ML_PER_SECOND;

		console.log(`Ingredient: ${ingredientName}`);
		console.log(`  - Pump: ${pumpNumber}`);
		console.log(`  - Ratio: ${ratio}%`);
		console.log(`  - Volume: ${ingredientVolume.toFixed(2)} ml`);
		console.log(`  - Run time: ${seconds.toFixed(2)} sec`);

		instructions.push({
			pump: pumpNumber,
			seconds: Math.round(seconds * 100) / 100, // Округляем до 2 знаков после запятой
		});
	}

	console.log('Final instructions:', instructions);
	console.log('=====================================');

	return instructions;
}
