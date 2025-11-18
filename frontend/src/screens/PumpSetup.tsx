import React, { useState } from 'react';
import { 
	View, 
	Text, 
	StyleSheet, 
	Image, 
	PanResponder, 
	Animated,
	Dimensions,
	TouchableOpacity
} from 'react-native';
import { Component } from '../types/Component';
import { setDrinkImg } from '../services/setDrinkImg';
import { usePumps } from '../context/PumpContext';
import strings from '../localize/string';

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 60) / 4; // 4 карточки с отступами

interface DraggableCardProps {
	component: Component;
	onDragEnd: (component: Component, x: number, y: number) => void;
}

function DraggableCard({ component, onDragEnd }: DraggableCardProps) {
	const pan = new Animated.ValueXY();
	const [isDragging, setIsDragging] = useState(false);

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

	// Получаем список доступных компонентов (те, что еще не назначены)
	const getAvailableComponents = () => {
		const assignedIds = [pump1?._id, pump2?._id, pump3?._id, pump4?._id].filter(Boolean);
		return selectedComponents.filter((comp: Component) => !assignedIds.includes(comp._id));
	};

	// Проверяем, все ли компоненты назначены
	const allAssigned = getAvailableComponents().length === 0 && selectedComponents.length > 0;

	const handleDrop = (component: Component, x: number, y: number) => {
		console.log('Drop coordinates:', { x, y });
		console.log('Drop zones:', dropZones);
		
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
			
			console.log(`Checking ${key}:`, {
				zoneX: zone.x,
				zoneY: zone.y,
				zoneWidth: zone.width,
				zoneHeight: zone.height,
				dropX: x,
				dropY: y,
				isTopRow,
				expandedZone: {
					xMin: zone.x - paddingSide,
					xMax: zone.x + zone.width + paddingSide,
					yMin: zone.y - paddingTop,
					yMax: zone.y + zone.height + paddingBottom
				},
				inBounds: isInZone
			});
			
			if (isInZone) {
				// Точка внутри зоны - вычисляем расстояние до центра
				const zoneCenterX = zone.x + zone.width / 2;
				const zoneCenterY = zone.y + zone.height / 2;
				const distance = Math.sqrt(
					Math.pow(x - zoneCenterX, 2) + Math.pow(y - zoneCenterY, 2)
				);
				
				console.log(`${key} is a candidate, distance: ${distance}`);
				
				// Если уже нашли верхний ряд, игнорируем нижний ряд
				if (foundTopRow && !isTopRow) {
					console.log(`Ignoring ${key} because top row already found`);
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
			console.log('No direct hit, finding closest zone');
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
			console.log(`Assigning to ${closestPump}`);
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
			console.log(`Component ${component.name} assigned to ${closestPump}`);
		} else {
			console.log('No pump found for drop');
		}
	};

	const renderPumpSlot = (pumpNumber: number, pumpValue: Component | null, pumpKey: string) => {
		return (
			<View
				style={styles.pumpSlot}
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
	};

	const availableComponents = getAvailableComponents();

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
						console.log('Saved pumps before navigation:', {
							pump1: pump1?.name,
							pump2: pump2?.name,
							pump3: pump3?.name,
							pump4: pump4?.name,
						});
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
	container: {
		flex: 1,
		padding: 20,
		backgroundColor: '#f0f8ff',
	},
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
	pumpsContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
		marginBottom: 20,
	},
	pumpSlot: {
		width: '48%',
		height: 140,
		marginBottom: 15,
		backgroundColor: '#fff',
		borderRadius: 12,
		padding: 10,
		borderWidth: 2,
		borderColor: '#ddd',
		borderStyle: 'dashed',
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
		padding: 5,
	},
	assignedImage: {
		width: 60,
		height: 60,
		borderRadius: 8,
		marginBottom: 5,
	},
	assignedName: {
		fontSize: 11,
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
