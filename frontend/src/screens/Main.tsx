import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { usePumps } from '../context/PumpContext';
import { fetchReceipts } from '../requests/GetReceipts';
import { getAvailableCocktails } from '../services/availableDrinks';
import { calculatePumpInstructions } from '../services/calculatePumpInstructions';
import MakeCocktail from '../requests/MakeCockTails';
import { Receipt } from '../types/Receipt';
import Card from './Card';
import { setDrinkImg } from '../services/setDrinkImg';

export default function Main({ navigation }: any) {
	const { pump1, pump2, pump3, pump4 } = usePumps();
	const [availableCocktails, setAvailableCocktails] = useState<Receipt[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [selectedVolume, setSelectedVolume] = useState<number>(200); // По умолчанию 200ml
	const [selectedCocktail, setSelectedCocktail] = useState<Receipt | null>(null);

	console.log('Main экран загружен, прямой доступ к насосам:', {
		pump1: pump1?.name,
		pump2: pump2?.name,
		pump3: pump3?.name,
		pump4: pump4?.name,
	});

	useEffect(() => {
		loadAvailableCocktails();
	}, []);

	const loadAvailableCocktails = async () => {
		try {
			setLoading(true);
			setError(null);
			
			// Получаем все рецепты
			const receipts = await fetchReceipts();
			
			// Получаем текущие насосы напрямую
			const pumps = [pump1, pump2, pump3, pump4];
			console.log('Насосы из контекста (прямой доступ):', pumps);
			
			// Фильтруем доступные коктейли
			const available = getAvailableCocktails(receipts, pumps);
			
			setAvailableCocktails(available);
			console.log('Доступные коктейли:', available);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Ошибка загрузки');
			console.error('Ошибка загрузки коктейлей:', err);
		} finally {
			setLoading(false);
		}
	};

	// Перезагружаем список при возвращении на экран или изменении насосов
	useEffect(() => {
		const unsubscribe = navigation.addListener('focus', () => {
			loadAvailableCocktails();
		});
		return unsubscribe;
	}, [navigation, pump1, pump2, pump3, pump4]);

	const handleMakeCocktail = () => {
		if (!selectedCocktail) {
			console.log('Сначала выберите коктейль!');
			return;
		}

		const cocktailName = selectedCocktail.name || selectedCocktail.Name;
		const ingredients = selectedCocktail.ingredients || selectedCocktail.Ingredients;

		console.log('=== Начало приготовления коктейля ===');
		console.log('Коктейль:', cocktailName);
		console.log('Объем:', selectedVolume, 'мл');
		console.log('Ингредиенты рецепта:', ingredients);

		// Получаем текущие насосы
		const pumps = [pump1, pump2, pump3, pump4];
		console.log('Назначенные насосы:', pumps.map(p => p?.name || 'empty'));

		// Рассчитываем инструкции для насосов
		const instructions = calculatePumpInstructions(
			selectedCocktail,
			selectedVolume,
			pumps
		);

		if (instructions.length === 0) {
			console.error('Не удалось рассчитать инструкции для насосов!');
			return;
		}

		// Отправляем инструкции на бэкенд
		console.log('Отправка инструкций на бэкенд:', instructions);
		MakeCocktail(instructions);
	};

	const handleSelectCocktail = (cocktail: Receipt) => {
		setSelectedCocktail(cocktail);
		console.log('Выбран коктейль:', cocktail.name || cocktail.Name);
	};

	const volumes = [80, 200, 300];

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Главный экран</Text>
			<Text style={styles.subtitle}>Добро пожаловать в CockTail App!</Text>
			
			<Button
				title="Перейти к насосам"
				onPress={() => navigation.navigate('PumpDialog')}
			/>

			<View style={styles.divider} />

			{loading ? (
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="large" color="#0066cc" />
					<Text style={styles.loadingText}>Загрузка коктейлей...</Text>
				</View>
			) : error ? (
				<View style={styles.errorContainer}>
					<Text style={styles.errorText}>❌ {error}</Text>
					<Button title="Попробовать снова" onPress={loadAvailableCocktails} />
				</View>
			) : availableCocktails.length > 0 ? (
				<>
					<Text style={styles.sectionTitle}>
						Доступные коктейли ({availableCocktails.length})
					</Text>
					<FlatList
						data={availableCocktails}
						keyExtractor={(item, index) => `${item.name || item.Name}-${index}`}
						numColumns={2}
						contentContainerStyle={styles.cocktailsList}
						renderItem={({ item }) => {
							const name = item.name || item.Name;
							const ingredients = item.ingredients || item.Ingredients || [];
							const alcoholic = item.alcoholic ?? item.Alchohol;
							const isSelected = selectedCocktail && 
								(selectedCocktail.name || selectedCocktail.Name) === (item.name || item.Name);
							
							return (
								<TouchableOpacity
									onPress={() => handleSelectCocktail(item)}
									style={[
										styles.cardWrapper,
										isSelected && styles.cardWrapperSelected,
									]}
								>
									<Card
										imageSrc={setDrinkImg(ingredients[0]?.name || ingredients[0]?.Name || 'Unknown')}
										name={name || 'Unknown'}
										ingredients={ingredients.map(ing => ing.name || ing.Name).filter((n): n is string => !!n)}
										isAlcoholic={alcoholic}
									/>
									{isSelected && (
										<View style={styles.selectedBadge}>
											<Text style={styles.selectedBadgeText}>✓</Text>
										</View>
									)}
								</TouchableOpacity>
							);
						}}
					/>
				</>
			) : (
				<View style={styles.emptyContainer}>
					<Text style={styles.emptyTitle}>😔 Нет доступных коктейлей</Text>
					<Text style={styles.emptyText}>
						Настройте насосы с ингредиентами, чтобы увидеть доступные коктейли
					</Text>
				</View>
			)}

			{/* Секция выбора объема и кнопка приготовления */}
			<View style={styles.controlsSection}>
				{/* Выбор объема */}
				<View style={styles.volumeContainer}>
					<Text style={styles.volumeTitle}>Объем:</Text>
					{volumes.map((volume) => (
						<TouchableOpacity
							key={volume}
							style={[
								styles.volumeButton,
								selectedVolume === volume && styles.volumeButtonSelected,
							]}
							onPress={() => setSelectedVolume(volume)}
						>
							<Text
								style={[
									styles.volumeText,
									selectedVolume === volume && styles.volumeTextSelected,
								]}
							>
								{volume} ml
							</Text>
							{selectedVolume === volume && (
								<Text style={styles.checkmark}>✓</Text>
							)}
						</TouchableOpacity>
					))}
				</View>

				{/* Кнопка приготовления */}
				<TouchableOpacity
					style={[
						styles.makeCocktailButton,
						!selectedCocktail && styles.makeCocktailButtonDisabled,
					]}
					onPress={handleMakeCocktail}
					disabled={!selectedCocktail}
				>
					<Text style={[
						styles.makeCocktailText,
						!selectedCocktail && styles.makeCocktailTextDisabled,
					]}>
						{selectedCocktail 
							? `Сделать\n${selectedCocktail.name || selectedCocktail.Name}` 
							: 'Выберите коктейль'}
					</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 20,
		backgroundColor: '#f5f5f5',
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 10,
		marginTop: 10,
		color: '#333',
		textAlign: 'center',
	},
	subtitle: {
		fontSize: 16,
		marginBottom: 20,
		color: '#666',
		textAlign: 'center',
	},
	divider: {
		height: 2,
		backgroundColor: '#ddd',
		marginVertical: 20,
	},
	sectionTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		color: '#333',
		marginBottom: 15,
		textAlign: 'center',
	},
	cocktailsList: {
		paddingBottom: 20,
	},
	cardWrapper: {
		position: 'relative',
		margin: 5,
		borderWidth: 3,
		borderColor: 'transparent',
		borderRadius: 12,
		overflow: 'hidden',
	},
	cardWrapperSelected: {
		borderColor: '#4CAF50',
		backgroundColor: '#f1f8f4',
	},
	selectedBadge: {
		position: 'absolute',
		top: 8,
		right: 8,
		backgroundColor: '#4CAF50',
		borderRadius: 15,
		width: 30,
		height: 30,
		justifyContent: 'center',
		alignItems: 'center',
		elevation: 3,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
	},
	selectedBadgeText: {
		color: '#fff',
		fontSize: 18,
		fontWeight: 'bold',
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	loadingText: {
		marginTop: 10,
		fontSize: 16,
		color: '#666',
	},
	errorContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
	},
	errorText: {
		fontSize: 16,
		color: '#d32f2f',
		textAlign: 'center',
		marginBottom: 20,
	},
	emptyContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
	},
	emptyTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		color: '#666',
		marginBottom: 10,
		textAlign: 'center',
	},
	emptyText: {
		fontSize: 16,
		color: '#999',
		textAlign: 'center',
		lineHeight: 24,
	},
	controlsSection: {
		flexDirection: 'row',
		paddingVertical: 20,
		paddingHorizontal: 10,
		backgroundColor: '#fff',
		borderTopWidth: 2,
		borderTopColor: '#ddd',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	volumeContainer: {
		flex: 1,
		marginRight: 15,
	},
	volumeTitle: {
		fontSize: 14,
		fontWeight: '600',
		color: '#666',
		marginBottom: 8,
	},
	volumeButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: 10,
		paddingHorizontal: 15,
		marginBottom: 8,
		backgroundColor: '#fff',
		borderWidth: 2,
		borderColor: '#ddd',
		borderRadius: 8,
	},
	volumeButtonSelected: {
		borderColor: '#4CAF50',
		backgroundColor: '#f1f8f4',
	},
	volumeText: {
		fontSize: 16,
		color: '#333',
		fontWeight: '500',
	},
	volumeTextSelected: {
		color: '#4CAF50',
		fontWeight: '600',
	},
	checkmark: {
		fontSize: 18,
		color: '#4CAF50',
		fontWeight: 'bold',
	},
	makeCocktailButton: {
		flex: 1,
		backgroundColor: '#0066cc',
		paddingVertical: 40,
		paddingHorizontal: 20,
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center',
		elevation: 3,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
	},
	makeCocktailButtonDisabled: {
		backgroundColor: '#ccc',
		elevation: 0,
	},
	makeCocktailText: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#fff',
		textAlign: 'center',
	},
	makeCocktailTextDisabled: {
		color: '#999',
	},
});
