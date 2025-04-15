import { ContentLayout, Header, Link, SpaceBetween } from "@cloudscape-design/components"
import { useAtom } from "jotai"
import { toggleInfoDrawerAtom } from "../atoms/AppAtoms"
import { ChatContainer } from "../components/ChatContainer"


export const ChatBot = () => {
    const [, toggleInfoDrawer] = useAtom(toggleInfoDrawerAtom)
    return (
        <ContentLayout
            header={
                <SpaceBetween size="m">
                    <Header
                        variant="h1"
                        info={<Link onFollow={toggleInfoDrawer} >Info</Link>}
                        description="Converse with an offline Gen-AI based chatbot."
                    >
                        Chatbot
                    </Header>
                </SpaceBetween>
            }
        >
            <SpaceBetween size="xl">
                <ChatContainer />

            </SpaceBetween>
        </ContentLayout>

    )
}