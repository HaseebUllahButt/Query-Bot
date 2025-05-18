import sys
import tkinter as tk
from tkinter import ttk, scrolledtext
import asyncio
import websockets
import json
import mysql.connector
from datetime import datetime
import queue
import threading

class WebSocketThread(threading.Thread):
    def __init__(self, message_callback, status_callback, table_callback):
        super().__init__()
        self.connection = None
        self.connected = False
        self.message_queue = queue.Queue()
        self.message_callback = message_callback
        self.status_callback = status_callback
        self.table_callback = table_callback
        self.daemon = True

    def run(self):
        asyncio.run(self.websocket_server())

    async def handle_connection(self, websocket):
        try:
            async for message in websocket:
                data = json.loads(message)
                
                if data["type"] == "handshake":
                    try:
                        self.connection = mysql.connector.connect(
                            host="localhost",
                            user=data["username"],
                            password=data["password"],
                            port=data["port"]
                        )
                        self.connected = True
                        self.status_callback("Connected", "#2ecc71")
                        self.message_callback("Successfully connected to MySQL database")
                        await websocket.send(json.dumps({"status": "success"}))
                    except Exception as e:
                        self.connected = False
                        self.status_callback("Connection failed", "#e74c3c")
                        self.message_callback(f"Connection failed: {str(e)}")
                        await websocket.send(json.dumps({"status": "error", "message": str(e)}))
                
                elif data["type"] == "query":
                    if not self.connected:
                        await websocket.send(json.dumps({
                            "status": "error",
                            "message": "Not connected to database"
                        }))
                        continue
                    
                    try:
                        cursor = self.connection.cursor()
                        # Split the query into individual statements
                        queries = data["query"].split(';')
                        queries = [q.strip() for q in queries if q.strip()]
                        
                        for query in queries:
                            # Execute the query
                            print(query)
                            cursor.execute(query)
                            
                            # Try to fetch results if it's a SELECT query
                            try:
                                results = cursor.fetchall()
                                if cursor.description:  # Only process if there are results
                                    column_names = [desc[0] for desc in cursor.description]
                                    formatted_results = []
                                    for row in results:
                                        formatted_row = {}
                                        for i, value in enumerate(row):
                                            formatted_row[column_names[i]] = str(value)
                                        formatted_results.append(formatted_row)
                                    
                                    # Only update table for SELECT queries
                                    self.table_callback(formatted_results)
                                    
                                    await websocket.send(json.dumps({
                                        "status": "success",
                                        "results": formatted_results
                                    }))
                                else:
                                    # For non-SELECT queries or database selection
                                    self.connection.commit()
                                    self.message_callback(f"Query executed successfully: {query}")
                                    await websocket.send(json.dumps({
                                        "status": "success",
                                        "message": "Query executed successfully"
                                    }))
                            except mysql.connector.Error:
                                # If it's not a SELECT query, just commit the changes
                                self.connection.commit()
                                self.message_callback(f"Query executed successfully: {query}")
                                await websocket.send(json.dumps({
                                    "status": "success",
                                    "message": "Query executed successfully"
                                }))
                        
                        cursor.close()
                    except Exception as e:
                        self.message_callback(f"Query execution failed: {str(e)}")
                        await websocket.send(json.dumps({
                            "status": "error",
                            "message": str(e)
                        }))
        
        except websockets.exceptions.ConnectionClosed:
            self.connected = False
            self.status_callback("No device connected", "#95a5a6")
            self.message_callback("Client disconnected")
        finally:
            if self.connection:
                self.connection.close()
                self.connection = None
            self.connected = False

    async def websocket_server(self):
        async with websockets.serve(self.handle_connection, "localhost", 7878):
            self.message_callback("WebSocket server started on ws://localhost:7878")
            await asyncio.Future()

class DriverGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("Query Bot")
        self.root.minsize(1200, 600)
        
        # Configure style
        style = ttk.Style()
        style.configure("Status.TLabel", font=("Arial", 10))
        
        # Create main frame
        main_frame = ttk.Frame(root, padding="20")
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # Status frame
        status_frame = ttk.Frame(main_frame)
        status_frame.pack(fill=tk.X, pady=(0, 10))
        
        status_label = ttk.Label(status_frame, text="Status:", font=("Arial", 10, "bold"))
        status_label.pack(side=tk.LEFT)
        
        self.status_indicator = ttk.Label(status_frame, text="No device connected", style="Status.TLabel")
        self.status_indicator.pack(side=tk.LEFT, padx=(5, 0))
        
        # Create paned window for console and table
        paned_window = ttk.PanedWindow(main_frame, orient=tk.HORIZONTAL)
        paned_window.pack(fill=tk.BOTH, expand=True)
        
        # Console frame
        console_frame = ttk.Frame(paned_window)
        paned_window.add(console_frame, weight=1)
        
        # Log area
        self.log_text = scrolledtext.ScrolledText(
            console_frame,
            wrap=tk.WORD,
            font=("Consolas", 10),
            bg="#2c3e50",
            fg="#ecf0f1",
            insertbackground="#ecf0f1"
        )
        self.log_text.pack(fill=tk.BOTH, expand=True)
        
        # Table frame
        table_frame = ttk.Frame(paned_window)
        paned_window.add(table_frame, weight=1)
        
        # Create Treeview for table
        self.tree = ttk.Treeview(table_frame)
        self.tree.pack(fill=tk.BOTH, expand=True)
        
        # Add scrollbars to the treeview
        vsb = ttk.Scrollbar(table_frame, orient="vertical", command=self.tree.yview)
        hsb = ttk.Scrollbar(table_frame, orient="horizontal", command=self.tree.xview)
        self.tree.configure(yscrollcommand=vsb.set, xscrollcommand=hsb.set)
        
        # Pack scrollbars
        vsb.pack(side=tk.RIGHT, fill=tk.Y)
        hsb.pack(side=tk.BOTTOM, fill=tk.X)
        
        # Configure root window style
        self.root.configure(bg="#f5f6fa")
        
        # Start WebSocket server
        self.ws_thread = WebSocketThread(self.log_message, self.update_status, self.update_table)
        self.ws_thread.start()

    def log_message(self, message):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        self.log_text.insert(tk.END, f"[{timestamp}] {message}\n")
        self.log_text.see(tk.END)

    def update_status(self, status, color):
        self.status_indicator.configure(text=status, foreground=color)
        
    def update_table(self, results):
        # Clear existing items
        for item in self.tree.get_children():
            self.tree.delete(item)
            
        if not results:
            return
            
        # Configure columns based on the first result
        columns = list(results[0].keys())
        self.tree["columns"] = columns
        self.tree["show"] = "headings"
        
        # Set column headings
        for col in columns:
            self.tree.heading(col, text=col)
            self.tree.column(col, width=100)  # Default width
            
        # Insert data
        for row in results:
            values = [row[col] for col in columns]
            self.tree.insert("", tk.END, values=values)

def main():
    root = tk.Tk()
    app = DriverGUI(root)
    root.mainloop()

if __name__ == "__main__":
    main()