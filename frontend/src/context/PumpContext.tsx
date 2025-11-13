import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Component } from '../types/Component';

interface PumpContextType {
	pump1: Component | null;
	pump2: Component | null;
	pump3: Component | null;
	pump4: Component | null;
	setPump1: (component: Component | null) => void;
	setPump2: (component: Component | null) => void;
	setPump3: (component: Component | null) => void;
	setPump4: (component: Component | null) => void;
	getAllPumps: () => (Component | null)[];
}

const PumpContext = createContext<PumpContextType | undefined>(undefined);

export const PumpProvider = ({ children }: { children: ReactNode }) => {
	const [pump1, setPump1] = useState<Component | null>(null);
	const [pump2, setPump2] = useState<Component | null>(null);
	const [pump3, setPump3] = useState<Component | null>(null);
	const [pump4, setPump4] = useState<Component | null>(null);

	const getAllPumps = useCallback(() => {
		const pumps = [pump1, pump2, pump3, pump4];
		console.log('getAllPumps вызван, текущие значения:', {
			pump1: pump1?.name,
			pump2: pump2?.name,
			pump3: pump3?.name,
			pump4: pump4?.name,
		});
		return pumps;
	}, [pump1, pump2, pump3, pump4]);

	return (
		<PumpContext.Provider
			value={{
				pump1,
				pump2,
				pump3,
				pump4,
				setPump1,
				setPump2,
				setPump3,
				setPump4,
				getAllPumps,
			}}
		>
			{children}
		</PumpContext.Provider>
	);
};

export const usePumps = () => {
	const context = useContext(PumpContext);
	if (!context) {
		throw new Error('usePumps must be used within PumpProvider');
	}
	return context;
};
