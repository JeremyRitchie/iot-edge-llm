import os
import time
import logging
import json
import requests
import threading
import asyncio
import numpy as np
import pandas as pd
import random
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, File, UploadFile, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from . import db_manager
import base64
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
import io
from typing import Optional
from scipy import signal
from scipy.fft import fft, fftfreq
from scipy import stats

logging.basicConfig(
    format="{asctime} - {levelname} - {message}",
    style="{",
    datefmt="%Y-%m-%d %H:%M",
    level=logging.DEBUG,
)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# constants
OLLAMA_GENERATE_URL = "http://localhost:11434/api/generate"
OLLAMA_CHAT_URL = "http://localhost:11434/api/chat"
OLLAMA_TEXT_MODEL = "qwen3:1.7b"
DEFAULT_SYSTEM_PROMPT = "/no_think - You are a helpful AI assistant. Answer questions accurately and concisely. Answer questions directly and concisely without sharing your internal thinking process."

# app.mount("/static", StaticFiles(directory="../static"), name="static")
folder = os.path.dirname(__file__)



async def broadcast_message(websocket: WebSocket, message: str, body: any):
    response_part = body.get('response', '')
    # the response streams one token at a time, print that as we receive it
    print(response_part, end='', flush=True)
    message += response_part
    await websocket.send_text(json.dumps({
        "part": response_part
    }))
    if 'error' in body:
        raise Exception(body['error'])

    if body.get('done', False):
        print(body)
        body["response"] = message
        body["status"] = message

        await websocket.send_text(json.dumps(body))
    return message


async def ollama_generate_text(payload: any, websocket: WebSocket):
    print("ollama generate-->")
    logging.debug(payload)
    message = ""
    try:
        # Extract parameters with defaults if not provided
        parameters = payload.get("parameters", {})
        temperature = parameters.get("temperature", 0.7)
        top_p = parameters.get("top_p", 0.9)
        model = parameters.get("model", OLLAMA_TEXT_MODEL)
        system_prompt = DEFAULT_SYSTEM_PROMPT
        
        # Add explicit instructions against exposing thinking process
        
        # Construct the prompt with the enhanced system prompt
        formatted_prompt = f"{system_prompt}\n\nUser: {payload['prompt']}\n\nAssistant: "
        
        r = requests.post(OLLAMA_GENERATE_URL,
                          json={
                              'model': model,
                              'prompt': formatted_prompt,
                              'options': {
                                  'temperature': temperature,
                                  'top_p': top_p
                              }
                          },
                          stream=True)
        for line in r.iter_lines():
            body = json.loads(line)
            message = await broadcast_message(
                websocket=websocket, message=message, body=body)
    except Exception as e:
        logging.error("exception ")
        logging.error(e)

async def ollama_chat(payload: any, websocket: WebSocket):
    print("ollama chat-->")
    message = ""
    history = []
    try:
        # Get chat history with graceful handling for database issues
        try:
            chat_history = db_manager.get_chat_history()
            print(f"chat_history : {chat_history}")
            # Check if chat_history is a string (error message) instead of a list
            if isinstance(chat_history, str):
                print(f"Error in chat history response: {chat_history}")
                chat_history = []
        except Exception as e:
            print(f"Error retrieving chat history, proceeding with empty history: {e}")
            chat_history = []
        
        # Extract parameters with defaults if not provided
        parameters = payload.get("parameters", {})
        temperature = parameters.get("temperature", 0.7)
        top_p = parameters.get("top_p", 0.9)
        model = parameters.get("model", OLLAMA_TEXT_MODEL)
        # Get system prompt from parameters or use default
        system_prompt = DEFAULT_SYSTEM_PROMPT
        
        # First, add the system message
        messages = [
            {
                "role": "system",
                "content": system_prompt
            }
        ]
        
        # Then add the chat history
        for chat in chat_history:
            messages.append({
                "role": "user",
                "content": chat["human"]
            })
            if chat["bot"] != "...":
                messages.append({
                    "role": "assistant",
                    "content": chat["bot"]
                })

        print(f"history - {messages}")
        print("*********************")

        r = requests.post(OLLAMA_CHAT_URL,
                          json={
                              'model': model,
                              'messages': messages,
                              'options': {
                                  'temperature': temperature,
                                  'top_p': top_p
                              }
                          },
                          stream=True)

        for line in r.iter_lines():
            body = json.loads(line)
            # print(body)
            message += body["message"]["content"]
            # dispatch messages to front end
            await websocket.send_text(json.dumps({
                "id": payload["id"],
                "part": message,
                "status": 0
            }))
            if 'error' in body:
                raise Exception(body['error'])

            # send a final update to front end
            if body.get('done', False):
                print(body)
                body["id"] = payload["id"]
                body["response"] = message
                body["status"] = 1
                await websocket.send_text(json.dumps(body))

                # update DB with the response values
                db_manager.update_chat_by_id(payload["id"], {
                    "response": message,
                    "metrics": {
                        "model":  body.get("model"),
                        "temperature": parameters.get("temperature", 0.7),
                        "top_p": parameters.get("top_p", 0.9),
                        "total_duration":  body.get("total_duration"),
                        "load_duration":  body.get("load_duration"),
                        "prompt_eval_duration": body.get("prompt_eval_duration"),
                        "eval_count":  body.get("eval_count"),
                        "eval_duration":  body.get("eval_duration"),
                    }
                })

    except Exception as e:
        logging.error("exception ")
        logging.error(e)


