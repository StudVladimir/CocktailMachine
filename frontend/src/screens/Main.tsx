import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Button, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { usePumps } from '../context/PumpContext';
import { fetchReceipts } from '../requests/GetReceipts';
import { getAvailableCocktails } from '../services/availableDrinks';
import { calculatePumpInstructions } from '../services/calculatePumpInstructions';
import MakeCocktail from '../requests/MakeCockTails';
import StopCocktail from '../requests/StopCockTails';
import { Receipt } from '../types/Receipt';
import Card from './Card';
import { setDrinkImg } from '../services/setDrinkImg';
import strings from '../localize/string';

export default function Main({ navigation }: any) {
	const { pump1, pump2, pump3, pump4 } = usePumps();
	const [availableCocktails, setAvailableCocktails] = useState<Receipt[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [selectedVolume, setSelectedVolume] = useState<number>(200); // По умолчанию 200ml
	const [selectedCocktail, setSelectedCocktail] = useState<Receipt | null>(null);
	const [isMakingCocktail, setIsMakingCocktail] = useState(false);
	const [progress, setProgress] = useState(0);
	const [totalTime, setTotalTime] = useState(0);
	const [cocktailName, setCocktailName] = useState('');

	// Refs для хранения интервалов и таймаутов
	const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
	const completionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
			
			// Фильтруем доступные коктейли
			const available = getAvailableCocktails(receipts, pumps);
			
			setAvailableCocktails(available);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Loading error');
			console.error('Error loading cocktails:', err);
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
			console.log('Please select a cocktail first!');
			return;
		}

		const cocktailName = selectedCocktail.name || selectedCocktail.Name;
		const ingredients = selectedCocktail.ingredients || selectedCocktail.Ingredients;

		console.log('=== Starting cocktail preparation ===');
		console.log('Cocktail:', cocktailName);
		console.log('Volume:', selectedVolume, 'ml');
		console.log('Recipe ingredients:', ingredients);

		// Получаем текущие насосы
		const pumps = [pump1, pump2, pump3, pump4];
		console.log('Assigned pumps:', pumps.map(p => p?.name || 'empty'));

		// Рассчитываем инструкции для насосов
		const instructions = calculatePumpInstructions(
			selectedCocktail,
			selectedVolume,
			pumps
		);

		if (instructions.length === 0) {
			console.error('Failed to calculate pump instructions!');
			return;
		}

		// Отправляем инструкции на бэкенд
		console.log('Sending instructions to backend:', instructions);
		
		// Рассчитываем максимальное время приготовления
		const maxTime = Math.max(...instructions.map(i => i.seconds));
		
		setIsMakingCocktail(true);
		setProgress(0);
		setTotalTime(maxTime);
		setCocktailName(cocktailName);
		
		MakeCocktail(instructions);
		
		// Обновляем прогресс-бар каждые 100мс
		const startTime = Date.now();
		progressIntervalRef.current = setInterval(() => {
			const elapsed = (Date.now() - startTime) / 1000;
			const currentProgress = Math.min((elapsed / maxTime) * 100, 100);
			setProgress(currentProgress);
			
			if (elapsed >= maxTime) {
				if (progressIntervalRef.current) {
					clearInterval(progressIntervalRef.current);
					progressIntervalRef.current = null;
				}
			}
		}, 100);
		
		// Автоматически завершаем через максимальное время
		completionTimeoutRef.current = setTimeout(() => {
			setIsMakingCocktail(false);
			setProgress(0);
			if (progressIntervalRef.current) {
				clearInterval(progressIntervalRef.current);
				progressIntervalRef.current = null;
			}
		}, maxTime * 1000 + 1000);
	};

	const handleStopCocktail = () => {
		console.log('🛑 EMERGENCY STOP!');
		StopCocktail();
		
		// Очищаем все интервалы и таймауты
		if (progressIntervalRef.current) {
			clearInterval(progressIntervalRef.current);
			progressIntervalRef.current = null;
		}
		if (completionTimeoutRef.current) {
			clearTimeout(completionTimeoutRef.current);
			completionTimeoutRef.current = null;
		}
		
		// Сбрасываем состояние
		setIsMakingCocktail(false);
		setProgress(0);
	};

	const handleSelectCocktail = (cocktail: Receipt) => {
		setSelectedCocktail(cocktail);
		console.log('Selected cocktail:', cocktail.name || cocktail.Name);
	};

	const volumes = [80, 200, 300];

	return (
		<View style={styles.container}>
			{/* Секция отображения текущих насосов */}
			<View style={styles.pumpsInfoSection}>
				<View style={styles.pumpsGrid}>
					<View style={styles.pumpInfoCard}>
						<Text style={styles.pumpInfoLabel}>{strings.main.pump} 1</Text>
						<Text style={styles.pumpInfoValue} numberOfLines={2}>
							{pump1?.name || strings.main.notAssigned}
						</Text>
					</View>
					<View style={styles.pumpInfoCard}>
						<Text style={styles.pumpInfoLabel}>{strings.main.pump} 2</Text>
						<Text style={styles.pumpInfoValue} numberOfLines={2}>
							{pump2?.name || strings.main.notAssigned}
						</Text>
					</View>
					<View style={styles.pumpInfoCard}>
						<Text style={styles.pumpInfoLabel}>{strings.main.pump} 3</Text>
						<Text style={styles.pumpInfoValue} numberOfLines={2}>
							{pump3?.name || strings.main.notAssigned}
						</Text>
					</View>
					<View style={styles.pumpInfoCard}>
						<Text style={styles.pumpInfoLabel}>{strings.main.pump} 4</Text>
						<Text style={styles.pumpInfoValue} numberOfLines={2}>
							{pump4?.name || strings.main.notAssigned}
						</Text>
					</View>
				</View>
				<TouchableOpacity 
					style={styles.setupButton}
					onPress={() => navigation.navigate('PumpDialog')}
				>
					<Text style={styles.setupButtonText}>{strings.main.setupDrinks}</Text>
				</TouchableOpacity>
			</View>

			<View style={styles.divider} />

			{loading ? (
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="large" color="#0066cc" />
					<Text style={styles.loadingText}>{strings.main.loadingCocktails}</Text>
				</View>
		) : error ? (
			<View style={styles.errorContainer}>
				<Text style={styles.errorText}>❌ {error}</Text>
				<Button title={strings.main.tryAgain} onPress={loadAvailableCocktails} />
			</View>
		) : isMakingCocktail ? (
			<View style={styles.progressContainer}>
				<Text style={styles.progressTitle}>{strings.main.preparingCocktail}</Text>
				<Text style={styles.progressCocktailName}>{cocktailName}</Text>
				<View style={styles.progressBarContainer}>
					<View style={[styles.progressBar, { width: `${progress}%` }]} />
				</View>
				<Text style={styles.progressText}>{Math.round(progress)}%</Text>
				<Text style={styles.progressTime}>
					{Math.round((totalTime * progress) / 100)} / {Math.round(totalTime)} {strings.main.sec}
				</Text>
			</View>
		) : availableCocktails.length > 0 ? (
				<>
					<Text style={styles.sectionTitle}>
						{strings.main.availableCocktails} ({availableCocktails.length})
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
					<Text style={styles.emptyTitle}>{strings.main.noCocktailsTitle}</Text>
					<Text style={styles.emptyText}>
						{strings.main.noCocktailsText}
					</Text>
				</View>
			)}

			{/* Секция выбора объема и кнопка приготовления */}
			<View style={styles.controlsSection}>
				{/* Левая колонка - выбор объема */}
				<View style={styles.volumeColumn}>
					<Text style={styles.volumeTitle}>{strings.main.volume}</Text>
					{volumes.map((volume) => (
						<TouchableOpacity
							key={volume}
							style={[
								styles.volumeButton,
								selectedVolume === volume && styles.volumeButtonSelected,
							]}
							onPress={() => setSelectedVolume(volume)}
							disabled={isMakingCocktail}
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

				{/* Правая колонка - кнопка приготовления или остановки */}
				<View style={styles.actionColumn}>
					{!isMakingCocktail ? (
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
									? `${strings.main.make}\n${selectedCocktail.name || selectedCocktail.Name}` 
									: strings.main.selectCocktail}
							</Text>
						</TouchableOpacity>
					) : (
						<TouchableOpacity
							style={styles.stopButton}
							onPress={handleStopCocktail}
						>
							<Text style={styles.stopButtonText}>
								{strings.main.stop}
							</Text>
						</TouchableOpacity>
					)}
				</View>
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
	pumpsInfoSection: {
		backgroundColor: '#fff',
		borderRadius: 12,
		padding: 15,
		marginBottom: 10,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	pumpsGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
		marginBottom: 15,
	},
	pumpInfoCard: {
		width: '48%',
		backgroundColor: '#f8f9fa',
		borderRadius: 8,
		padding: 10,
		marginBottom: 8,
		borderWidth: 1,
		borderColor: '#e0e0e0',
	},
	pumpInfoLabel: {
		fontSize: 11,
		fontWeight: '600',
		color: '#666',
		marginBottom: 4,
	},
	pumpInfoValue: {
		fontSize: 13,
		fontWeight: 'bold',
		color: '#333',
	},
	setupButton: {
		backgroundColor: '#0066cc',
		paddingVertical: 12,
		paddingHorizontal: 20,
		borderRadius: 8,
		alignItems: 'center',
	},
	setupButtonText: {
		fontSize: 16,
		fontWeight: '600',
		color: '#fff',
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
	progressContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 40,
	},
	progressTitle: {
		fontSize: 24,
		fontWeight: 'bold',
		color: '#333',
		marginBottom: 10,
	},
	progressCocktailName: {
		fontSize: 20,
		fontWeight: '600',
		color: '#0066cc',
		marginBottom: 30,
		textAlign: 'center',
	},
	progressBarContainer: {
		width: '100%',
		height: 30,
		backgroundColor: '#e0e0e0',
		borderRadius: 15,
		overflow: 'hidden',
		marginBottom: 15,
	},
	progressBar: {
		height: '100%',
		backgroundColor: '#4CAF50',
		borderRadius: 15,
	},
	progressText: {
		fontSize: 32,
		fontWeight: 'bold',
		color: '#4CAF50',
		marginBottom: 10,
	},
	progressTime: {
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
		alignItems: 'stretch',
		justifyContent: 'space-between',
		gap: 15,
	},
	volumeColumn: {
		flex: 1,
	},
	actionColumn: {
		flex: 1,
		justifyContent: 'center',
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
		paddingVertical: 20,
		paddingHorizontal: 20,
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center',
		elevation: 3,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		minHeight: 150,
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
	stopButton: {
		flex: 1,
		backgroundColor: '#d32f2f',
		paddingVertical: 20,
		paddingHorizontal: 20,
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center',
		elevation: 3,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		minHeight: 150,
	},
	stopButtonDisabled: {
		backgroundColor: '#e0e0e0',
		elevation: 0,
	},
	stopButtonText: {
		fontSize: 20,
		fontWeight: 'bold',
		color: '#fff',
		textAlign: 'center',
	},
	stopButtonTextDisabled: {
		color: '#bbb',
	},
});
