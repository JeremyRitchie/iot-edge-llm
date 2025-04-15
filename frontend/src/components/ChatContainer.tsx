import { useEffect, useMemo, useRef, useState } from "react";
import { Container, Header, SpaceBetween, Button, Box, Spinner } from "@cloudscape-design/components"
import { addChatMessage, clearChats, QUERY_KEYS, useListChat } from "../hooks/useApi"
import { ChatInput } from "./ChatInput";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { chatMessageInputAtom, ChatMessageType } from "../atoms/ChatAtoms";
import { useAtom } from "jotai";
import { ChatMessage } from "./ChatMessage";
import { useResetAtom } from "jotai/utils";
import { webSocketAtom } from "../atoms/WebSocketAtom";
import { temperatureAtom, topPAtom, modelAtom, systemPromptAtom } from "../atoms/AppAtoms";

export const ChatContainer = () => {
    const el = useRef<null | HTMLDivElement>(null);

    const queryClient = useQueryClient();
    const [chatMessage] = useAtom(chatMessageInputAtom)
    const [pending, setPending] = useState(false)
    const [webSocket, setWebSocket] = useAtom(webSocketAtom)
    const resetWebsocket = useResetAtom(webSocketAtom)
    const [textResponse, setTextResponse] = useState("")
    const { data, refetch } = useListChat();
    const [temperature] = useAtom(temperatureAtom);
    const [topP] = useAtom(topPAtom);
    const [model] = useAtom(modelAtom);
    const [systemPrompt] = useAtom(systemPromptAtom);

    const chats = useMemo(() => {
        if (textResponse !== "" && data && data.length > 0) {
            const chatMessages = [...data]
            const lastItem = chatMessages.pop()
            if (lastItem) {
                lastItem.bot = textResponse
                chatMessages.push(lastItem)
                return chatMessages
            }
        }
        return data
    }, [data, textResponse])

    useEffect(() => {
        try {
            if (webSocket.ws === null) {
                setWebSocket({
                    ...webSocket,
                    ws: new WebSocket(`ws://${window.location.hostname}:8081/ws`)
                })
            } else {
                webSocket.ws.onopen = (event) => {
                    toast.success("Connected to core device")
                    setWebSocket({
                        ...webSocket,
                        status: 'connected'
                    })
                }
                webSocket.ws.onclose = (event) => {
                    setWebSocket({
                        ws: null,
                        status: 'disconnected'
                    })
                }
                webSocket.ws.onmessage = ({ data }) => {
                    const response = JSON.parse(data)
                    if (response.status === 0) {
                        setTextResponse(response.part)
                    } else if (response.status === 1) {
                        setPending(false)
                        refetch()
                    }
                    scrollToEnd();
                };
            }
        } catch (err) {
            console.log("🚀 ~ err:", err)
        }
    }, [webSocket])



    const sendMessageMutation = useMutation({
        mutationFn: (chatMessage: ChatMessageType) => addChatMessage(chatMessage),
        onSuccess: (data: number) => {
            console.log("🚀 ~ ChatContainer ~ data:", data)
            // generateResponseMutation.mutate(data)
            handleGenerateText(data)
        },
        onError: (err) => {
            console.log("🚀 ~ ChatContainer ~ err:", err)

            toast("Message sending failed!", {
                type: "error"
            });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CHATS] })
            scrollToEnd();
        }

    })

    const clearChatsMutation = useMutation({
        mutationFn: () => clearChats(),
        onSuccess: (data) => {
            console.log("🚀 ~ clearChatsMutation ~ data:", data)
            refetch()
            scrollToEnd();
        },
        onError: (err) => {
            console.log("🚀 ~ clearChatsMutation ~ err:", err)
        },
    })


    const handleGenerateText = (id: number) => {
        try {
            if (webSocket.ws) {
                setTextResponse("")
                setPending(true)
                webSocket.ws.send(JSON.stringify({
                    "opr": "chat",
                    "id": id,
                    "parameters": {
                        "temperature": temperature,
                        "top_p": topP,
                        "model": model,
                        "system_prompt": systemPrompt
                    }
                }))
            }
        } catch (error) {
            setPending(false)
            resetWebsocket()
        }
    }

    const scrollToEnd = () => {
        if (el.current) {
            el.current.focus()
            el.current.scrollIntoView({ behavior: "auto", block: "end" })
            el.current.lastElementChild?.scrollIntoView({ behavior: "auto", block: "end" })
        }
    }
    return (
        <div>
            <Container header={
                <Header
                    variant="h2"
                    actions={
                        <SpaceBetween size="s" direction="horizontal">
                            <Button disabled={pending || clearChatsMutation.isPending}
                                loading={sendMessageMutation.isPending}
                                iconName="refresh" onClick={() => refetch()}>Refresh</Button>
                            <Button disabled={pending || sendMessageMutation.isPending}
                                loading={clearChatsMutation.isPending}
                                iconName="delete-marker"
                                onClick={() => clearChatsMutation.mutate()} >Clear Chat History</Button>
                            <Button iconName="angle-down" onClick={scrollToEnd}>Scroll to End</Button>
                        </SpaceBetween>
                    }
                >
                    Chat Messages
                </Header>
            } >
                <div
                    ref={el}
                    style={{
                        maxHeight: '90vh',
                        minHeight: '65vh',
                        display: 'flex',
                        flex: 1,
                        flexDirection: 'column',
                        overflow: 'auto',
                    }}>
                    {chats && chats.length > 0 && chats.map(chat => <ChatMessage key={chat.id} chat={chat}
                    />)}

                    <div style={{
                        display: 'flex', flex: 1,
                        color: "#00a4ef",
                        justifyContent: 'center',
                    }}>

                        {(sendMessageMutation.isPending) && <Spinner size="large" />}

                    </div>
                </div>
                <Box>
                    <ChatInput isDisabled={sendMessageMutation.isPending || pending || webSocket.status === 'disconnected'} onSend={() => {
                        sendMessageMutation.mutate({
                            id: Date.now(),
                            type: "chat",
                            human: chatMessage,
                            bot: "...",
                            metrics: {
                                model: "",
                                temperature: 0,
                                top_p: 0,
                                total_duration: 0,
                                load_duration: 0,
                                prompt_eval_duration: 0,
                                eval_count: 0,
                                eval_duration: 0,
                            }
                        })
                    }} />
                </Box>
            </Container>
        </div>
    )
}