def threadRunner(payload: dict, websocket: WebSocket):
    try:
        if payload["opr"] == "textGeneration":
            asyncio.run(ollama_generate_text(payload=payload, websocket=websocket))
        elif payload["opr"] == "chat":
            asyncio.run(ollama_chat(payload=payload, websocket=websocket))
        elif payload["opr"] == "engineAnalysis":  # Add this if it's not already there
            asyncio.run(ollama_analyze_engine(payload=payload, websocket=websocket))
        else:
            return False
        return True
    except Exception as e:
        print(f"Error in threadRunner: {e}")
        # Try to send error message to client
        try:
            asyncio.run(websocket.send_text(json.dumps({
                "error": str(e),
                "status": -1
            })))
        except:
            pass
        return False



@app.post("/api/db", tags=["items"])
async def db_operations(payload: dict) -> dict:
    if payload is None or payload["opr"] is None:
        return {"data": "Error"}
    else:
        response = db_manager.query_executor(payload)
        return {"data": response}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    print("Websocket connect -->")
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            payload: dict = json.loads(data)
            print(payload["opr"])
            thread = threading.Thread(
                target=threadRunner, args=(payload, websocket))
            # Start the thread
            thread.start()

    except WebSocketDisconnect:
        print("Websocket disconnect xxxx->")

# Define a separate app for API routes to ensure they take precedence
api_app = FastAPI()

@api_app.get("/engine-vibration")
async def get_engine_vibration(
    total_time: Optional[float] = Query(10.0),
    sampling_freq: Optional[int] = Query(1000),
    rpm: Optional[int] = Query(3000),
    num_cylinders: Optional[int] = Query(4),
    knock_start_time: Optional[float] = Query(3.0),
    knock_probability_start: Optional[float] = Query(0.2),
    knock_probability_end: Optional[float] = Query(0.9),
    knock_intensity_start: Optional[float] = Query(1.0),
    knock_intensity_end: Optional[float] = Query(4.0),
    knock_resonant_freq: Optional[int] = Query(400),
    knock_damping: Optional[float] = Query(0.05),
    noise_level: Optional[float] = Query(0.1),
    random_seed: Optional[int] = Query(42)
):
    try:
        logging.info(f"Generating engine vibration data with params: rpm={rpm}, cylinders={num_cylinders}")
        
        # Generate the vibration data
        df, params = generate_engine_vibration_data(
            total_time=total_time,
            sampling_freq=sampling_freq,
            rpm=rpm,
            num_cylinders=num_cylinders,
            knock_start_time=knock_start_time,
            knock_probability_start=knock_probability_start,
            knock_probability_end=knock_probability_end,
            knock_intensity_start=knock_intensity_start,
            knock_intensity_end=knock_intensity_end,
            knock_resonant_freq=knock_resonant_freq,
            knock_damping=knock_damping,
            noise_level=noise_level,
            random_seed=random_seed
        )
        
        logging.info(f"Vibration data generated successfully with {params['knock_count']} knock events")
        
        # Generate the visualization
        plot_data = visualize_dataset(df, params)
        logging.info("Visualization generated successfully")
        
        # Return the data, parameters, and visualization
        return {
            "data": df.to_dict(orient="records"),
            "params": params,
            "plot": plot_data
        }
    except Exception as e:
        logging.error(f"Error generating engine vibration data: {e}")
        logging.exception("Detailed error:")
        return {"error": str(e)}

