import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

// For local images, use require and pass as imageSrc
// Example: imageSrc={require('../../assets/images/componentsDrinks/Cola.png')}

export interface CocktailCardProps {
	imageSrc: any; // require('../../assets/...')
	name: string;
	ingredients?: string[];
	isAlcoholic?: boolean;
}

export default function Card({ imageSrc, name, ingredients, isAlcoholic }: CocktailCardProps) {
	return (
		<View style={styles.card}>
			<Image source={imageSrc} style={styles.image} resizeMode="contain" />
			<View style={styles.info}>
				<Text style={styles.name}>{name}</Text>
				{ingredients && ingredients.length > 0 && (
					<Text style={styles.ingredients}>{ingredients.join(', ')}</Text>
				)}
				{isAlcoholic !== undefined && (
					<Text style={styles.alcoholic}>{isAlcoholic ? '🍺 Alcoholic' : '🧃 Non-Alcoholic'}</Text>
				)}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	card: {
		flex: 1,
		backgroundColor: '#fff',
		borderRadius: 14,
		padding: 8,
		margin: 6,
		alignItems: 'center',
		shadowColor: '#000',
		shadowOpacity: 0.08,
		shadowRadius: 6,
		elevation: 2,
		minWidth: 120,
		maxWidth: 160,
	},
	image: {
		width: 80,
		height: 80,
		borderRadius: 10,
		backgroundColor: '#eee',
		marginBottom: 8,
	},
	info: {
		alignItems: 'center',
		width: '100%',
	},
	name: {
		fontSize: 15,
		fontWeight: '700',
		marginBottom: 3,
		textAlign: 'center',
	},
	ingredients: {
		fontSize: 12,
		color: '#555',
		marginBottom: 2,
		textAlign: 'center',
	},
	alcoholic: {
		fontSize: 12,
		color: '#1a9c2e',
		marginTop: 2,
		textAlign: 'center',
	},
});
