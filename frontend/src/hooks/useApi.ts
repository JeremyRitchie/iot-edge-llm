import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { ChatMessageType } from "../atoms/ChatAtoms";

export enum QUERY_KEYS {
    COLLECTIONS = "COLLECTIONS",
    ASSETS = "ASSETS",
    CHAT_SESSIONS = "CHAT_SESSIONS",
    CHATS = "CHATS"
}

export const apiClient = axios.create({
    baseURL: `http://${window.location.hostname}:8081/api/`,
    headers: {
        "Content-type": "application/json",
        "Access-Control-Allow-Origin": "*",
    }
});

/**
 * Generate Text API
 */

export const generateText = async (prompt: string) => {
    const response = await apiClient.post("/generate-text", {
        prompt,
        transactionID: Date.now()
    })
    console.log("resp: ", response.data);
    return response.data
}

/**
 * Generate Text API
 */

export const uploadFile = async (file: File) => {
    // create a new FormData object and append the file to it    
    const formData = new FormData();
    // formData.append("prompt", prompt)
    formData.append("file", file);
    const config = {
        headers: {
            'content-type': file.type,
        },
    }
    const response = await apiClient.post("/upload-file", formData, config)
    console.log("🚀 ~ uploadFile ~ response:", response.data)
    return response.data
}

/**
 * Chats API
 */

export const addChatMessage = async (chatMessage: ChatMessageType) => {
    const { data } = await apiClient.post("/db", {
        opr: "add",
        data: chatMessage,
    })
    return data.data
}

export const clearChats = async () => {
    const { data } = await apiClient.post("/db", {
        opr: "clear_chats",
        type: "chat"
    })
    return data.data
}


export const listChats = async () => {
    const { data } = await apiClient.post("/db", {
        opr: "chats",
        type: "chat",
    })
    console.log("🚀 ~ list chats ~ data:", data)
    return data.data
}

export const useListChat = () => {
    return useQuery<ChatMessageType[]>({
        queryKey: [QUERY_KEYS.CHATS],
        queryFn: () => listChats(),
    })
}

