import { Box, Container, Drawer, Header, SpaceBetween, TextContent } from "@cloudscape-design/components"

export const EngineAnalysisInfo = () => {
    return (
        <div className="drawer-example">
            <Drawer header={<h2>Engine Analysis Info</h2>}>
                <Box margin={{ bottom: "l" }}>
                    <SpaceBetween size="l">
                        <Container header={
                            <Header variant="h2" >
                                Metrics
                            </Header>
                        } >
                            <SpaceBetween size="l">
                                <TextContent>
                                    <p>Each engine analysis response returns metrics about the processing and AI model performance:</p>
                                    <ul>
                                        <li><b>Model:</b> The LLM model used for analysis</li>
                                        <li><b>Created At:</b> When the analysis was performed</li>
                                        <li><b>Temperature:</b> The randomness parameter used for generation</li>
                                        <li><b>Top P:</b> The nucleus sampling parameter used for generation</li>
                                        <li><b>Response Length:</b> The total number of characters in the response</li>
                                        <li><b>Evaluation Count:</b> Number of tokens in the response</li>
                                        <li><b>Prompt Length:</b> The total number of characters in the prompt</li>
                                        <li><b>Prompt Evaluation Count:</b> Number of tokens in the prompt</li>
                                        <li><b>Preprocessing Duration:</b> Time spent preprocessing vibration data</li>
                                        <li><b>Prompt Creation Duration:</b> Time spent generating the analysis prompt</li>
                                        <li><b>Model Response Duration:</b> Time the model took to generate a response</li>
                                        <li><b>Total Duration:</b> Total time for the entire analysis process</li>
                                    </ul>
                                </TextContent>
                            </SpaceBetween>
                        </Container>

                        <Container header={
                            <Header variant="h2" >
                                Prompt
                            </Header>
                        } >
                            <TextContent>
                                <p>The prompt section shows the exact instruction given to the AI model for analyzing the engine data. This includes:</p>
                                <ul>
                                    <li>Context about engine knock and its characteristics</li>
                                    <li>Processed vibration data features extracted from your dataset</li>
                                    <li>Engine parameters such as RPM, cylinder count, and firing frequency</li>
                                    <li>Specific instructions for analyzing the vibration patterns</li>
                                </ul>
                                <p>Viewing the prompt helps you understand how the AI interprets your data and what specific instructions guide its analysis.</p>
                            </TextContent>
                        </Container>
                    </SpaceBetween>
                </Box>
            </Drawer>
        </div>
    )
} 