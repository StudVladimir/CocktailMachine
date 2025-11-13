import en from "./en.json";
import fi from "./fin.json";
import LocalizedStrings, { type LocalizedStringsMethods } from "localized-strings";

/**
 * Localized strings
 */
export interface Localized extends LocalizedStringsMethods {
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
}