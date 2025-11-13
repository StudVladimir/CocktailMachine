import { PumpInstruction } from "../types/PumpInstruction";
import { API_URL } from '../config';

export default function MakeCocktail(body: PumpInstruction[]) {
  /*const body: PumpInstruction[] = [
    { pump: 1, seconds: 5 },
    { pump: 2, seconds: 8 }
  ];*/

  console.log('Sending request to backend...');
  console.log('Request body:', body);
  fetch(`${API_URL}/makecocktail`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }).then(r => r.json()).then(console.log).catch(console.error);
}