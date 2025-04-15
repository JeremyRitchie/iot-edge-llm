import { Container, Header, ColumnLayout, SpaceBetween, Box } from "@cloudscape-design/components"

export interface EngineAnalysisMetricsType {
    model: string;
    temperature: number;
    top_p: number;
    prompt_length: number;
    response_length: number;
    preprocessing_duration: number;
    prompt_creation_duration: number;
    model_response_duration: number;
    total_duration: number;
    created_at: string;
    eval_count: number;
    prompt_eval_count: number;
    prompt_eval_duration: number;
    eval_duration: number;
}

interface EngineAnalysisMetricsProps {
    metrics: EngineAnalysisMetricsType | null;
    prompt?: string;
}

export const EngineAnalysisMetrics = (props: EngineAnalysisMetricsProps) => {
    const { metrics, prompt } = props;
    
    return (
        <Container
            header={
                <Header variant="h2">
                    Analysis Metrics
                </Header>
            }
        >
            <ColumnLayout columns={3} variant="text-grid">
                <SpaceBetween size="l">
                    <div>
                        <Box variant="awsui-key-label">Model</Box>
                        <div>{metrics?.model ?? "-"}</div>
                    </div>
                    <div>
                        <Box variant="awsui-key-label">Created At</Box>
                        <div>{metrics?.created_at ?? "-"}</div>
                    </div>
                </SpaceBetween>
                <SpaceBetween size="l">
                    <div>
                        <Box variant="awsui-key-label">Temperature</Box>
                        <div>{metrics?.temperature ?? "-"}</div>
                    </div>
                    <div>
                        <Box variant="awsui-key-label">Top P</Box>
                        <div>{metrics?.top_p ?? "-"}</div>
                    </div>
                </SpaceBetween>
                <SpaceBetween size="l">
                    <div>
                        <Box variant="awsui-key-label">Response Length</Box>
                        <div>{metrics?.response_length ?? "-"} chars</div>
                    </div>
                    <div>
                        <Box variant="awsui-key-label">Evaluation Count</Box>
                        <div>{metrics?.eval_count ?? "-"} tokens</div>
                    </div>
                </SpaceBetween>
                <SpaceBetween size="l">
                    <div>
                        <Box variant="awsui-key-label">Prompt Length</Box>
                        <div>{metrics?.prompt_length ?? "-"} chars</div>
                    </div>
                    <div>
                        <Box variant="awsui-key-label">Prompt Evaluation Count</Box>
                        <div>{metrics?.prompt_eval_count ?? "-"} tokens</div>
                    </div>
                </SpaceBetween>
                <SpaceBetween size="l">
                    <div>
                        <Box variant="awsui-key-label">Preprocessing Duration</Box>
                        <div>{metrics && metrics.preprocessing_duration ? (metrics.preprocessing_duration / 1000000000).toFixed(2) : "-"} sec</div>
                    </div>
                    <div>
                        <Box variant="awsui-key-label">Prompt Creation Duration</Box>
                        <div>{metrics && metrics.prompt_creation_duration ? (metrics.prompt_creation_duration / 1000000000).toFixed(2) : "-"} sec</div>
                    </div>
                </SpaceBetween>
                <SpaceBetween size="l">
                    <div>
                        <Box variant="awsui-key-label">Model Response Duration</Box>
                        <div>{metrics && metrics.model_response_duration ? (metrics.model_response_duration / 1000000000).toFixed(2) : "-"} sec</div>
                    </div>
                    <div>
                        <Box variant="awsui-key-label">Total Duration</Box>
                        <div>{metrics && metrics.total_duration ? (metrics.total_duration / 1000000000).toFixed(2) : "-"} sec</div>
                    </div>
                </SpaceBetween>
            </ColumnLayout>
        </Container>
    )
} 