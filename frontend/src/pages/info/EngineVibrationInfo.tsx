import { Box, Drawer, Header, SpaceBetween, TextContent } from "@cloudscape-design/components"

export const EngineVibrationInfo = () => {
    return (
        <div className="drawer-example">
            <Drawer header={<h2>Engine Vibration Simulation</h2>}>
                <Box margin={{ bottom: "l" }}>
                    <SpaceBetween size="xxl">
                        <SpaceBetween size="xs">
                            <Header variant="h3">
                                Simulating Engine Vibration with Knock
                            </Header>
                            <TextContent>
                                <p>This simulation generates synthetic vibration data that resembles what might be measured on an engine with developing knock issues.</p>
                                <p>Engine knock occurs when fuel in the cylinder ignites prematurely, causing pressure waves and vibration that can damage the engine if left untreated.</p>
                                <p>The simulation allows you to adjust various parameters to see how they affect the vibration patterns and knocking events.</p>
                            </TextContent>
                        </SpaceBetween>
                        <SpaceBetween size="xs">
                            <Header variant="h3">
                                Simulation Parameters
                            </Header>
                            <TextContent>
                                <p>The main parameters you can adjust include:
                                    <ul>
                                        <li><b>Engine RPM:</b> Rotational speed of the engine in revolutions per minute.</li>
                                        <li><b>Number of Cylinders:</b> More cylinders generally result in smoother operation.</li>
                                        <li><b>Knock Start Time:</b> When knock begins to develop in the simulation.</li>
                                        <li><b>Knock Intensity:</b> How powerful the knocking becomes over time.</li>
                                        <li><b>Knock Probability:</b> Likelihood of knock occurring in each combustion cycle.</li>
                                        <li><b>Noise Level:</b> Background noise in the vibration signal.</li>
                                        <li><b>Knock Resonant Frequency:</b> The frequency at which knock oscillations occur. Higher RPM engines typically have higher knock frequencies.</li>
                                    </ul>
                                </p>
                                <p>The resulting plots show the vibration pattern over time, comparing normal operation with periods of knocking.</p>
                            </TextContent>
                        </SpaceBetween>
                    </SpaceBetween>
                </Box>
            </Drawer>
        </div>
    )
} 