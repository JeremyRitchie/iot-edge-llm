import { Box, Drawer, Header, SpaceBetween, TextContent } from "@cloudscape-design/components"

export const TextGenerationInfo = () => {
    return (
        <div className="drawer-example">
            <Drawer header={<h2>Text Generation</h2>}>
                <Box margin={{ bottom: "l" }}>
                    <SpaceBetween size="xxl">
                        <SpaceBetween size="xs">
                            <Header variant="h3">
                                Generate Texts using Prompts
                            </Header>
                            <TextContent>
                                <p>This is by far the most used feature of Generative AI where we can ask the Gen-AI bot to generate text on a given prompt.</p>
                                <p>The LLM will be able to follow your instructions called prompts. Prompts are natural language descriptions of the task the AI should perform. </p>
                                <p>Prompt engineering is the process of designing instructions for generative AI (artificial intelligence) models to understand and interpret.</p>
                            </TextContent>
                        </SpaceBetween>
                        <SpaceBetween size="xs">
                            <Header variant="h3">
                                Metrics
                            </Header>
                            <TextContent>
                                <p>Each response also returns a bunch of metrics as follows
                                    <ul>
                                        <li><b>Evaluation Count:</b> number of tokens in the response. </li>
                                        <li><b>Prompt Evaluation Count:</b> number of tokens in the prompt. </li>
                                        <li><b>Prompt Evaluation Duration:</b> time spent generating the response. </li>
                                        <li><b>Total Duration:</b> time spent evaluating the prompt. </li>
                                    </ul>
                                </p>
                            </TextContent>
                        </SpaceBetween>
                    </SpaceBetween>
                </Box>
            </Drawer>
        </div>
    )
}