# Mount the API routes at /api with higher priority
app.mount("/api", api_app)

# Frontend landing page - this should come AFTER the API mount
app.mount("/", StaticFiles(directory=folder + "/../frontend/dist", html=True), name="webapp")

# Frontend error page
@app.exception_handler(404)
async def exception_404_handler(request, exc):
    return FileResponse(folder + "/../frontend/dist/index.html")

def generate_engine_vibration_data(
    # Time parameters
    total_time: float = 10.0,          # Total time in seconds
    sampling_freq: int = 1000,         # Sampling frequency in Hz
    
    # Engine parameters
    rpm: int = 3000,                   # Engine RPM
    num_cylinders: int = 4,            # Number of cylinders
    
    # Knock parameters
    knock_start_time: float = 3.0,     # Time when knocking begins (seconds)
    knock_probability_start: float = 0.2,  # Initial probability of knock per cycle
    knock_probability_end: float = 0.9,    # Final probability of knock per cycle
    knock_intensity_start: float = 1.0,    # Initial knock intensity multiplier
    knock_intensity_end: float = 4.0,      # Final knock intensity multiplier
    knock_resonant_freq: int = 400,      # Knock resonant frequency (Hz)
    knock_damping: float = 0.05,        # Knock damping factor
    
    # Noise parameters
    noise_level: float = 0.1,          # Background noise level
    
    # Random seed for reproducibility
    random_seed: int = 42
):
    """Generate synthetic engine vibration data with developing knock."""
    # Set random seed for reproducibility
    np.random.seed(random_seed)
    
    # Ensure all parameters are the correct type
    total_time = float(total_time)
    sampling_freq = int(sampling_freq)
    rpm = int(rpm)
    num_cylinders = int(num_cylinders)
    knock_start_time = float(knock_start_time)
    knock_probability_start = float(knock_probability_start)
    knock_probability_end = float(knock_probability_end)
    knock_intensity_start = float(knock_intensity_start)
    knock_intensity_end = float(knock_intensity_end)
    knock_resonant_freq = int(knock_resonant_freq)
    knock_damping = float(knock_damping)
    noise_level = float(noise_level)
    random_seed = int(random_seed)
    
    # Calculate time points
    num_samples = int(total_time * sampling_freq)
    time = np.linspace(0, total_time, num_samples)
    
    # Calculate engine cycle parameters
    cycle_freq = rpm / 60 / 2  # Engine cycle frequency (Hz) for 4-stroke
    firing_interval = 1.0 / (cycle_freq * num_cylinders)  # Time between firing events
    
    # Create base vibration signal (normal engine operation)
    vibration = generate_base_vibration(time, rpm, num_cylinders, noise_level)
    
    # Add developing knock to the signal
    vibration, knock_events = add_knock_to_signal(
        vibration, time, cycle_freq, num_cylinders,
        knock_start_time, knock_probability_start, knock_probability_end,
        knock_intensity_start, knock_intensity_end,
        knock_resonant_freq, knock_damping, sampling_freq
    )
    
    # Create DataFrame for the dataset
    df = pd.DataFrame({
        'time': time,
        'vibration': vibration
    })
    
    # Create a dictionary with parameters used
    params = {
        'total_time': total_time,
        'sampling_freq': sampling_freq,
        'rpm': rpm,
        'num_cylinders': num_cylinders,
        'knock_start_time': knock_start_time,
        'knock_probability_start': knock_probability_start,
        'knock_probability_end': knock_probability_end,
        'knock_intensity_start': knock_intensity_start,
        'knock_intensity_end': knock_intensity_end,
        'knock_resonant_freq': knock_resonant_freq,
        'knock_damping': knock_damping,
        'noise_level': noise_level,
        'random_seed': random_seed,
        'knock_count': len(knock_events)
    }
    
    return df, params

