# :headphones: WebMicListen — Real-Time Browser Audio Streaming
A live microphone streaming app that allows live broadcasting of your mic audio over the network, playback in other clients, and optional recording.


## Purpose
This project was built only one purpose in mind - to learn.  
Inspired by JavaScript for Dummies 7 books in one by Chris Minnick this project helped me to connect the dots between:

- Data flow and chunking
- Client-Server communication  
- Password authentification logic  
- Audio processing  
- Event driven programming - custom events and built-in events

## How it works

- Start the server (node server.cjs) to connect to local host.
- Open your browser at **http://localhost:8082**
- Enter password (Feel free to hash your own in .env)
- Click **"Start Sending Data"** - you are prompted to allow microphone - Allow

- Client enters password
- Click **"Start Receiving Data"**
- Status messages display when the app is listening

<p align="left">
  <img src="accessories/MicListen.PNG" width="850"/>
</p>

## How it works (technical side)
### Audio Capture
- Microphone audio arrives as Float32Array
- Each sample converted to 16-bit PCM (DataView.setInt16)
- Chunked into 4096-sample packets

### Live broadcasting
- Each chunk sent via WebSocket (socket.emit("audio-chunk"))
- Server broadcasts chunks to all connected clients
  
### Playback
- Receiver converts 16-bit PCM → Float32Array
- Uses AudioContext.createBuffer() and AudioBufferSourceNode
- Queued playback ensures smooth without the breaks audio
### Recording
- Optional recording can be triggered from both sides
- Queued playback ensures smooth, sequential audio
- Generates WAV header for playback


## Tech Stack
- ### Frontend:
- HTML, CSS, JavaScript
- Web Audio API
- Socket.io - client
##
- ### Backend
- Node.js
- Socket.io
- HTTP Server (http)
- Filesystem (fs) for recording
- Bcrypt for authentification


## Installation/Usage
- git clone https://github.com/RauncR/WebMicListen.git
- cd WebMicListen
- npm install
- node server.cjs
  > Note: To access the sound stream from outside your LAN you need to create ngrok tunnel.  
  

## What can be improved?
- Add session timeout logic for security
- Create a GET route for downloading recordings to a clients' devices  
- Integrate **Express.js** for cleaner routing.
