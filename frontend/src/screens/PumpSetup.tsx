import React, { useState } from 'react';
import { 
	View, 
	Text, 
	StyleSheet, 
	Image, 
	PanResponder, 
	Animated,
	Dimensions,
	TouchableOpacity,
	Platform,
	ScrollView
} from 'react-native';
import { Component } from '../types/Component';
import { setDrinkImg } from '../services/setDrinkImg';
import { usePumps } from '../context/PumpContext';
import strings from '../localize/string';

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 60) / 4; // 4 карточки с отступами
const isWeb = Platform.OS === 'web';

interface DraggableCardProps {
	component: Component;
	onDragEnd: (component: Component, x: number, y: number) => void;
	isSelected?: boolean;
	onSelect?: (component: Component) => void;
}

function DraggableCard({ component, onDragEnd, isSelected, onSelect }: DraggableCardProps) {
	const pan = new Animated.ValueXY();
	const [isDragging, setIsDragging] = useState(false);

	// Для веба используем простой клик
	if (isWeb) {
		return (
			<TouchableOpacity
				onPress={() => onSelect && onSelect(component)}
				style={[
					styles.draggableCard,
					isSelected && styles.selectedCard
				]}
			>
				<Image source={setDrinkImg(component.name)} style={styles.cardImage} resizeMode="cover" />
				<Text style={styles.cardName} numberOfLines={2}>{component.name}</Text>
				{isSelected && (
					<View style={styles.selectedBadge}>
						<Text style={styles.selectedBadgeText}>✓</Text>
					</View>
				)}
			</TouchableOpacity>
		);
	}

	// Для мобильных используем drag and drop
	const panResponder = PanResponder.create({
		onStartShouldSetPanResponder: () => true,
		onPanResponderGrant: () => {
			setIsDragging(true);
		},
		onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
			useNativeDriver: false,
		}),
		onPanResponderRelease: (e, gesture) => {
			setIsDragging(false);
			const dropX = gesture.moveX;
			const dropY = gesture.moveY;
			onDragEnd(component, dropX, dropY);
			Animated.spring(pan, {
				toValue: { x: 0, y: 0 },
				useNativeDriver: false,
			}).start();
		},
	});

	return (
		<Animated.View
			{...panResponder.panHandlers}
			style={[
				styles.draggableCard,
				{
					transform: [{ translateX: pan.x }, { translateY: pan.y }],
					opacity: isDragging ? 0.7 : 1,
					zIndex: isDragging ? 1000 : 1,
				},
			]}
		>
			<Image source={setDrinkImg(component.name)} style={styles.cardImage} resizeMode="cover" />
			<Text style={styles.cardName} numberOfLines={2}>{component.name}</Text>
		</Animated.View>
	);
}

