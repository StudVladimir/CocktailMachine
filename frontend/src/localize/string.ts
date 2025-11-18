import en from "./en.json";
import fi from "./fin.json";
import ru from "./ru.json";
import vie from "./vie.json";
import de from "./de.json";
import LocalizedStrings from "localized-strings";

/**
 * Localized strings interface
 */
export interface IStrings {
  /**
   * Translations related to generic words
   */
  placeHolder: {
    notYetImplemented: string;
    pleaseWait: string;
  };
  label: {
    currentLocaleLabel: string;
    cancel: string;
    save: string;
    back: string;
  };
  languagePicker: {
    selectLanguage: string;
  };
  main: {
    pump: string;
    notAssigned: string;
    setupDrinks: string;
    loadingCocktails: string;
    tryAgain: string;
    availableCocktails: string;
    noCocktailsTitle: string;
    noCocktailsText: string;
    volume: string;
    make: string;
    selectCocktail: string;
    stop: string;
    preparingCocktail: string;
    sec: string;
  };
  pumpDialog: {
    title: string;
    selected: string;
    loadingComponents: string;
    error: string;
    back: string;
    noComponents: string;
    assignDrinks: string;
    cancel: string;
  };
  pumpSetup: {
    title: string;
    subtitle: string;
    pump: string;
    dragHere: string;
    availableDrinks: string;
    allAssigned: string;
    done: string;
  };
}

/**
 * Initialized localized strings
 */
const strings = new LocalizedStrings({ en: en, fi: fi, ru: ru, vie: vie, de: de });

export default strings as LocalizedStrings & IStrings;