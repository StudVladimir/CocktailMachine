import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity } from 'react-native';
import { fetchComponents } from '../requests/GetComponents';
import { Component } from '../types/Component';
import Card from './Card';
import { setDrinkImg } from '../services/setDrinkImg';

export default function PumpDialog({ navigation }: any) {
	const [components, setComponents] = useState<Component[]>([]);
	const [selectedComponents, setSelectedComponents] = useState<Component[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	const MAX_SELECTION = 4;

	const handleComponentPress = (component: Component) => {
		const isSelected = selectedComponents.some(item => item._id === component._id);
		
		if (isSelected) {
			// Убираем компонент из выбранных
			setSelectedComponents(prev => prev.filter(item => item._id !== component._id));
		} else {
			// Добавляем компонент, если не достигнут лимит
			if (selectedComponents.length < MAX_SELECTION) {
				setSelectedComponents(prev => [...prev, component]);
			}
		}
	};

	const isComponentSelected = (componentId: string) => {
		return selectedComponents.some(item => item._id === componentId);
	};

	useEffect(() => {
		const loadComponents = async () => {
			try {
				setLoading(true);
				const data = await fetchComponents();
				setComponents(data);
				console.log('Fetched components:', data);
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Error loading components');
				console.error('Error loading components:', err);
			} finally {
				setLoading(false);
			}
		};

		loadComponents();
	}, []);

	if (loading) {
		return (
			<View style={styles.container}>
				<ActivityIndicator size="large" color="#0000ff" />
				<Text style={styles.subtitle}>Loading components... </Text>
			</View>
		);
	}

	if (error) {
		return (
			<View style={styles.container}>
				<Text style={styles.title}>❌ Error ❌</Text>
				<Text style={styles.subtitle}>{error}</Text>
				<View style={styles.buttonContainer}>
					<Button title="Back" onPress={() => navigation.goBack()} />
				</View>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Диалог настройки насосов</Text>
			<Text style={styles.subtitle}>
				Выбрано: {selectedComponents.length}/{MAX_SELECTION}
			</Text>

			<FlatList
				data={components}
				keyExtractor={(item) => item._id}
				numColumns={2}
				contentContainerStyle={styles.listContainer}
				renderItem={({ item }) => {
					const selected = isComponentSelected(item._id);
					return (
						<TouchableOpacity 
							onPress={() => handleComponentPress(item)}
							activeOpacity={0.7}
						>
							<View style={[
								styles.cardWrapper,
								selected && styles.cardSelected
							]}>
								<Card
									imageSrc={setDrinkImg(item.name)}
									name={item.name}
								/>
								{selected && (
									<View style={styles.selectionBadge}>
										<Text style={styles.selectionBadgeText}>✓</Text>
									</View>
								)}
							</View>
						</TouchableOpacity>
					);
				}}
				ListEmptyComponent={
					<Text style={styles.emptyText}>Нет доступных компонентов</Text>
				}
			/>

			<View style={styles.buttonContainer}>
				<Button
					title="Подписать напитки"
					onPress={() => {
						navigation.navigate('PumpSetup', { 
							selectedComponents: selectedComponents 
						});
					}}
					disabled={selectedComponents.length === 0}
				/>
				<View style={{ height: 10 }} />
				<Button
					title="Назад"
					onPress={() => navigation.goBack()}
					color="#666"
				/>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 20,
		backgroundColor: '#f0f8ff',
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
		fontSize: 18,
		marginBottom: 20,
		color: '#0066cc',
		fontWeight: '600',
		textAlign: 'center',
	},
	listContainer: {
		paddingBottom: 20,
	},
	emptyText: {
		fontSize: 16,
		color: '#999',
		textAlign: 'center',
		marginTop: 40,
	},
	cardWrapper: {
		position: 'relative',
		borderRadius: 14,
		borderWidth: 3,
		borderColor: 'transparent',
		margin: 1,
	},
	cardSelected: {
		borderColor: '#4CAF50',
		backgroundColor: '#E8F5E9',
	},
	selectionBadge: {
		position: 'absolute',
		top: 5,
		right: 5,
		backgroundColor: '#4CAF50',
		borderRadius: 15,
		width: 30,
		height: 30,
		justifyContent: 'center',
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.3,
		shadowRadius: 3,
		elevation: 5,
	},
	selectionBadgeText: {
		color: '#fff',
		fontSize: 18,
		fontWeight: 'bold',
	},
	buttonContainer: {
		marginTop: 20,
		marginBottom: 10,
		width: '100%',
	},
});
