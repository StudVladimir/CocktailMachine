// Маппинг изображений компонентов
const imageMap: { [key: string]: any } = {
    'Cola': require('../../images/componentsDrinks/Cola.png'),
    'Energy drink': require('../../images/componentsDrinks/Energy drink.png'),
    'Gin': require('../../images/componentsDrinks/Gin.png'),
    'Grenadine syrup': require('../../images/componentsDrinks/Grenadine syrup.png'),
    'Jagermeister': require('../../images/componentsDrinks/Jagermeister.png'),
    'Lemon juice': require('../../images/componentsDrinks/Lemon juice.png'),
    'Lime juice': require('../../images/componentsDrinks/Lime juice.png'),
    'Orange juice': require('../../images/componentsDrinks/Orange juice.png'),
    'Rum': require('../../images/componentsDrinks/Rum.png'),
    'Soda water': require('../../images/componentsDrinks/Soda water.png'),
    'Sugar syrup': require('../../images/componentsDrinks/Sugar syrup.png'),
    'Tequila': require('../../images/componentsDrinks/Tequila.png'),
    'Tonic water': require('../../images/componentsDrinks/Tonic water.png'),
    'Vodka': require('../../images/componentsDrinks/Vodka.png'),
    'Water': require('../../images/componentsDrinks/Water.png'),
    'Whiskey': require('../../images/componentsDrinks/Whiskey.png'),
    'Jagerbomb': require('../../images/componentsDrinks/Jagerbomb.png'),
    'Rum Cola': require('../../images/componentsDrinks/Rum Cola.png'),
};

export function setDrinkImg(name: string) {
    // Возвращаем изображение из маппинга или иконку по умолчанию
    return imageMap[name] || require('../../assets/icon.png');
}