def generate_base_vibration(time, rpm, num_cylinders, noise_level):
    """Generate base engine vibration without knocking."""
    # Engine cycle frequency (Hz)
    cycle_freq = rpm / 60 / 2
    # Firing frequency (Hz)
    firing_freq = cycle_freq * num_cylinders
    
    # Create fundamental vibration component
    vibration = np.sin(2 * np.pi * firing_freq * time) * 0.5
    
    # Add harmonics
    vibration += np.sin(2 * np.pi * 2 * firing_freq * time) * 0.3
    vibration += np.sin(2 * np.pi * 3 * firing_freq * time) * 0.15
    vibration += np.sin(2 * np.pi * 4 * firing_freq * time) * 0.05
    
    # Add firing impulses
    for i in range(num_cylinders):
        phase = 2 * np.pi * i / num_cylinders
        impulse = 0.4 * np.sin(2 * np.pi * firing_freq * time + phase) ** 8
        vibration += impulse
    
    # Add noise to the signal
    vibration += np.random.normal(0, noise_level, len(time))
    
    # Add a slower rpm variation to simulate load changes
    vibration *= 1 + 0.1 * np.sin(2 * np.pi * 0.2 * time)
    
    return vibration

def add_knock_to_signal(
    vibration, time, cycle_freq, num_cylinders,
    knock_start_time, knock_prob_start, knock_prob_end,
    intensity_start, intensity_end,
    knock_freq, knock_damping, sampling_freq
):
    """Add engine knock to vibration signal with increasing probability and intensity."""
    # Number of samples
    num_samples = len(time)
    
    # Find the index where knocking starts
    knock_start_idx = np.argmax(time >= knock_start_time)
    if knock_start_idx == 0 and time[0] < knock_start_time:
        # No knocking in this dataset
        return vibration, []
    
    # Calculate firing frequency
    firing_freq = cycle_freq * num_cylinders
    firing_interval = 1.0 / firing_freq
    
    # Calculate combustion events (when each cylinder fires)
    total_time = time[-1]
    firing_times = np.arange(0, total_time, firing_interval)
    
    # Track knock events
    knock_events = []
    
    # For each combustion event, decide whether to add knock
    for fire_time in firing_times:
        # Skip if before knock start time
        if fire_time < knock_start_time:
            continue
        
        # Calculate knock probability based on time progression
        time_progress = (fire_time - knock_start_time) / (total_time - knock_start_time)
        time_progress = min(max(time_progress, 0), 1)  # Clamp between 0 and 1
        knock_probability = knock_prob_start + time_progress * (knock_prob_end - knock_prob_start)
        
        # Determine if knock happens in this combustion cycle
        if np.random.random() <= knock_probability:
            # Calculate knock intensity based on time progression
            knock_intensity = intensity_start + time_progress * (intensity_end - intensity_start)
            
            # Generate knock signal and add it to vibration
            idx_start = np.argmax(time >= fire_time)
            if idx_start < num_samples:
                # Calculate how many samples to affect with knock (about 10ms knock duration)
                knock_duration_samples = int(0.010 * sampling_freq)
                idx_end = min(idx_start + knock_duration_samples, num_samples)
                
                # Create knock signal (damped sine wave)
                knock_time = time[idx_start:idx_end] - time[idx_start]
                knock_signal = knock_intensity * np.exp(-knock_damping * knock_time * 1000) * np.sin(2 * np.pi * knock_freq * knock_time)
                
                # Add knock to vibration signal
                vibration[idx_start:idx_end] += knock_signal
                
                # Record knock event
                knock_events.append((float(fire_time), float(knock_intensity)))
    
    return vibration, knock_events

def visualize_dataset(df, params):
    """Visualize the dataset with plots showing the developing knock."""
    plt.figure(figsize=(12, 8))
    
    # Plot full dataset
    plt.subplot(3, 1, 1)
    plt.plot(df['time'], df['vibration'])
    plt.title(f"Engine Vibration ({params['rpm']} RPM) with Developing Knock")
    plt.ylabel('Amplitude')
    plt.grid(True)
    
    # Plot early segment (before knock)
    plt.subplot(3, 1, 2)
    early_df = df[df['time'] < params['knock_start_time']]
    plt.plot(early_df['time'], early_df['vibration'])
    plt.title('Early Operation (No Knock)')
    plt.ylabel('Amplitude')
    plt.grid(True)
    
    # Plot late segment (with severe knock)
    plt.subplot(3, 1, 3)
    late_start = params['total_time'] * 0.5
    late_df = df[df['time'] > late_start]
    plt.plot(late_df['time'], late_df['vibration'])
    plt.title('Late Operation (Knocking)')
    plt.xlabel('Time (seconds)')
    plt.ylabel('Amplitude')
    plt.grid(True)
    
    plt.tight_layout()
    
    # Save the plot to a base64-encoded string
    buffer = io.BytesIO()
    plt.savefig(buffer, format='png')
    buffer.seek(0)
    plot_data = base64.b64encode(buffer.getvalue()).decode('utf-8')
    plt.close()
    
    return plot_data



