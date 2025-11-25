import { API_URL } from '../config';

export default async function StopCocktail() {
	console.log('🛑 === EMERGENCY STOP REQUEST ===');
	console.log('📡 Sending MQTT emergency stop to backend:', `${API_URL}/makecocktail/stop`);
	
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
		console.log('✅ Emergency stop confirmed by backend:', data);
		console.log('⚠️ All pumps should stop immediately!');
		return data;
	} catch (error) {
		console.error('❌ Error while sending emergency stop:', error);
		throw error;
	}
}
