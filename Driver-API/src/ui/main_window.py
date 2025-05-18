from PyQt5.QtWidgets import (QMainWindow, QWidget, QVBoxLayout, QMenuBar, 
                           QMenu, QAction, QMessageBox, QLabel, QStatusBar)
from PyQt5.QtCore import Qt
from .components.connection_dialog import DatabaseConnectionDialog
from .components.query_editor import QueryEditor
from ..database import db_manager
from ..config import settings

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("MySQL Query Bot")
        self.resize(1000, 800)
        self.setup_ui()
        self.show_connection_dialog()  # Show connection dialog on startup

    def setup_ui(self):
        # Create central widget
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        layout = QVBoxLayout(central_widget)

        # Create menu bar
        self.create_menu_bar()

        # Create status bar
        self.status_bar = QStatusBar()
        self.setStatusBar(self.status_bar)
        self.connection_label = QLabel("Not Connected")
        self.status_bar.addPermanentWidget(self.connection_label)

        # Create query editor
        self.query_editor = QueryEditor()
        layout.addWidget(self.query_editor)

    def create_menu_bar(self):
        menubar = self.menuBar()

        # File menu
        file_menu = menubar.addMenu("File")
        
        connect_action = QAction("Connect to Database", self)
        connect_action.setShortcut("Ctrl+N")
        connect_action.triggered.connect(self.show_connection_dialog)
        file_menu.addAction(connect_action)

        disconnect_action = QAction("Disconnect", self)
        disconnect_action.triggered.connect(self.disconnect_database)
        file_menu.addAction(disconnect_action)

        file_menu.addSeparator()

        exit_action = QAction("Exit", self)
        exit_action.setShortcut("Ctrl+Q")
        exit_action.triggered.connect(self.close)
        file_menu.addAction(exit_action)

        # Help menu
        help_menu = menubar.addMenu("Help")
        
        about_action = QAction("About", self)
        about_action.triggered.connect(self.show_about)
        help_menu.addAction(about_action)

    def show_connection_dialog(self):
        """Show database connection dialog"""
        dialog = DatabaseConnectionDialog(self)
        dialog.connection_established.connect(self.on_connection_established)
        dialog.exec_()

    def on_connection_established(self, config):
        """Handle successful database connection"""
        db_name = config['database']
        self.connection_label.setText(f"Connected to: {db_name}")
        self.status_bar.showMessage(f"Successfully connected to {db_name}", 3000)
        
        # Enable query editor
        self.query_editor.setEnabled(True)
        self.query_editor.clear_all()

    def disconnect_database(self):
        """Disconnect from current database"""
        if db_manager.current_connection:
            db_manager.close()
            self.connection_label.setText("Not Connected")
            self.status_bar.showMessage("Disconnected from database", 3000)
            self.query_editor.setEnabled(False)
            self.query_editor.clear_all()

    def show_about(self):
        """Show about dialog"""
        QMessageBox.about(
            self,
            "About MySQL Query Bot",
            """<h3>MySQL Query Bot</h3>
            <p>A natural language interface for MySQL databases.</p>
            <p>Using Gemini 2.0 Flash for query processing.</p>
            <p>Version 1.0</p>"""
        )

    def closeEvent(self, event):
        """Handle application close"""
        if db_manager.current_connection:
            db_manager.close()
        event.accept()
