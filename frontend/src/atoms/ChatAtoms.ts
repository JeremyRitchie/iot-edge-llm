import { atom } from "jotai";
import { atomWithReset } from 'jotai/utils';

export type ChatMessageType = {
    id: number;
    type: "chat",
    human: string;
    bot: string;
    metrics: {
        model: string;
        temperature: number;
        top_p: number;
        total_duration: number;
        load_duration: number;
        prompt_eval_duration: number;
        eval_count: number;
        eval_duration: number;
    }
}


export const chatMessageInputAtom = atomWithReset("")
export const ChatInfoAtom = atom<ChatMessageType | undefined>(undefined)
