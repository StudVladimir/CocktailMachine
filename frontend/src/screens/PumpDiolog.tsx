import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity, Platform, ScrollView } from 'react-native';
import { fetchComponents } from '../requests/GetComponents';
import { Component } from '../types/Component';
import Card from './Card';
import { setDrinkImg } from '../services/setDrinkImg';
import strings from '../localize/string';

const isWeb = Platform.OS === 'web';

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
			<View style={[styles.container, isWeb && styles.containerWeb]}>
				<ActivityIndicator size="large" color="#0000ff" />
				<Text style={styles.subtitle}>{strings.pumpDialog.loadingComponents}</Text>
			</View>
		);
	}

	if (error) {
		return (
			<View style={[styles.container, isWeb && styles.containerWeb]}>
				<Text style={styles.title}>{strings.pumpDialog.error}</Text>
				<Text style={styles.subtitle}>{error}</Text>
				<View style={styles.buttonContainer}>
					<Button title={strings.pumpDialog.back} onPress={() => navigation.goBack()} />
				</View>
			</View>
		);
	}

	// Веб-версия
	if (isWeb) {
		return (
			<View style={styles.containerWeb}>
				<Text style={styles.titleWeb}>{strings.pumpDialog.title}</Text>
				<Text style={styles.subtitleWeb}>
					{strings.pumpDialog.selected} {selectedComponents.length}/{MAX_SELECTION}
				</Text>

				<ScrollView contentContainerStyle={styles.listContainerWeb}>
					{components.map((item) => {
						const selected = isComponentSelected(item._id);
						return (
							<TouchableOpacity 
								key={item._id}
								onPress={() => handleComponentPress(item)}
								activeOpacity={0.7}
								style={styles.cardTouchableWeb}
							>
								<View style={[
									styles.cardWrapperWeb,
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
					})}
					{components.length === 0 && (
						<Text style={styles.emptyText}>{strings.pumpDialog.noComponents}</Text>
					)}
				</ScrollView>

				<View style={styles.buttonContainerWeb}>
					<Button
						title={strings.pumpDialog.assignDrinks}
						onPress={() => {
							navigation.navigate('PumpSetup', { 
								selectedComponents: selectedComponents 
							});
						}}
						disabled={selectedComponents.length === 0}
					/>
					<View style={{ height: 10 }} />
					<Button
						title={strings.pumpDialog.back}
						onPress={() => navigation.goBack()}
						color="#666"
					/>
				</View>
			</View>
		);
	}

	// Мобильная версия
	return (
		<View style={styles.container}>
			<View style={[styles.header, isWeb && styles.headerWeb]}>
				<Text style={[styles.title, isWeb && styles.titleWeb]}>{strings.pumpDialog.title}</Text>
				<Text style={[styles.subtitle, isWeb && styles.subtitleWeb]}>
					{strings.pumpDialog.selected} {selectedComponents.length}/{MAX_SELECTION}
				</Text>
			</View>

			<FlatList
				data={components}
				keyExtractor={(item) => item._id}
				key={isWeb ? 'web-grid' : 'mobile-grid'}
				numColumns={isWeb ? 5 : 2}
				contentContainerStyle={[styles.listContainer, isWeb && styles.listContainerWeb]}
				renderItem={({ item }) => {
					const selected = isComponentSelected(item._id);
					return (
						<TouchableOpacity 
							onPress={() => handleComponentPress(item)}
							activeOpacity={0.7}
						>
							<View style={[
								styles.cardWrapper,
								isWeb && styles.cardWrapperWeb,
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
					<Text style={styles.emptyText}>{strings.pumpDialog.noComponents}</Text>
				}
			/>

			<View style={styles.buttonContainer}>
				<Button
					title={strings.pumpDialog.assignDrinks}
					onPress={() => {
						navigation.navigate('PumpSetup', { 
							selectedComponents: selectedComponents 
						});
					}}
					disabled={selectedComponents.length === 0}
				/>
				<View style={{ height: 10 }} />
				<Button
					title={strings.pumpDialog.back}
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
	containerWeb: {
		flex: 1,
		padding: 20,
		backgroundColor: '#f0f8ff',
		alignItems: 'center',
	},
	titleWeb: {
		fontSize: 22,
		fontWeight: 'bold',
		color: '#333',
		marginBottom: 10,
		textAlign: 'center',
	},
	subtitleWeb: {
		fontSize: 16,
		color: '#0066cc',
		fontWeight: '600',
		marginBottom: 20,
		textAlign: 'center',
	},
	listContainerWeb: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'center',
		maxWidth: 1200,
	},
	cardTouchableWeb: {
		width: 150,
		margin: 8,
	},
	cardWrapperWeb: {
		position: 'relative',
		borderRadius: 14,
		borderWidth: 3,
		borderColor: 'transparent',
	},
	buttonContainerWeb: {
		marginTop: 20,
		width: 300,
	},
	header: {
		marginBottom: 20,
	},
	headerWeb: {
		marginBottom: 10,
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
