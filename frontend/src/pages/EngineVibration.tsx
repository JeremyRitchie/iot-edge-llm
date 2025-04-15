import { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { 
  Button, 
  Container, 
  ContentLayout, 
  FormField, 
  Header, 
  Input, 
  Link, 
  SpaceBetween, 
  Spinner,
  ColumnLayout,
  Box,
  Slider,
  SegmentedControl,
  Select,
  Alert,
  TextContent,
  ExpandableSection
} from "@cloudscape-design/components";
import { toggleInfoDrawerAtom } from "../atoms/AppAtoms";
import axios from "axios";
import { webSocketAtom } from "../atoms/WebSocketAtom";
import { fetchEngineVibrationData } from "../services/apiService";
import { EngineAnalysisMetrics, EngineAnalysisMetricsType } from "../components/EngineAnalysisMetrics";

// Define API base URL - can be adjusted if needed
const API_BASE_URL = `http://${window.location.hostname}:8081`;
const ENGINE_VIBRATION_API = `${API_BASE_URL}/api/engine-vibration`;

// Define interface for parameters
interface SimulationParams {
  total_time: number;
  sampling_freq: number;
  rpm: number;
  num_cylinders: number;
  knock_start_time: number;
  knock_probability_start: number;
  knock_probability_end: number;
  knock_intensity_start: number;
  knock_intensity_end: number;
  knock_resonant_freq: number;
  knock_damping: number;
  noise_level: number;
  random_seed: number;
}

export const EngineVibration = () => {
  const [, toggleInfoDrawer] = useAtom(toggleInfoDrawerAtom);
  const [loading, setLoading] = useState(false);
  const [plotImage, setPlotImage] = useState("");
  const [error, setError] = useState("");
  const [vibrationData, setVibrationData] = useState<any[]>([]);
  const [params, setParams] = useState<SimulationParams>({
    total_time: 4.0,
    sampling_freq: 20000,
    rpm: 2000,
    num_cylinders: 4,
    knock_start_time: 2.0,
    knock_probability_start: 0.2,
    knock_probability_end: 0.9,
    knock_intensity_start: 1.0,
    knock_intensity_end: 4.0,
    knock_resonant_freq: 667,
    knock_damping: 0.05,
    noise_level: 0.1,
    random_seed: 42
  });
  const [knockCount, setKnockCount] = useState(0);
  
  // New state variables for AI analysis
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState("");
  const [analysisError, setAnalysisError] = useState("");
  const [analysisMetrics, setAnalysisMetrics] = useState<EngineAnalysisMetricsType | null>(null);
  const [analysisPrompt, setAnalysisPrompt] = useState("");
  const [showPrompt, setShowPrompt] = useState(false);

  const [webSocket, setWebSocket] = useAtom(webSocketAtom);

  const generateVibrationData = async () => {
    setLoading(true);
    setError("");
    try {
      console.log("Making API request with params:", params);
      
      // First try with the new fetch method
      let responseData;
      try {
        responseData = await fetchEngineVibrationData(params);
      } catch (fetchErr) {
        console.warn("Direct fetch failed, falling back to axios:", fetchErr);
        // Fall back to axios if fetch fails
        const response = await axios.get(ENGINE_VIBRATION_API, { 
          params: params,
          headers: {
            'Accept': 'application/json'
          }
        });
        responseData = response.data;
      }
      
      console.log("API response received:", responseData);
      
      // Check if the response contains the expected data
      if (!responseData) {
        throw new Error("Empty response from API");
      }
      
      if (responseData.error) {
        throw new Error(`Server error: ${responseData.error}`);
      }
      
      if (!responseData.plot) {
        throw new Error("API response missing plot data");
      }
      
      if (!responseData.params || responseData.params.knock_count === undefined) {
        throw new Error("API response missing knock count data");
      }
      
      // Only set data if it exists
      setPlotImage(`data:image/png;base64,${responseData.plot}`);
      setKnockCount(responseData.params.knock_count);
      
      if (responseData.data && Array.isArray(responseData.data)) {
        setVibrationData(responseData.data);
      } else {
        console.warn("Vibration data not available in the response");
        setVibrationData([]);
      }
    } catch (err: any) {
      console.error("Error generating vibration data:", err);
      
      // Handle different error cases
      if (err.code === "ERR_NETWORK") {
        setError("Cannot connect to API server. Please make sure the server is running on port 8081.");
      } else {
        const errorMessage = err.response 
          ? `Server error: ${err.response.status} ${err.response.statusText}` 
          : err.message || "Failed to generate vibration data. Please try again.";
        setError(errorMessage);
      }
      
      // Clear data when there's an error
      setPlotImage("");
      setKnockCount(0);
      setVibrationData([]);
    } finally {
      setLoading(false);
    }
  };

  // Function to download data as CSV
  const downloadCSV = () => {
    if (vibrationData.length === 0) return;
    
    // Create CSV content
    const headers = Object.keys(vibrationData[0]).join(',');
    const rows = vibrationData.map(row => 
      Object.values(row).join(',')
    ).join('\n');
    const csvContent = `${headers}\n${rows}`;
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `engine_vibration_rpm${params.rpm}_cylinders${params.num_cylinders}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Function to analyze data using AI
  const analyzeDataWithAI = () => {
    if (vibrationData.length === 0) return;
    
    if (!webSocket.ws || webSocket.status !== 'connected') {
      setAnalysisError("WebSocket not connected. Please refresh the page and try again.");
      return;
    }
    
    setAnalysisLoading(true);
    setAnalysisError("");
    setAnalysisResult("");
    
    try {
      // Create CSV content
      const headers = Object.keys(vibrationData[0]).join(',');
      const rows = vibrationData.map(row => 
        Object.values(row).join(',')
      ).join('\n');
      const csvContent = `${headers}\n${rows}`;
      
      // Send data to WebSocket
      webSocket.ws.send(JSON.stringify({
        "opr": "engineAnalysis",
        "id": "engine_analysis_" + Date.now(),
        "csvData": csvContent,
        "params": {
          rpm: params.rpm,
          num_cylinders: params.num_cylinders,
          sampling_freq: params.sampling_freq,
          knock_count: knockCount
        },
        "parameters": {
          "temperature": 0.7,
          "top_p": 0.9,
          "model": "gemma3:1b"
        }
      }));
    } catch (err) {
      console.error("Error sending analysis request:", err);
      setAnalysisLoading(false);
      setAnalysisError("Failed to send analysis request. Please try again.");
    }
  };

  useEffect(() => {
    // Auto-adjust resonant frequency based on initial parameters
    adjustResonantFrequency();
    // Generate initial vibration data
    generateVibrationData();
  }, []);

  useEffect(() => {
    try {
      if (webSocket.ws === null) {
        setWebSocket({
          ...webSocket,
          ws: new WebSocket(`ws://${window.location.hostname}:8081/ws`)
        });
      } else {
        webSocket.ws.onopen = (event) => {
          console.log("WebSocket connected for engine analysis");
          setWebSocket({
            ...webSocket,
            status: 'connected'
          });
        };
        
        webSocket.ws.onclose = (event) => {
          setWebSocket({
            ws: null,
            status: 'disconnected'
          });
        };
        
        webSocket.ws.onmessage = ({ data }) => {
          const response = JSON.parse(data);
          
          if (response.status === 0) {
            // This handles the streaming updates - APPEND parts instead of replacing
            setAnalysisResult(prev => prev + (response.part || ""));
          } else if (response.status === 1) {
            // This handles the final message
            setAnalysisLoading(false);
            
            // If the response includes metrics, store them
            if (response.metrics) {
              setAnalysisMetrics(response.metrics);
            }
            
            // If the response includes the prompt, store it
            if (response.prompt) {
              setAnalysisPrompt(response.prompt);
            }
          } else if (response.status === -1) {
            // Handle errors
            setAnalysisError(response.error || "An error occurred during analysis");
            setAnalysisLoading(false);
          }
        };
      }
    } catch (err) {
      console.log("WebSocket error:", err);
    }
  }, [webSocket]);

  const handleParamChange = (paramName: keyof SimulationParams, value: number) => {
    setParams(prev => ({
      ...prev,
      [paramName]: value
    }));
    
    // Auto-adjust resonant frequency when engine RPM, cylinder count, or sampling frequency changes
    if (paramName === "rpm" || paramName === "num_cylinders" || paramName === "sampling_freq") {
      // Use setTimeout to ensure the state update completes first
      setTimeout(() => {
        setParams(prev => {
          const newFreq = calculateOptimalResonantFreq();
          return {
            ...prev,
            knock_resonant_freq: newFreq
          };
        });
      }, 0);
    }
  };

  // Function to calculate optimal knock resonant frequency based on engine parameters
  const calculateOptimalResonantFreq = () => {
    // Calculate engine firing frequency
    const cycleFreq = params.rpm / 60 / 2; // Engine cycle frequency (Hz)
    const firingFreq = cycleFreq * params.num_cylinders; // Firing frequency (Hz)
    
    // Calculate Nyquist limit (max representable frequency)
    const nyquistLimit = params.sampling_freq / 2;
    
    // Calculate optimal knock frequency:
    // - Using higher multipliers of firing frequency for better visualization
    // - Staying below Nyquist limit with safety margin
    
    let optimalFreq;
    if (params.rpm < 600) {
      // For low RPM engines, use 8x firing frequency with minimum of 80 Hz
      // This provides better knock visualization while maintaining realism
      optimalFreq = Math.max(firingFreq * 8, 80);
      
      // Cap at 120 Hz for very low RPM engines unless sampling frequency allows higher
      if (nyquistLimit > 150 && optimalFreq < 120) {
        optimalFreq = Math.min(optimalFreq, 120);
      }
    } else {
      // For higher RPM engines, use 10x firing frequency with higher minimum
      optimalFreq = Math.max(firingFreq * 10, 200);
    }
    
    // Ensure we don't exceed 75% of Nyquist limit to avoid aliasing
    if (optimalFreq > nyquistLimit * 0.75) {
      optimalFreq = Math.floor(nyquistLimit * 0.75);
    }
    
    // Ensure frequency is at least 80 Hz for better visualization when possible
    if (nyquistLimit > 160 && optimalFreq < 80) {
      optimalFreq = 80;
    }
    
    return Math.round(optimalFreq);
  };

  // Function to adjust the resonant frequency automatically
  const adjustResonantFrequency = () => {
    const newFreq = calculateOptimalResonantFreq();
    handleParamChange("knock_resonant_freq", newFreq);
  };

  return (
    <ContentLayout
      header={
        <SpaceBetween size="m">
          <Header
            variant="h1"
            info={<Link onFollow={toggleInfoDrawer}>Info</Link>}
            description="Simulate engine vibration patterns with developing knock."
          >
            Engine Vibration Simulation
          </Header>
        </SpaceBetween>
      }
    >
      <SpaceBetween size="xl">
        <Container
          header={
            <Header
              variant="h2"
              description="Adjust parameters to observe different engine vibration patterns"
            >
              Simulation Parameters
            </Header>
          }
        >
          <ColumnLayout columns={2} variant="text-grid">
            <SpaceBetween size="l">
              <FormField label="Engine RPM" description="Engine speed in revolutions per minute">
                <Input
                  type="number"
                  value={params.rpm.toString()}
                  onChange={({ detail }) => handleParamChange("rpm", parseInt(detail.value))}
                />
              </FormField>
              
              <FormField label="Number of Cylinders">
                <SegmentedControl
                  selectedId={params.num_cylinders.toString()}
                  onChange={({ detail }) => handleParamChange("num_cylinders", parseInt(detail.selectedId))}
                  options={[
                    { text: "3", id: "3" },
                    { text: "4", id: "4" },
                    { text: "6", id: "6" },
                    { text: "8", id: "8" }
                  ]}
                />
              </FormField>
              
              <FormField label="Sampling Frequency (Hz)" description="Higher values provide smoother graphs">
                <Input
                  type="number"
                  value={params.sampling_freq.toString()}
                  onChange={({ detail }) => handleParamChange("sampling_freq", parseInt(detail.value))}
                />
              </FormField>
              
              <FormField label="Total Simulation Time (seconds)">
                <Input
                  type="number"
                  value={params.total_time.toString()}
                  onChange={({ detail }) => handleParamChange("total_time", parseFloat(detail.value))}
                />
              </FormField>
            </SpaceBetween>
            
            <SpaceBetween size="l">
              <FormField label="Knock Start Time (seconds)" description="When knocking begins in the simulation">
                <Input
                  type="number"
                  value={params.knock_start_time.toString()}
                  onChange={({ detail }) => handleParamChange("knock_start_time", parseFloat(detail.value))}
                />
              </FormField>
              
              <FormField label="Knock Intensity (Start to End)" description="How powerful the knocking becomes">
                <ColumnLayout columns={2}>
                  <Input
                    type="number"
                    value={params.knock_intensity_start.toString()}
                    onChange={({ detail }) => handleParamChange("knock_intensity_start", parseFloat(detail.value))}
                  />
                  <Input
                    type="number"
                    value={params.knock_intensity_end.toString()}
                    onChange={({ detail }) => handleParamChange("knock_intensity_end", parseFloat(detail.value))}
                  />
                </ColumnLayout>
              </FormField>
              
              <FormField label="Knock Probability (Start to End)" description="Likelihood of knock per cycle">
                <ColumnLayout columns={2}>
                  <Input
                    type="number"
                    value={params.knock_probability_start.toString()}
                    onChange={({ detail }) => handleParamChange("knock_probability_start", parseFloat(detail.value))}
                  />
                  <Input
                    type="number"
                    value={params.knock_probability_end.toString()}
                    onChange={({ detail }) => handleParamChange("knock_probability_end", parseFloat(detail.value))}
                  />
                </ColumnLayout>
              </FormField>
              
              <FormField label="Knock Resonant Frequency (Hz)" description="Frequency of knock oscillations (auto-adjusts with engine parameters)">
                <ColumnLayout columns={2}>
                  <Input
                    type="number"
                    value={params.knock_resonant_freq.toString()}
                    onChange={({ detail }) => handleParamChange("knock_resonant_freq", parseInt(detail.value))}
                  />
                  <Button 
                    onClick={adjustResonantFrequency}
                    iconName="refresh"
                  >
                    Auto Adjust
                  </Button>
                </ColumnLayout>
              </FormField>
              
              <FormField label="Noise Level" description="Background noise in the signal (0-1)">
                <Slider
                  value={params.noise_level}
                  onChange={({ detail }) => handleParamChange("noise_level", detail.value)}
                  min={0}
                  max={1}
                  step={0.05}
                />
              </FormField>
            </SpaceBetween>
          </ColumnLayout>
          
          <Box padding={{ top: "l" }}>
            <Button 
              variant="primary" 
              onClick={generateVibrationData} 
              loading={loading}
            >
              Generate Vibration Data
            </Button>
          </Box>
        </Container>
        
        {error && (
          <Box color="text-status-error" padding="m">
            <SpaceBetween size="m">
              <div>{error}</div>
              {error.includes("Cannot connect to API server") && (
                <div>
                  <p>To fix this issue:</p>
                  <ol>
                    <li>Make sure the FastAPI server is running by executing: <code>cd edge-llm && python main.py</code></li>
                    <li>Verify that port 8081 is not blocked by a firewall</li>
                    <li>Check that the API server is properly initialized</li>
                  </ol>
                  <Button 
                    onClick={generateVibrationData}
                    iconName="refresh"
                  >
                    Retry Connection
                  </Button>
                </div>
              )}
              {error.includes("API response missing") && (
                <div>
                  <p>The API server seems to be running but returned unexpected data. This may be due to:</p>
                  <ol>
                    <li>The route catch-all is serving the frontend instead of the API</li>
                    <li>The API endpoint is incorrectly configured</li>
                    <li>The FastAPI route is not handling the request correctly</li>
                  </ol>
                  <p>Potential solutions:</p>
                  <ol>
                    <li>Check and modify the api.py file to ensure API routes take precedence over static file serving</li>
                    <li>Make sure the engine-vibration API is properly implemented</li>
                    <li>Try using a different port for the frontend or API</li>
                  </ol>
                </div>
              )}
            </SpaceBetween>
          </Box>
        )}
        
        <Container
          header={
            <Header
              variant="h2"
              description={`Vibration patterns with ${knockCount} detected knock events`}
            >
              Simulation Results
            </Header>
          }
        >
          {loading ? (
            <Spinner size="large" />
          ) : (
            <>
              {plotImage && (
                <img 
                  src={plotImage} 
                  alt="Engine Vibration Plot" 
                  style={{ width: "100%", maxWidth: "1000px" }} 
                />
              )}
              {vibrationData.length > 0 && (
                <SpaceBetween size="m">
                  <ColumnLayout columns={2}>
                    <Button 
                      iconName="download"
                      onClick={downloadCSV}
                    >
                      Download Data as CSV
                    </Button>
                    <Button 
                      iconName="search"
                      onClick={analyzeDataWithAI}
                      loading={analysisLoading}
                      disabled={vibrationData.length === 0}
                    >
                      Analyze with AI
                    </Button>
                  </ColumnLayout>
                </SpaceBetween>
              )}
            </>
          )}
        </Container>
        
        {/* New container for AI analysis results */}
        {(analysisResult || analysisLoading || analysisError) && (
          <Container
            header={
              <Header
                variant="h2"
                description="AI-powered analysis of the engine vibration patterns"
              >
                Analysis Results
              </Header>
            }
          >
            <SpaceBetween size="l">
              <TextContent>
                <div style={{ whiteSpace: 'pre-line' }}>
                  <p>{analysisResult || "No analysis available yet."}</p>
                </div>
              </TextContent>
              
              {analysisError && (
                <Alert type="error">
                  {analysisError}
                </Alert>
              )}
              
              {analysisMetrics && (
                <EngineAnalysisMetrics metrics={analysisMetrics} />
              )}
              
              {analysisPrompt && (
                <ExpandableSection 
                  headerText="View Analysis Prompt"
                  variant="container"
                  expanded={showPrompt}
                  onChange={({ detail }: { detail: { expanded: boolean } }) => setShowPrompt(detail.expanded)}
                >
                  <TextContent>
                    <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {analysisPrompt}
                    </pre>
                  </TextContent>
                </ExpandableSection>
              )}
            </SpaceBetween>
          </Container>
        )}
      </SpaceBetween>
    </ContentLayout>
  );
}; 