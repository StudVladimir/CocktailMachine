import { API_URL } from '../config';

export default async function StopCocktail() {
	try {
		const response = await fetch(`${API_URL}/makecocktail/stop`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		console.log('🛑 Emergency stop command sent:', data);
		return data;
	} catch (error) {
		console.error('❌ Error while stopping cocktail:', error);
		throw error;
	}
}
