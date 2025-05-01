from PyQt5.QtWidgets import (QDialog, QVBoxLayout, QHBoxLayout, QLabel, 
                           QLineEdit, QPushButton, QMessageBox, QComboBox,
                           QFormLayout, QDialogButtonBox)
from PyQt5.QtCore import Qt, pyqtSignal
from ...database import db_manager
from ...config import settings

class DatabaseConnectionDialog(QDialog):
    connection_established = pyqtSignal(dict)  # Emits connection details when successful
    
    def __init__(self, parent=None):
        print("\n=== Initializing Connection Dialog ===")
        super().__init__(parent)
        self.setWindowTitle("Connect to MySQL Database")
        self.setModal(True)
        self.resize(400, 300)
        print("Setting up UI components...")
        self.setup_ui()
        print("Loading saved connections...")
        self.load_saved_connections()
        print("=== Connection Dialog Initialized ===\n")

    def setup_ui(self):
        print("Creating UI layout...")
        layout = QVBoxLayout(self)

        # Saved connections dropdown
        saved_conn_layout = QHBoxLayout()
        self.saved_connections = QComboBox()
        self.saved_connections.addItem("New Connection")
        self.saved_connections.currentTextChanged.connect(self.on_saved_connection_changed)
        saved_conn_layout.addWidget(QLabel("Saved Connections:"))
        saved_conn_layout.addWidget(self.saved_connections)
        layout.addLayout(saved_conn_layout)

        # Form layout for connection details
        print("Setting up connection form...")
        form = QFormLayout()
        
        # Connection inputs
        self.host_input = QLineEdit("localhost")
        self.port_input = QLineEdit("3306")
        self.database_input = QLineEdit()
        self.username_input = QLineEdit()
        self.password_input = QLineEdit()
        self.password_input.setEchoMode(QLineEdit.Password)
        self.connection_name = QLineEdit()

        # Add form fields
        form.addRow("Host:", self.host_input)
        form.addRow("Port:", self.port_input)
        form.addRow("Database:", self.database_input)
        form.addRow("Username:", self.username_input)
        form.addRow("Password:", self.password_input)
        form.addRow("Save as:", self.connection_name)
        
        layout.addLayout(form)

        # Buttons
        print("Setting up buttons...")
        button_box = QDialogButtonBox()
        self.test_btn = QPushButton("Test Connection")
        self.connect_btn = QPushButton("Connect")
        self.cancel_btn = QPushButton("Cancel")
        
        button_box.addButton(self.test_btn, QDialogButtonBox.ActionRole)
        button_box.addButton(self.connect_btn, QDialogButtonBox.AcceptRole)
        button_box.addButton(self.cancel_btn, QDialogButtonBox.RejectRole)

        self.test_btn.clicked.connect(self.test_connection)
        self.connect_btn.clicked.connect(self.connect_to_database)
        self.cancel_btn.clicked.connect(self.reject)

        layout.addWidget(button_box)
        print("UI setup complete")

    def load_saved_connections(self):
        """Load saved connections from settings"""
        print("Loading saved connections from settings...")
        saved = settings.get('database.saved_connections', {})
        self.saved_connections.clear()
        self.saved_connections.addItem("New Connection")
        self.saved_connections.addItems(saved.keys())
        print(f"Loaded {len(saved)} saved connections")

    def on_saved_connection_changed(self, name):
        """Load selected connection details"""
        print(f"\n=== Loading connection: {name} ===")
        if name == "New Connection":
            print("Clearing inputs for new connection")
            self.clear_inputs()
            return

        config = settings.get_database_config(name)
        if config:
            print("Loading saved configuration")
            self.host_input.setText(config['host'])
            self.port_input.setText(str(config['port']))
            self.database_input.setText(config['database'])
            self.username_input.setText(config['user'])
            self.password_input.setText(config['password'])
            self.connection_name.setText(name)
            print("Configuration loaded successfully")
        else:
            print("No configuration found for", name)

    def clear_inputs(self):
        """Clear all input fields"""
        print("Clearing all input fields")
        self.host_input.clear()
        self.port_input.clear()
        self.database_input.clear()
        self.username_input.clear()
        self.password_input.clear()
        self.connection_name.clear()

    def get_connection_config(self) -> dict:
        """Get connection configuration from inputs"""
        print("\nGathering connection configuration...")
        config = {
            "host": self.host_input.text().strip(),
            "port": int(self.port_input.text().strip()),
            "database": self.database_input.text().strip(),
            "user": self.username_input.text().strip(),
            "password": self.password_input.text().strip()
        }
        print("Configuration gathered:", {k: v if k != 'password' else '****' for k, v in config.items()})
        return config

    def test_connection(self):
        """Test database connection"""
        print("\n=== Testing Connection ===")
        config = self.get_connection_config()
        print("Testing connection with config...")
        success, error = db_manager.connect(config)
        
        if success:
            print("✓ Connection test successful")
            QMessageBox.information(self, "Success", "Connection test successful!")
            print("Closing test connection...")
            db_manager.close()  # Close test connection
        else:
            print(f"✗ Connection test failed: {error}")
            QMessageBox.critical(self, "Error", f"Connection failed: {error}")
        print("=== Connection Test Complete ===\n")

    def connect_to_database(self):
        """Establish database connection and save if requested"""
        print("\n=== Establishing Connection ===")
        try:
            # Validate inputs first
            print("Validating inputs...")
            if not self.database_input.text().strip():
                print("✗ Missing database name")
                QMessageBox.warning(self, "Validation Error", "Database name is required")
                return
            if not self.username_input.text().strip():
                print("✗ Missing username")
                QMessageBox.warning(self, "Validation Error", "Username is required")
                return

            config = self.get_connection_config()
            print("Attempting to connect...")
            
            success, error = db_manager.connect(config)
            
            if success:
                print("✓ Connection successful")
                # Save connection if name provided
                conn_name = self.connection_name.text().strip()
                if conn_name:
                    print(f"Saving connection as: {conn_name}")
                    settings.save_database_config(config, conn_name)
                
                QMessageBox.information(self, "Success", f"Connected to {config['database']}")
                self.connection_established.emit(config)
                print("=== Connection Established Successfully ===\n")
                self.accept()
            else:
                print(f"✗ Connection failed: {error}")
                QMessageBox.critical(self, "Connection Error", 
                                   f"Failed to connect to database:\n{error}\n\n"
                                   f"Please verify:\n"
                                   f"1. MySQL is running\n"
                                   f"2. Database exists\n"
                                   f"3. User credentials are correct")
                print("=== Connection Failed ===\n")
        except Exception as e:
            print(f"✗ Unexpected error: {str(e)}")
            QMessageBox.critical(self, "Error", f"Unexpected error:\n{str(e)}")
            print("=== Connection Failed ===\n")
