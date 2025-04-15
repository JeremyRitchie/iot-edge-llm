import { atom } from 'jotai'
import { Mode } from '@cloudscape-design/global-styles';

export const AppName = "Raspberry Pi Localized LLMs";

// Theme atom
export const themeAtom = atom<Mode>(Mode.Light);
export const toggleThemeAtom = atom(null, (get, set) => set(themeAtom, get(themeAtom) === Mode.Light ? Mode.Dark : Mode.Light));

// left side nav drawer
export const navDrawerAtom = atom(true);


// right side info panel drawer
export const infoDrawerAtom = atom(false);
export const openInfoDrawerAtom = atom(null, (_, set) =>
    set(infoDrawerAtom, true));
export const closeInfoDrawerAtom = atom(null, (_, set) =>
    set(infoDrawerAtom, false));
export const toggleInfoDrawerAtom = atom(null, (get, set) =>
    set(infoDrawerAtom, !get(infoDrawerAtom)));

// Near the other atom definitions
// LLM Configuration parameters
export const temperatureAtom = atom<number>(0.7); // Default value of 0.7
export const topPAtom = atom<number>(0.9); // Default value of 0.9

// Model selection
export const modelAtom = atom<string>("qwen3:1.7b");

export enum HelpPanelTitle {
    EMPTY = "EMPTY"
}
export const infoIdAtom = atom<HelpPanelTitle>(HelpPanelTitle.EMPTY);

export type TextGenerationType =
    {
        "model": string;
        "created_at": string;
        "response": string;
        "done": boolean;
        "total_duration": number;
        "load_duration": number;
        "prompt_eval_count": number;
        "prompt_eval_duration": number;
        "eval_count": number;
        "eval_duration": number;
    }

// Add this near other atom definitions (around line 25-28)
export const systemPromptAtom = atom<string>("/no_think - You are a helpful AI assistant. Answer questions accurately and concisely.");