export default function PumpSetup({ route, navigation }: any) {
	const { selectedComponents } = route.params;
	const { pump1, pump2, pump3, pump4, setPump1, setPump2, setPump3, setPump4 } = usePumps();

	// Позиции drop зон (будут установлены через onLayout)
	const [dropZones, setDropZones] = useState<{ [key: string]: { x: number; y: number; width: number; height: number } }>({});
	
	// Для веб-версии: выбранный компонент для назначения
	const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);

	// Получаем список доступных компонентов (те, что еще не назначены)
	const getAvailableComponents = () => {
		const assignedIds = [pump1?._id, pump2?._id, pump3?._id, pump4?._id].filter(Boolean);
		return selectedComponents.filter((comp: Component) => !assignedIds.includes(comp._id));
	};

	// Проверяем, все ли компоненты назначены
	const allAssigned = getAvailableComponents().length === 0 && selectedComponents.length > 0;

	const handleDrop = (component: Component, x: number, y: number) => {
		let closestPump = '';
		let minDistance = Infinity;
		let foundTopRow = false;
		
		// Сначала проверяем, попадает ли точка внутрь какой-либо зоны
		let foundDirectHit = false;
		
		Object.keys(dropZones).forEach((key) => {
			const zone = dropZones[key];
			
			// Определяем, верхний это насос или нижний (по Y координате)
			const isTopRow = zone.y < 200;
			
			// Для верхних насосов: больше расширение вверх и вниз
			// Для нижних насосов: меньше расширение вверх, больше вниз
			const paddingTop = isTopRow ? 60 : 5;
			const paddingSide = 20;
			const paddingBottom = isTopRow ? 40 : 10;
			
			const isInZone = 
				x >= zone.x - paddingSide &&
				x <= zone.x + zone.width + paddingSide &&
				y >= zone.y - paddingTop &&
				y <= zone.y + zone.height + paddingBottom;
			
			if (isInZone) {
				// Точка внутри зоны - вычисляем расстояние до центра
				const zoneCenterX = zone.x + zone.width / 2;
				const zoneCenterY = zone.y + zone.height / 2;
				const distance = Math.sqrt(
					Math.pow(x - zoneCenterX, 2) + Math.pow(y - zoneCenterY, 2)
				);
				
				// Если уже нашли верхний ряд, игнорируем нижний ряд
				if (foundTopRow && !isTopRow) {
					return;
				}
				
				// Если это верхний ряд и мы еще не нашли верхний ряд, сбрасываем результаты
				if (isTopRow && !foundTopRow) {
					minDistance = Infinity;
					foundTopRow = true;
				}
				
				if (distance < minDistance) {
					minDistance = distance;
					closestPump = key;
					foundDirectHit = true;
				}
			}
		});
		
		// Если точка не попала ни в одну зону, ищем ближайшую
		if (!foundDirectHit) {
			Object.keys(dropZones).forEach((key) => {
				const zone = dropZones[key];
				const zoneCenterX = zone.x + zone.width / 2;
				const zoneCenterY = zone.y + zone.height / 2;
				const distance = Math.sqrt(
					Math.pow(x - zoneCenterX, 2) + Math.pow(y - zoneCenterY, 2)
				);
				
				const maxDistance = Math.max(zone.width, zone.height) * 1.5;
				if (distance <= maxDistance && distance < minDistance) {
					minDistance = distance;
					closestPump = key;
				}
			});
		}
		
		// Назначаем компонент на ближайший насос
		if (closestPump) {
			switch (closestPump) {
				case 'pump1':
					setPump1(component);
					break;
				case 'pump2':
					setPump2(component);
					break;
				case 'pump3':
					setPump3(component);
					break;
				case 'pump4':
					setPump4(component);
					break;
			}
		}
	};

	// Обработчик клика на насос (для веб-версии)
	const handlePumpClick = (pumpKey: string) => {
		if (!isWeb || !selectedComponent) return;
		
		switch (pumpKey) {
			case 'pump1':
				setPump1(selectedComponent);
				break;
			case 'pump2':
				setPump2(selectedComponent);
				break;
			case 'pump3':
				setPump3(selectedComponent);
				break;
			case 'pump4':
				setPump4(selectedComponent);
				break;
		}
		
		// Сбрасываем выбор после назначения
		setSelectedComponent(null);
	};

	const renderPumpSlot = (pumpNumber: number, pumpValue: Component | null, pumpKey: string) => {
		const slotContent = (
			<View
				style={[styles.pumpSlot, !isWeb && styles.pumpSlotMobile]}
				onLayout={(event) => {
					// Используем measure для получения абсолютных координат на экране
					event.target.measure((x, y, width, height, pageX, pageY) => {
						setDropZones((prev) => ({
							...prev,
							[pumpKey]: { x: pageX, y: pageY, width, height },
						}));
					});
				}}
			>
				<Text style={styles.pumpLabel}>{strings.pumpSetup.pump} {pumpNumber}</Text>
				{pumpValue ? (
					<View style={styles.assignedComponent}>
						<Image source={setDrinkImg(pumpValue.name)} style={styles.assignedImage} resizeMode="cover" />
						<Text style={styles.assignedName} numberOfLines={2}>{pumpValue.name}</Text>
					</View>
				) : (
					<View style={styles.emptySlot}>
						<Text style={styles.emptySlotText}>{strings.pumpSetup.dragHere}</Text>
					</View>
				)}
			</View>
		);

		// Для веба оборачиваем в TouchableOpacity
		if (isWeb) {
			return (
				<TouchableOpacity 
					key={pumpKey}
					onPress={() => handlePumpClick(pumpKey)}
					style={[
						styles.pumpSlotWrapper,
						selectedComponent && styles.pumpSlotClickable
					]}
				>
					{slotContent}
				</TouchableOpacity>
			);
		}
		
		// Для мобильных возвращаем в обёртке для сетки 2x2
		return (
			<View key={pumpKey} style={styles.pumpSlotWrapperMobile}>
				{slotContent}
			</View>
		);
	};

	const availableComponents = getAvailableComponents();

	// Веб-версия: горизонтальный layout
	if (isWeb) {
		return (
			<View style={styles.containerWeb}>
				{/* Левая панель: Pump Slots */}
				<View style={styles.leftPanelWeb}>
					<Text style={styles.panelTitleWeb}>{strings.pumpSetup.title}</Text>
					<Text style={styles.panelSubtitleWeb}>{strings.pumpSetup.subtitle}</Text>
					
					{/* Drop зоны для насосов */}
					<View style={styles.pumpsContainerWeb}>
						{renderPumpSlot(1, pump1, 'pump1')}
						{renderPumpSlot(2, pump2, 'pump2')}
						{renderPumpSlot(3, pump3, 'pump3')}
						{renderPumpSlot(4, pump4, 'pump4')}
					</View>

					{/* Кнопка "Готово" появляется когда все назначены */}
					{allAssigned && (
						<TouchableOpacity 
							style={styles.doneButtonWeb}
							onPress={() => {
								navigation.navigate('Main');
							}}
						>
							<Text style={styles.doneButtonText}>{strings.pumpSetup.done}</Text>
						</TouchableOpacity>
					)}
				</View>

				{/* Правая панель: Available Drinks */}
				<View style={styles.rightPanelWeb}>
					{availableComponents.length > 0 ? (
						<>
							<Text style={styles.panelTitleWeb}>{strings.pumpSetup.availableDrinks}</Text>
							<Text style={styles.webInstructionsMain}>
								Click on a drink to select it, then click on a pump slot to assign
							</Text>
							{selectedComponent && (
								<View style={styles.selectedInfoContainer}>
									<Text style={styles.selectedInfoText}>
										Selected: <Text style={styles.selectedInfoName}>{selectedComponent.name}</Text>
									</Text>
									<Text style={styles.selectedInfoSubtext}>Click on a pump to assign</Text>
								</View>
							)}
							<ScrollView contentContainerStyle={styles.componentsContainerWeb}>
								{availableComponents.map((component: Component) => (
									<DraggableCard
										key={component._id}
										component={component}
										onDragEnd={handleDrop}
										isSelected={selectedComponent?._id === component._id}
										onSelect={setSelectedComponent}
									/>
								))}
							</ScrollView>
						</>
					) : (
						<Text style={styles.panelTitleWeb}>{strings.pumpSetup.allAssigned}</Text>
					)}
				</View>
			</View>
		);
	}

	// Мобильная версия (без изменений)
	return (
		<View style={styles.container}>
			<Text style={styles.title}>{strings.pumpSetup.title}</Text>
			<Text style={styles.subtitle}>{strings.pumpSetup.subtitle}</Text>

			{/* Drop зоны для насосов */}
			<View style={styles.pumpsContainer}>
				{renderPumpSlot(1, pump1, 'pump1')}
				{renderPumpSlot(2, pump2, 'pump2')}
				{renderPumpSlot(3, pump3, 'pump3')}
				{renderPumpSlot(4, pump4, 'pump4')}
			</View>

			{/* Разделитель */}
			<View style={styles.divider} />

			{/* Выбранные компоненты для перетаскивания */}
			{availableComponents.length > 0 ? (
				<>
					<Text style={styles.sectionTitle}>{strings.pumpSetup.availableDrinks}</Text>
					<View style={styles.componentsContainer}>
						{availableComponents.map((component: Component) => (
							<DraggableCard
								key={component._id}
								component={component}
								onDragEnd={handleDrop}
								isSelected={selectedComponent?._id === component._id}
								onSelect={setSelectedComponent}
							/>
						))}
					</View>
				</>
			) : (
				<Text style={styles.sectionTitle}>{strings.pumpSetup.allAssigned}</Text>
			)}

			{/* Кнопка "Готово" появляется когда все назначены */}
			{allAssigned && (
				<View style={styles.doneButtonContainer}>
					<TouchableOpacity 
					style={styles.doneButtonTouchable}
					onPress={() => {
						navigation.navigate('Main');
					}}
					>
						<Text style={styles.doneButton}>{strings.pumpSetup.done}</Text>
					</TouchableOpacity>
				</View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	// Мобильные стили
	container: {
		flex: 1,
		padding: 20,
		backgroundColor: '#f0f8ff',
	},
	// Веб стили
	containerWeb: {
		flexDirection: 'row',
		padding: 15,
		backgroundColor: '#f0f8ff',
		height: '100%',
	},
	leftPanelWeb: {
		width: 400,
		backgroundColor: '#fff',
		borderRadius: 12,
		padding: 15,
		marginRight: 15,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	rightPanelWeb: {
		flex: 1,
		backgroundColor: '#fff',
		borderRadius: 12,
		padding: 15,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	panelTitleWeb: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#333',
		marginBottom: 10,
		textAlign: 'center',
	},
	panelSubtitleWeb: {
		fontSize: 14,
		color: '#666',
		marginBottom: 15,
		textAlign: 'center',
	},
	pumpsContainerWeb: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
		marginBottom: 15,
	},
	webInstructionsMain: {
		fontSize: 13,
		color: '#2196F3',
		textAlign: 'center',
		marginBottom: 10,
		fontStyle: 'italic',
	},
	componentsContainerWeb: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'flex-start',
	},
	doneButtonWeb: {
		backgroundColor: '#4CAF50',
		paddingVertical: 12,
		borderRadius: 8,
		alignItems: 'center',
	},
	doneButtonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: 'bold',
	},
	// Мобильные стили (оригинальные)
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 10,
		color: '#333',
		textAlign: 'center',
	},
	subtitle: {
		fontSize: 16,
		marginBottom: 20,
		color: '#666',
		textAlign: 'center',
	},
	selectedInfoContainer: {
		backgroundColor: '#E3F2FD',
		padding: 12,
		borderRadius: 8,
		marginBottom: 15,
		borderLeftWidth: 4,
		borderLeftColor: '#2196F3',
	},
	selectedInfoText: {
		fontSize: 16,
		color: '#333',
		marginBottom: 4,
	},
	selectedInfoName: {
		fontWeight: 'bold',
		color: '#2196F3',
	},
	selectedInfoSubtext: {
		fontSize: 14,
		color: '#666',
		fontStyle: 'italic',
	},
	pumpsContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
		marginBottom: 20,
	},
	pumpSlotWrapperMobile: {
		width: '48%',
		marginBottom: 15,
	},
	pumpSlotWrapper: {
		width: '48%',
		marginBottom: 15,
		...(isWeb && {
			cursor: 'pointer',
			transition: 'all 0.2s ease',
		}),
	},
	pumpSlotClickable: {
		opacity: 0.9,
		...(isWeb && {
			cursor: 'pointer',
		}),
	},
	pumpSlot: {
		width: '100%',
		backgroundColor: '#fff',
		borderRadius: 12,
		padding: 10,
		borderWidth: 2,
		borderColor: '#ddd',
		borderStyle: 'dashed',
	},
	pumpSlotMobile: {
		minHeight: 150,
	},
	pumpLabel: {
		fontSize: 14,
		fontWeight: 'bold',
		color: '#333',
		marginBottom: 8,
		textAlign: 'center',
	},
	emptySlot: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#f5f5f5',
		borderRadius: 8,
	},
	emptySlotText: {
		fontSize: 12,
		color: '#999',
		textAlign: 'center',
	},
	assignedComponent: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#E8F5E9',
		borderRadius: 8,
		padding: 8,
	},
	assignedImage: {
		width: 70,
		height: 70,
		borderRadius: 8,
		marginBottom: 8,
	},
	assignedName: {
		fontSize: 12,
		fontWeight: '600',
		color: '#333',
		textAlign: 'center',
	},
	divider: {
		height: 2,
		backgroundColor: '#ddd',
		marginVertical: 20,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#333',
		marginBottom: 15,
		textAlign: 'center',
	},
	componentsContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-around',
	},
	draggableCard: {
		width: CARD_SIZE,
		backgroundColor: '#fff',
		borderRadius: 12,
		padding: 8,
		margin: 5,
		alignItems: 'center',
		shadowColor: '#000',
		shadowOpacity: 0.15,
		shadowRadius: 8,
		elevation: 5,
		borderWidth: 2,
		borderColor: '#4CAF50',
		position: 'relative',
		...(isWeb && {
			cursor: 'pointer',
			transition: 'all 0.2s ease',
		}),
	},
	selectedCard: {
		borderColor: '#2196F3',
		borderWidth: 3,
		backgroundColor: '#E3F2FD',
		...(isWeb && {
			boxShadow: '0 4px 12px rgba(33, 150, 243, 0.4)',
		}),
	},
	selectedBadge: {
		position: 'absolute',
		top: 5,
		right: 5,
		backgroundColor: '#2196F3',
		borderRadius: 12,
		width: 24,
		height: 24,
		justifyContent: 'center',
		alignItems: 'center',
	},
	selectedBadgeText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: 'bold',
	},
	cardImage: {
		width: CARD_SIZE - 20,
		height: CARD_SIZE - 20,
		borderRadius: 8,
		marginBottom: 5,
	},
	cardName: {
		fontSize: 11,
		fontWeight: '600',
		textAlign: 'center',
		color: '#333',
	},
	doneButtonContainer: {
		marginTop: 30,
		alignItems: 'center',
	},
	doneButtonTouchable: {
		backgroundColor: '#4CAF50',
		paddingVertical: 15,
		paddingHorizontal: 60,
		borderRadius: 25,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.3,
		shadowRadius: 4,
		elevation: 5,
	},
	doneButton: {
		color: '#fff',
		fontSize: 18,
		fontWeight: 'bold',
		textAlign: 'center',
	},
});
