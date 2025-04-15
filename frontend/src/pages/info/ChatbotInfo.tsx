import { Box, Drawer, Header, TextContent } from "@cloudscape-design/components"
import { ChatInfoAtom } from "../../atoms/ChatAtoms"
import { useAtom } from "jotai"
import { ChatInfo } from "./ChatInfo"

export const ChatbotInfo = () => {
    const [chatInfo] = useAtom(ChatInfoAtom)

    return (
        <div className="drawer-example">
            {chatInfo ? <ChatInfo /> :
                <Drawer header={<h2>Offline Chatbot</h2>}>
                    <Box margin={{ bottom: "l" }}>
                        <Header variant="h3">
                            Chat Sessions
                        </Header>
                        <TextContent>
                            <p>Generative AI-powered chat bots are driving the transformation of customer experience, enabling intuitive conversational interfaces that augment human capabilities across different business needs.</p>
                            <p>Add conversational interfaces driven by natural language processing and generative responses from LLMs that understand intent, maintain context, and pull answers from trusted knowledge sources.</p>
                        </TextContent>
                    </Box>
                </Drawer>}
        </div>
    )
}