def process_vibration_data(time_data, vibration_data, sample_rate):
    # Apply window to reduce spectral leakage
    windowed_data = vibration_data * signal.windows.hann(len(vibration_data))
    
    # Compute FFT
    fft_result = np.fft.rfft(windowed_data)
    fft_freq = np.fft.rfftfreq(len(vibration_data), 1/sample_rate)
    fft_magnitude = np.abs(fft_result) / len(vibration_data)
    
    # Find peaks in frequency domain
    peaks, _ = signal.find_peaks(fft_magnitude, height=0.05)
    peak_freqs = fft_freq[peaks]
    peak_magnitudes = fft_magnitude[peaks]
    
    # Calculate some key features
    rms = np.sqrt(np.mean(np.square(vibration_data)))
    crest_factor = np.max(np.abs(vibration_data)) / rms
    
    # Find the dominant frequencies
    sorted_indices = np.argsort(peak_magnitudes)[::-1]
    dominant_freqs = peak_freqs[sorted_indices[:5]]
    dominant_mags = peak_magnitudes[sorted_indices[:5]]
    
    features = {
        "rms_amplitude": float(rms),
        "crest_factor": float(crest_factor),
        "dominant_frequencies": [float(f) for f in dominant_freqs],
        "dominant_magnitudes": [float(m) for m in dominant_mags],
        "total_energy": float(np.sum(fft_magnitude * fft_magnitude)),
        "max_amplitude": float(np.max(np.abs(vibration_data)))
    }
    
    return features, (fft_freq, fft_magnitude)


def create_llm_prompt(features, engine_info, history=None):
    prompt = f"""You are an expert engine vibration analyst with years of experience diagnosing engine problems from vibration signatures. You specialize in identifying engine knock and other combustion irregularities.

Engine Information:
- Type: {engine_info['type']}
- Number of Cylinders: {engine_info['cylinders']}
- Operating RPM: {engine_info['rpm']}
- Expected firing frequency: {engine_info['firing_frequency']:.2f} Hz

Current Vibration Analysis:
- RMS Amplitude: {features['rms_amplitude']:.4f}
- Crest Factor: {features['crest_factor']:.4f}
- Maximum Amplitude: {features['max_amplitude']:.4f}
- Total Vibration Energy: {features['total_energy']:.4f}

Dominant Frequencies (Hz) and their magnitudes:
"""
    
    for i, (freq, mag) in enumerate(zip(features['dominant_frequencies'], 
                                     features['dominant_magnitudes'])):
        prompt += f"- {freq:.2f} Hz: {mag:.4f}\n"
    
    # Add historical context if available
    if history:
        prompt += "\nTrend Analysis:\n"
        for timestamp, hist_feat in history[-5:]:  # Last 5 data points
            prompt += f"- {timestamp}: RMS={hist_feat['rms_amplitude']:.4f}, "
            prompt += f"Max={hist_feat['max_amplitude']:.4f}\n"
    
    prompt += """
IMPORTANT CONTEXT ON ENGINE KNOCK:

Engine knock (detonation) typically presents in vibration data as:
- High-frequency resonances (typically 4-10 kHz for passenger vehicles)
- Sharp, transient spikes in amplitude that occur shortly after the normal combustion
- Strong, damped sinusoidal patterns that decay quickly
- Increased energy in specific frequency bands that correspond to cylinder block resonant frequencies

Severity levels of knock:
1. Light/Trace Knock: Occasional, barely detectable resonance. Minimal risk.
2. Moderate Knock: Consistent resonance with moderate amplitude. Can cause damage over time.
3. Heavy Knock: Prominent resonance with high amplitude. Immediate risk of damage.
4. Severe Knock: Extreme amplitudes. Can cause catastrophic failure in minutes.

Impact of knock on engine components:
- Piston damage: Melting, cracking, or ring land fractures
- Cylinder head damage: Erosion of combustion chambers or valve seats
- Rod bearing damage: Due to increased mechanical stress
- Head gasket failure: From excessive thermal expansion and pressure
- Overall performance degradation: Loss of power, reduced efficiency, increased emissions

Confidence indicators in vibration data:
- High confidence: Clear resonant frequencies matching expected knock patterns for this engine type
- Medium confidence: Some knock indicators present but mixed with other signals
- Low confidence: Minimal indications, possibly noise or other issues

Based on this vibration data, please provide:
1. An assessment of the engine's current condition with specific focus on knock detection
2. Identification of any potential issues, including the severity level of knock if present
3. Recommendations for maintenance actions to address identified issues
4. Your confidence level in the analysis, explaining what specific patterns led to your conclusions

Remember that engine knock becomes more damaging as RPM increases, and different cylinders may exhibit different levels of knock.
"""
    
    return prompt

