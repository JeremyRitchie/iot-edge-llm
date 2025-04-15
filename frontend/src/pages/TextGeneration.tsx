import { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { Button, Container, ContentLayout, FormField, Header, Input, Link, SpaceBetween, TextContent } from "@cloudscape-design/components"
import { TextGenerationType, toggleInfoDrawerAtom, temperatureAtom, topPAtom, modelAtom, systemPromptAtom } from "../atoms/AppAtoms";
import { toast } from "react-toastify";
import { webSocketAtom } from "../atoms/WebSocketAtom";
import { useResetAtom } from "jotai/utils";
import { Metrics } from "../components/Metrics";


export const TextGeneration = () => {
    // Existing state
    const [, toggleInfoDrawer] = useAtom(toggleInfoDrawerAtom)
    const [inputValue, setInputValue] = useState("Tell me a joke");
    const [textResponse, setTextResponse] = useState("")
    const [generatedResponse, setGeneratedResponse] = useState<TextGenerationType | null>(null);
    const [pending, setPending] = useState(false)
    const [webSocket, setWebSocket] = useAtom(webSocketAtom)
    const resetWebsocket = useResetAtom(webSocketAtom)
    
    // Add these lines to access the temperature and topP values
    const [temperature] = useAtom(temperatureAtom);
    const [topP] = useAtom(topPAtom);
    const [model] = useAtom(modelAtom);
    
    // Add this line to access the system prompt
    const [systemPrompt] = useAtom(systemPromptAtom);

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
                    if (response.part) {
                        setTextResponse((text) => text + response.part)
                    } else {
                        setGeneratedResponse(response)
                        setPending(false)
                    }
                };
            }
        } catch (err) {
            console.log("🚀 ~ err:", err)
        }
    }, [webSocket])

    const handleGenerateText = () => {
        try {
            if (webSocket.ws) {
                setTextResponse("")
                setGeneratedResponse(null)
                setPending(true)
                webSocket.ws.send(JSON.stringify({
                    "opr": "textGeneration",
                    "prompt": inputValue,
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

    // const textGeneratorMutation = useMutation({
    //     mutationFn: () => generateText(inputValue),
    //     onSuccess: ({ data },) => {
    //         console.log("get success: ", data);
    //         setTextResponse(data)
    //     },
    //     onError: (err) => {
    //         console.log("get failed: ", err);
    //         toast.error("Unable to generate text. Try again later")
    //     }
    // })


    return (
        <ContentLayout
            header={
                <SpaceBetween size="m">
                    <Header
                        variant="h1"
                        info={<Link onFollow={toggleInfoDrawer} >Info</Link>}
                        description="Generate text from prompts even in a full offline mode."
                    >
                        Text Generation
                    </Header>


                </SpaceBetween>
            }
        >
            <SpaceBetween size="xl">
                <Container
                    header={
                        <Header
                            variant="h2"
                            description="Ask anything to the offline Gen-AI."
                        >
                            Enter a Prompt
                        </Header>
                    }
                >
                    <FormField
                        secondaryControl={<SpaceBetween direction="horizontal" size="m">
                            <Button iconName="close" onClick={() => {
                                setInputValue("")
                                setTextResponse("")
                                setGeneratedResponse(null)
                            }} disabled={webSocket.status === 'disconnected' || pending} />
                            <Button iconName="gen-ai" onClick={() => {
                                setGeneratedResponse(null)
                                handleGenerateText()
                            }} disabled={webSocket.status === 'disconnected'} loading={pending} />
                        </SpaceBetween>}
                    >
                        <Input
                            onKeyDown={({ detail }) => {
                                if (detail.key === 'Enter' && !detail.shiftKey) {
                                    setGeneratedResponse(null)
                                    handleGenerateText()
                                }
                            }}
                            disabled={pending}
                            value={inputValue}
                            placeholder="Write a poem about the moon."
                            onChange={event =>
                                setInputValue(event.detail.value)
                            }
                        />
                    </FormField>
                </Container>
                <Container
                    header={
                        <Header
                            variant="h2"
                        >
                            Response
                        </Header>
                    }
                >

                    <TextContent>
                        <div style={{ whiteSpace: 'pre-line' }}>
                            <p>{textResponse.length > 1 ? textResponse : "-"}</p>
                        </div>
                    </TextContent>
                </Container>
                <Metrics 
                    generatedResponse={generatedResponse} 
                    temperature={temperature}
                    topP={topP}
                />
            </SpaceBetween>
        </ContentLayout>
    )

}