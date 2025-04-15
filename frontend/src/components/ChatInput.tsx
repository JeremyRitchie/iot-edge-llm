import { Button, SpaceBetween, Textarea } from "@cloudscape-design/components";
import { useAtom } from "jotai";
import { ChatInfoAtom, chatMessageInputAtom } from "../atoms/ChatAtoms";
interface ChatInputProps {
    onSend: () => void;
    isDisabled: boolean;
}

export const ChatInput = (props: ChatInputProps) => {
    const [chatMessage, setChatMessage] = useAtom(chatMessageInputAtom)
    const [, setChatInfo] = useAtom(ChatInfoAtom)

    const handleSend = () => {
        props.onSend();
        setChatMessage("")
        setChatInfo(undefined)
    }
    return (
        <div
            style={{
                display: 'flex', flexDirection: 'row',
                alignContent: 'space-around',
            }}
        >

            <div style={{ flex: 1, padding: 10, alignContent: 'center', alignSelf: 'center' }} >
                <Textarea autoFocus
                    onKeyDown={({ detail }) => {
                        if (detail.key === 'Enter' && !detail.shiftKey) {
                            handleSend()
                        }
                    }}
                    disabled={props.isDisabled}
                    rows={2}
                    placeholder="Start a chat with the offline Gen-AI chatbot. for example - 'Hi How are you?'"
                    spellcheck
                    value={chatMessage}
                    onChange={({ detail }) => setChatMessage(detail.value)}
                />
            </div>
            <div style={{ padding: 10, alignContent: 'center', alignSelf: 'center', }} >
                {/* <MdSend size={30} color="hsl(167, 98%, 39%)" style={{ cursor: 'pointer', }} onClick={props.onSend} /> */}
                <SpaceBetween size={"s"} direction="horizontal">
                    <Button disabled={props.isDisabled || chatMessage.length < 3} variant="primary" onClick={handleSend} >Send</Button>
                </SpaceBetween>
            </div>
        </div>)
}