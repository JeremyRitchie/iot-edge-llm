import axios from 'axios';

// Define API base URL - can be adjusted if needed
const API_BASE_URL = `http://${window.location.hostname}:8081`;
const ENGINE_VIBRATION_API = `${API_BASE_URL}/api/engine-vibration`;

// Define the interface for parameters
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

// Function to fetch engine vibration data
export const fetchEngineVibrationData = async (params: SimulationParams) => {
  try {
    const queryParams = new URLSearchParams();
    
    // Add all parameters to the query string
    Object.entries(params).forEach(([key, value]) => {
      queryParams.append(key, value.toString());
    });
    
    // Make the request
    const response = await fetch(`${ENGINE_VIBRATION_API}?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    // Check if the response is ok
    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
    }
    
    // Parse and return the JSON response
    return await response.json();
  } catch (error) {
    console.error("Error fetching engine vibration data:", error);
    throw error;
  }
}; 