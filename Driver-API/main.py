import sys
import json
import random
import string
import asyncio
import websockets
from PyQt5.QtWidgets import (QApplication, QMainWindow, QPushButton, QVBoxLayout, 
                             QLabel, QTextEdit, QWidget)
from PyQt5.QtCore import QThread, pyqtSignal, Qt

def generate_connection_code():
    """Generate a random 6-character connection code"""
    return ''.join(random.choices(string.ascii_uppercase, k=6))

class WebSocketServerThread(QThread):
    connection_established = pyqtSignal(str)
    message_received = pyqtSignal(str)
    server_started = pyqtSignal(str)
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.connection_code = generate_connection_code()
        self.is_running = False
        self.client = None
        
    async def handle_connection(self, websocket, path):
        try:
            self.client = websocket
            async for message in websocket:
                try:
                    data = message.strip()
                    
                    # Check if this is a connection request
                    if data == self.connection_code:
                        self.connection_established.emit("Connected to Query Bot")
                        await websocket.send(json.dumps({"status": "connected"}))
                        continue
                    
                    # Process queries
                    try:
                        json_data = json.loads(data)
                        if "query" in json_data:
                            query = json_data["query"]
                            self.message_received.emit(f"Query received: {query}")
                            
                            # Empty function that will be implemented later
                            result = self.process_query(query)
                            
                            await websocket.send(json.dumps({
                                "status": "success",
                                "result": result
                            }))
                        else:
                            self.message_received.emit(f"Invalid message format: {data}")
                            await websocket.send(json.dumps({
                                "status": "error",
                                "message": "Invalid message format"
                            }))
                    except json.JSONDecodeError:
                        self.message_received.emit(f"Invalid JSON: {data}")
                        await websocket.send(json.dumps({
                            "status": "error",
                            "message": "Invalid JSON format"
                        }))
                        
                except Exception as e:
                    self.message_received.emit(f"Error processing message: {str(e)}")
                    await websocket.send(json.dumps({
                        "status": "error",
                        "message": str(e)
                    }))
        except websockets.exceptions.ConnectionClosed:
            self.message_received.emit("Client disconnected")
            self.client = None
    
    def process_query(self, query):
        # Empty function to be implemented later
        return []
    
    async def start_server(self):
        server = await websockets.serve(self.handle_connection, "localhost", 8765)
        self.server_started.emit(self.connection_code)
        self.is_running = True
        await server.wait_closed()
    
    def run(self):
        asyncio.run(self.start_server())

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Query Bot Driver")
        self.resize(600, 400)
        self.server_thread = None
        
        # Create widgets
        self.setup_ui()
        
    def setup_ui(self):
        # Main layout
        main_widget = QWidget()
        layout = QVBoxLayout()
        main_widget.setLayout(layout)
        self.setCentralWidget(main_widget)
        
        # Start server button
        self.start_button = QPushButton("Start Server Service")
        self.start_button.clicked.connect(self.start_server)
        layout.addWidget(self.start_button)
        
        # Connection code label
        self.code_label = QLabel("Connection Code: Not started")
        self.code_label.setAlignment(Qt.AlignCenter)
        layout.addWidget(self.code_label)
        
        # Connection status label
        self.status_label = QLabel("Status: Not connected")
        self.status_label.setAlignment(Qt.AlignCenter)
        layout.addWidget(self.status_label)
        
        # Requests text area
        layout.addWidget(QLabel("Incoming Requests:"))
        self.requests_text = QTextEdit()
        self.requests_text.setReadOnly(True)
        layout.addWidget(self.requests_text)
    
    def start_server(self):
        if self.server_thread is None or not self.server_thread.is_running:
            self.start_button.setEnabled(False)
            self.start_button.setText("Server Running...")
            self.server_thread = WebSocketServerThread()
            self.server_thread.server_started.connect(self.on_server_started)
            self.server_thread.connection_established.connect(self.on_connection_established)
            self.server_thread.message_received.connect(self.on_message_received)
            self.server_thread.start()
    
    def on_server_started(self, code):
        self.code_label.setText(f"Connection Code: {code}")
        self.add_to_requests_log("Server started successfully")
    
    def on_connection_established(self, message):
        self.status_label.setText(f"Status: {message}")
        self.add_to_requests_log("Client connected")
    
    def on_message_received(self, message):
        self.add_to_requests_log(message)
    
    def add_to_requests_log(self, message):
        self.requests_text.append(message)

def main():
    app = QApplication(sys.argv)
    window = MainWindow()
    window.show()
    sys.exit(app.exec_())

if __name__ == "__main__":
    main()