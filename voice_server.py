#!/usr/bin/env python3
"""
Local High-Quality Voice Service for MCQ Video Generator
Supports English and Hindi natural AI voice generation.
"""

import asyncio
import io
import json
import sys
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
import edge_tts

PORT = 5001

VOICES = [
    # English Voices
    {"id": "en-US-JennyNeural", "name": "✨ Jenny (US English Female)", "lang": "en", "gender": "Female"},
    {"id": "en-US-GuyNeural", "name": "✨ Guy (US English Male)", "lang": "en", "gender": "Male"},
    {"id": "en-IN-NeerjaNeural", "name": "✨ Neerja (Indian English Female)", "lang": "en", "gender": "Female"},
    {"id": "en-IN-PrabhatNeural", "name": "✨ Prabhat (Indian English Male)", "lang": "en", "gender": "Male"},
    {"id": "en-GB-SoniaNeural", "name": "✨ Sonia (UK English Female)", "lang": "en", "gender": "Female"},

    # Hindi Voices (हिंदी)
    {"id": "hi-IN-SwaraNeural", "name": "✨ Swara (हिंदी - महिला आवाज़)", "lang": "hi", "gender": "Female"},
    {"id": "hi-IN-MadhurNeural", "name": "✨ Madhur (हिंदी - पुरुष आवाज़)", "lang": "hi", "gender": "Male"},
]

async def generate_speech_bytes(text: str, voice: str = "en-US-JennyNeural", rate_str: str = "+0%", pitch_str: str = "+0Hz") -> bytes:
    communicate = edge_tts.Communicate(text=text, voice=voice, rate=rate_str, pitch=pitch_str)
    audio_stream = io.BytesIO()
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_stream.write(chunk["data"])
    return audio_stream.getvalue()

class VoiceRequestHandler(BaseHTTPRequestHandler):
    def address_string(self):
        # Disable slow reverse DNS lookup on macOS!
        return str(self.client_address[0])

    def _send_cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")

    def do_OPTIONS(self):
        self.send_response(200)
        self._send_cors()
        self.end_headers()

    def do_GET(self):
        if self.path == "/api/voices" or self.path.startswith("/api/voices"):
            self.send_response(200)
            self._send_cors()
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(VOICES).encode("utf-8"))
        elif self.path == "/api/health":
            self.send_response(200)
            self._send_cors()
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "ok"}).encode("utf-8"))
        else:
            self.send_response(404)
            self._send_cors()
            self.end_headers()

    def do_POST(self):
        if self.path == "/api/tts":
            content_length = int(self.headers.get("Content-Length", 0))
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode("utf-8"))
                text = data.get("text", "").strip()
                voice = data.get("voice", "en-US-JennyNeural")
                rate_num = float(data.get("rate", 1.0))
                
                rate_pct = int((rate_num - 1.0) * 100)
                rate_str = f"{rate_pct:+d}%" if rate_pct != 0 else "+0%"

                if not text:
                    self.send_response(400)
                    self._send_cors()
                    self.end_headers()
                    self.wfile.write(b"Text is required")
                    return

                # Generate speech with fresh event loop
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                try:
                    audio_bytes = loop.run_until_complete(asyncio.wait_for(generate_speech_bytes(text, voice, rate_str), timeout=10.0))
                finally:
                    loop.close()

                self.send_response(200)
                self._send_cors()
                self.send_header("Content-Type", "audio/mpeg")
                self.send_header("Content-Length", str(len(audio_bytes)))
                self.end_headers()
                self.wfile.write(audio_bytes)
            except Exception as e:
                self.send_response(500)
                self._send_cors()
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))
        else:
            self.send_response(404)
            self._send_cors()
            self.end_headers()

    def log_message(self, format, *args):
        pass

def main():
    server = ThreadingHTTPServer(("0.0.0.0", PORT), VoiceRequestHandler)
    print(f"🎙️ Local English & Hindi Voice Service running on http://localhost:{PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down voice service...")
        server.server_close()

if __name__ == "__main__":
    main()
