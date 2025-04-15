import { Box, Button, Container, ExpandableSection } from "@cloudscape-design/components";
import { ChatInfoAtom, ChatMessageType } from "../atoms/ChatAtoms";
import { BsFilePersonFill } from "react-icons/bs";
import { RiRobot2Line } from "react-icons/ri";
import { useAtom } from "jotai";
import { openInfoDrawerAtom } from "../atoms/AppAtoms";

interface ChatMessageProps {
    chat: ChatMessageType
}
export const ChatMessage = (props: ChatMessageProps) => {
    const { chat } = props
    const [, openInfoDrawer] = useAtom(openInfoDrawerAtom)
    const [, setChatInfo] = useAtom(ChatInfoAtom)

    return (
        <div>
            <div
                style={{
                    display: 'flex', flexDirection: 'row',
                    alignContent: 'space-around', padding: 10,
                }}
            >
                <div style={{
                    flex: 1, padding: 10, alignContent: 'center', alignSelf: 'center',
                    marginLeft: "40%",
                    marginRight: 0,
                }} >
                    <Container >
                        {chat.human}
                    </Container>
                </div>
                <div style={{ padding: 10, alignContent: 'center', alignSelf: 'center', }} >
                    <BsFilePersonFill size={30} color="#00a4ef" style={{ cursor: 'pointer' }} />
                </div>
            </div>
            <div
                style={{
                    display: 'flex', flexDirection: 'row-reverse',
                    alignContent: 'space-around', padding: 10,
                }}
            >
                <div style={{
                    flex: 1, padding: 10, alignContent: 'center', alignSelf: 'center',
                    marginLeft: "0",
                    marginRight: "40%",

                }} >
                    <Container key={chat.id}
                        footer={
                            <ExpandableSection
                                headerText="Insights"
                                variant="footer"
                                defaultExpanded
                            >
                                <Box float="right">
                                    <Button iconName="angle-right" variant="primary" onClick={() => {
                                        setChatInfo(chat)
                                        openInfoDrawer()
                                    }} />
                                </Box>
                            </ExpandableSection>
                        }
                    >
                        {chat.bot}
                    </Container>
                </div>
                <div style={{ padding: 10, alignContent: 'center', alignSelf: 'center', }} >
                    <RiRobot2Line size={30} color="#00a4ef" style={{ cursor: 'pointer' }} />
                </div>
            </div>
        </div>
    )
}