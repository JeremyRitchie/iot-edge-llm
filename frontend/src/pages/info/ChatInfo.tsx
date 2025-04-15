import { Box, Container, Drawer, Header, SpaceBetween, TextContent } from "@cloudscape-design/components"
import { useAtom } from "jotai"
import { ChatInfoAtom } from "../../atoms/ChatAtoms"

export const ChatInfo = () => {
    const [chatInfo] = useAtom(ChatInfoAtom)
    return (
        <div className="drawer-example">
            <Drawer header={<h2>Chat Info</h2>}>
                <Box margin={{ bottom: "l" }}>
                    <SpaceBetween size="l">
                        <Container header={
                            <Header variant="h2" >
                                Metrics
                            </Header>
                        } >
                            <SpaceBetween size="l">
                                <div>
                                    <Box variant="awsui-key-label">Model</Box>
                                    <div>{chatInfo?.metrics.model ?? "-"}</div>
                                </div>
                                <div>
                                    <Box variant="awsui-key-label">Temperature</Box>
                                    <div>{chatInfo?.metrics.temperature ?? "-"}</div>
                                </div>
                                <div>
                                    <Box variant="awsui-key-label">Top P</Box>
                                    <div>{chatInfo?.metrics.top_p ?? "-"}</div>
                                </div>
                                <div>
                                    <Box variant="awsui-key-label">Evaluation Count</Box>
                                    <div>{chatInfo?.metrics.eval_count ?? "-"}</div>
                                </div>
                                <div>
                                    <Box variant="awsui-key-label">Evaluation Duration</Box>
                                    <div>{chatInfo ? (chatInfo.metrics.eval_duration / 1000000000).toFixed(2) : "-"} sec</div>
                                </div>
                                <div>
                                    <Box variant="awsui-key-label">Prompt Evaluation Duration</Box>
                                    <div>{chatInfo ? (chatInfo.metrics.prompt_eval_duration / 1000000000).toFixed(2) : "-"} sec</div>
                                </div>
                                <div>
                                    <Box variant="awsui-key-label">Load Duration</Box>
                                    <div>{chatInfo ? (chatInfo.metrics.load_duration / 1000000000).toFixed(2) : "-"} sec</div>
                                </div>
                                <div>
                                    <Box variant="awsui-key-label">Total Duration</Box>
                                    <div>{chatInfo ? (chatInfo.metrics.total_duration / 1000000000).toFixed(2) : "-"} sec</div>
                                </div>
                            </SpaceBetween>
                        </Container>

                        <Container header={
                            <Header variant="h2" >
                                Metrics Parameters
                            </Header>
                        } >

                            <TextContent>
                                <p>Each response also returns a bunch of metrics as follows
                                    <ul>
                                        <li><b>Evaluation Count:</b> number of tokens in the response. </li>
                                        <li><b>Evaluation Duration:</b> time in seconds spent generating the response. </li>
                                        <li><b>Prompt Evaluation Duration:</b> time spent generating the response. </li>
                                        <li><b>Load Duration:</b> time spent loading the model. </li>
                                        <li><b>Total Duration:</b> time spent evaluating the prompt. </li>
                                    </ul>
                                </p>
                            </TextContent>
                        </Container>

                    </SpaceBetween>
                </Box>
            </Drawer>
        </div>
    )
}