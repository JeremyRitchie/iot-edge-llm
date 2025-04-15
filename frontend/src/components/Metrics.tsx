import { Container, Header, ColumnLayout, SpaceBetween, Box } from "@cloudscape-design/components"
import { TextGenerationType } from "../atoms/AppAtoms"

interface MetricsProps {
    generatedResponse: TextGenerationType | null;
    temperature?: number;
    topP?: number;
}

export const Metrics = (props: MetricsProps) => {
    const { generatedResponse, temperature, topP } = props
    return (
        <Container
            header={
                <Header
                    variant="h2"
                >
                    Metrics
                </Header>
            }
        >
            <ColumnLayout columns={3} variant="text-grid">
                <SpaceBetween size="l">
                    <div>
                        <Box variant="awsui-key-label">Model</Box>
                        <div>{generatedResponse?.model ?? "-"}</div>
                    </div>
                    <div>
                        <Box variant="awsui-key-label">Created At</Box>
                        <div>{generatedResponse?.created_at ?? "-"}</div>
                    </div>
                </SpaceBetween>
                <SpaceBetween size="l">
                    <div>
                        <Box variant="awsui-key-label">Temperature</Box>
                        <div>{temperature ?? "-"}</div>
                    </div>
                    <div>
                        <Box variant="awsui-key-label">Top P</Box>
                        <div>{topP ?? "-"}</div>
                    </div>
                </SpaceBetween>
                <SpaceBetween size="l">
                    <div>
                        <Box variant="awsui-key-label">Evaluation Count</Box>
                        <div>{generatedResponse?.eval_count ?? "-"}</div>
                    </div>
                    <div>
                        <Box variant="awsui-key-label">Prompt Evaluation Count</Box>
                        <div>{generatedResponse?.prompt_eval_count ?? "-"}</div>
                    </div>
                </SpaceBetween>
                <SpaceBetween size="l">
                    <div>
                        <Box variant="awsui-key-label">Total Duration</Box>
                        <div>{generatedResponse && generatedResponse.total_duration ? (generatedResponse.total_duration / 1000000000).toFixed(2) : "-"} sec</div>
                    </div>
                    <div>
                        <Box variant="awsui-key-label">Prompt Evaluation duration</Box>
                        <div>{generatedResponse && generatedResponse.prompt_eval_duration ? (generatedResponse.prompt_eval_duration / 1000000000).toFixed(2) : "-"} sec</div>
                    </div>
                </SpaceBetween>
            </ColumnLayout>
        </Container>
    )
}