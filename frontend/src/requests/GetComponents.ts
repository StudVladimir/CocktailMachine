import { Component } from '../types/Component';
import { API_URL } from '../config';

export async function fetchComponents(): Promise<Component[]> {
	const res = await fetch(`${API_URL}/cocktails/components`);
	if (!res.ok) throw new Error('Failed to fetch components');
	const data = await res.json();
	return data as Component[];
}
