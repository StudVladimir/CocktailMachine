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
    'Berry Splash': require('../../images/componentsDrinks/Berry Splash.png'),
    'Green Cooler': require('../../images/componentsDrinks/Green Cooler.png'),
    'Peach Summer': require('../../images/componentsDrinks/Peach Summer.png'),
    'Tropical Breeze': require('../../images/componentsDrinks/Tropical Breeze.png'),
    'Berry juice': require('../../images/componentsDrinks/Berry juice.png'),
    'Mint syrup': require('../../images/componentsDrinks/Mint syrup.png'),
    'Pineapple juice': require('../../images/componentsDrinks/Pineapple juice.png'),
    'Peach juice': require('../../images/componentsDrinks/Peach juice.png'),
    'Lemonade': require('../../images/componentsDrinks/Lemonade.png'),
    'Beer': require('../../images/componentsDrinks/Beer.png'),
    'Lemon Schweppes': require('../../images/componentsDrinks/Lemon Schweppes.png'),
    'Anastasia': require('../../images/componentsDrinks/Anastasia.png'),
    'Beer Mimosa': require('../../images/componentsDrinks/Beer Mimosa.png'),
    'Beer Peak': require('../../images/componentsDrinks/Beer Peak.png')
};

export function setDrinkImg(name: string) {
    // Возвращаем изображение из маппинга или иконку по умолчанию
    return imageMap[name] || require('../../assets/icon.png');
}