import { PumpInstruction } from "../types/PumpInstruction";
import { API_URL } from '../config';

export default function MakeCocktail(body: PumpInstruction[]) {
  /*const body: PumpInstruction[] = [
    { pump: 1, seconds: 5 },
    { pump: 2, seconds: 8 }
  ];*/

  console.log('🍹 === MAKE COCKTAIL REQUEST ===');
  console.log('📡 Sending MQTT message to backend:', `${API_URL}/makecocktail`);
  console.log('🔧 Pump instructions:', body);
  console.log('Total pumps:', body.length);
  body.forEach(instruction => {
    console.log(`  - Pump ${instruction.pump}: ${instruction.seconds} seconds`);
  });
  
  fetch(`${API_URL}/makecocktail`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  .then(r => r.json())
  .then(data => {
    console.log('✅ Backend response:', data);
    return data;
  })
  .catch(error => {
    console.error('❌ Error sending make cocktail request:', error);
  });
}