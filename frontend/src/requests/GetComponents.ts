import { Component } from '../types/Component';

export async function fetchComponents(): Promise<Component[]> {
	const API_URL = process.env.API_URL || 'http://localhost:3000/api';
	const res = await fetch(`${API_URL}/cocktails/components`);
	if (!res.ok) throw new Error('Failed to fetch components');
	const data = await res.json();
	return data as Component[];
}
