import { atom } from 'jotai'
import { atomWithReset } from "jotai/utils"

export interface WebSocketAtomType {
    ws: WebSocket | null,
    status: 'connected' | 'disconnected' | 'pending'
}

export const webSocketAtom = atomWithReset<WebSocketAtomType>({
    ws: null,
    status: 'disconnected',
});