async def ollama_analyze_engine(payload: any, websocket: WebSocket):
    print("ollama engine analysis-->")
    try:
        # Extract parameters with defaults if not provided
        parameters = payload.get("parameters", {})
        temperature = parameters.get("temperature", 0.7)
        top_p = parameters.get("top_p", 0.9)
        model = parameters.get("model", "qwen3:1.7b")
        csv_data = payload.get("csvData", "")
        params = payload.get("params", {})
        
        # Track start time for total analysis duration
        start_time = time.time()
        
        # Send an immediate acknowledgment to the frontend
        await websocket.send_text(json.dumps({
            "id": payload.get("id", "engine_analysis"),
            "part": "Starting engine analysis...\n\n",
            "status": 0
        }))
        
        # Validate CSV data
        if not csv_data:
            raise ValueError("No CSV data provided")
        
        # Preprocess the CSV data
        await websocket.send_text(json.dumps({
            "id": payload.get("id", "engine_analysis"),
            "part": "Preprocessing vibration data...\n\n",
            "status": 0
        }))
        
        try:
            # Parse CSV data
            df = pd.read_csv(io.StringIO(csv_data))
            
            # Extract time and vibration data
            time_data = df['time'].values
            vibration_data = df['vibration'].values
            sample_rate = params.get('sampling_freq', 1000)
            
            # Process vibration data to extract features
            preprocessing_start = time.time()
            features, fft_data = process_vibration_data(time_data, vibration_data, sample_rate)
            preprocessing_duration = time.time() - preprocessing_start
            
            # Create engine information dictionary
            engine_info = {
                "type": params.get("engine_type", "4-stroke"),
                "cylinders": params.get("num_cylinders", 4),
                "rpm": params.get("rpm", 3000),
                "firing_frequency": (params.get("rpm", 3000) / 60) * (params.get("num_cylinders", 4) / 2)
            }
            
            # Generate prompt for LLM analysis
            prompt_creation_start = time.time()
            prompt = create_llm_prompt(features, engine_info)
            prompt_creation_duration = time.time() - prompt_creation_start
            
            logging.info(f"Sending compact engine analysis prompt ({len(prompt)} chars)")
            # Log the entire prompt for debugging
            logging.debug(f"Full engine analysis prompt: \n{prompt}")
            
            # Notify the user that we're sending request to Ollama
            await websocket.send_text(json.dumps({
                "id": payload.get("id", "engine_analysis"),
                "part": "Sending request to AI model...\n\n",
                "status": 0
            }))
            
            # First check connection to Ollama
            try:
                session = requests.Session()
                check_response = session.get("http://localhost:11434/api/tags", timeout=5)
                if check_response.status_code != 200:
                    raise Exception(f"Ollama API is not responding properly. Status: {check_response.status_code}")
                
                await websocket.send_text(json.dumps({
                    "id": payload.get("id", "engine_analysis"),
                    "part": "AI model is ready, processing data...\n\n",
                    "status": 0
                }))
            except requests.exceptions.RequestException as e:
                logging.error(f"Error connecting to Ollama: {e}")
                raise Exception(f"Failed to connect to Ollama API: {e}")
            
            # Make the request to Ollama with streaming response
            model_request_start = time.time()
            response = session.post(
                OLLAMA_GENERATE_URL,
                json={
                    'model': model,
                    'prompt': prompt,
                    'options': {
                        'temperature': temperature,
                        'top_p': top_p
                    },
                    'stream': True
                },
                stream=True,
                timeout=(10, 600)  # (connect_timeout, read_timeout) in seconds
            )
            
            logging.info(f"Message posted to Ollama for engine analysis")
            
            # Process the streaming response
            message = ""
            await websocket.send_text(json.dumps({
                "id": payload.get("id", "engine_analysis"),
                "part": "Model is generating response...\n\n",
                "status": 0
            }))
            
            # Set a heartbeat for the frontend
            last_update_time = time.time()
            
            for line in response.iter_lines():
                if line:
                    try:
                        body = json.loads(line)
                        response_part = body.get('response', '')
                        if response_part:
                            message += response_part
                            
                            # Stream ONLY the new part to frontend
                            await websocket.send_text(json.dumps({
                                "id": payload.get("id", "engine_analysis"),
                                "part": response_part,
                                "status": 0
                            }))
                            last_update_time = time.time()
                        
                        if 'error' in body:
                            raise Exception(body['error'])
                            
                        # Send a final update to front end
                        if body.get('done', False):
                            logging.info(f"Engine analysis complete")
                            model_request_duration = time.time() - model_request_start
                            total_duration = time.time() - start_time
                            
                            # Convert timings to nanoseconds to match Ollama format
                            metrics = {
                                "model": model,
                                "temperature": temperature,
                                "top_p": top_p,
                                "prompt_length": len(prompt),
                                "response_length": len(message),
                                "preprocessing_duration": int(preprocessing_duration * 1000000000),  # Convert to ns
                                "prompt_creation_duration": int(prompt_creation_duration * 1000000000),  # Convert to ns
                                "model_response_duration": int(model_request_duration * 1000000000),  # Convert to ns
                                "total_duration": int(total_duration * 1000000000),  # Convert to ns
                                "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
                                # Include Ollama metrics if available
                                "eval_count": body.get("eval_count", 0),
                                "prompt_eval_count": body.get("prompt_eval_count", 0),
                                "prompt_eval_duration": body.get("prompt_eval_duration", 0),
                                "eval_duration": body.get("eval_duration", 0)
                            }
                            
                            await websocket.send_text(json.dumps({
                                "id": payload.get("id", "engine_analysis"),
                                "status": 1,
                                "metrics": metrics,
                                "prompt": prompt  # Include the full prompt
                            }))
                            break
                    except json.JSONDecodeError as e:
                        logging.error(f"Error parsing JSON from Ollama: {e}, line: {line}")
                        continue
                    
                    # Check if we need to send a heartbeat
                    current_time = time.time()
                    if current_time - last_update_time > 10:
                        await websocket.send_text(json.dumps({
                            "id": payload.get("id", "engine_analysis"),
                            "part": ".",  # Just send a dot as heartbeat
                            "status": 0,
                            "heartbeat": True
                        }))
                        last_update_time = current_time
                
        except Exception as e:
            error_msg = str(e)
            logging.error(f"Error in data processing: {error_msg}")
            
            # Provide a friendlier error message to the user
            user_msg = "Error processing vibration data: "
            if "not enough values" in error_msg.lower() or "'numpy.ndarray' object has no attribute 'time'" in error_msg:
                user_msg += "The data format appears to be incorrect. Please check your data."
            elif "not a valid JSON" in error_msg.lower():
                user_msg += "Invalid JSON format in response."
            else:
                user_msg += error_msg
                
            await websocket.send_text(json.dumps({
                "id": payload.get("id", "engine_analysis"),
                "error": user_msg,
                "status": -1
            }))
            return
            
        except requests.exceptions.Timeout as e:
            logging.error(f"Timeout from Ollama API: {e}")
            await websocket.send_text(json.dumps({
                "id": payload.get("id", "engine_analysis"),
                "part": "\n\nThe AI model is taking too long to respond. Please try again later with a smaller dataset.",
                "status": 0
            }))
            await websocket.send_text(json.dumps({
                "id": payload.get("id", "engine_analysis"),
                "error": "Timeout waiting for AI response",
                "status": -1
            }))
            
    except Exception as e:
        logging.error("Exception in engine analysis")
        logging.error(e)
        # Send error to client
        try:
            await websocket.send_text(json.dumps({
                "id": payload.get("id", "engine_analysis"),
                "error": str(e),
                "status": -1
            }))
        except:
            pass
