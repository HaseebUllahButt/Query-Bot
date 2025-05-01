import sys
import os
from PyQt5.QtWidgets import QApplication, QMessageBox
import traceback

def check_dependencies():
    """Quick check for critical dependencies"""
    missing = []
    try:
        try:
            import PyQt5
        except ImportError:
            missing.append("PyQt5")
            
        try:
            import mysql.connector
        except ImportError:
            missing.append("mysql-connector-python")
            
        try:
            import pandas
        except ImportError:
            missing.append("pandas")
            
        try:
            import google.generativeai
        except ImportError:
            missing.append("google-generativeai")

        if missing:
            raise ImportError(f"Missing packages: {', '.join(missing)}")
            
        return True
    except ImportError as e:
        QMessageBox.critical(
            None,
            "Missing Dependencies",
            f"Error: {str(e)}\n"
            "Please run 'python setup.py' first to install all dependencies."
        )
        return False

def main():
    try:
        # Check dependencies first
        if not check_dependencies():
            sys.exit(1)

        # Import after dependency check
        from src.ui.main_window import MainWindow
        from src.config import settings
        
        # Create application
        app = QApplication(sys.argv)
        
        # Set application style
        app.setStyle("Fusion")  # Modern looking style
        
        # Create and show main window
        window = MainWindow()
        window.show()
        
        # Start event loop
        sys.exit(app.exec_())
        
    except Exception as e:
        error_msg = f"Error: {str(e)}\n\nTraceback:\n{traceback.format_exc()}"
        QMessageBox.critical(None, "Application Error", error_msg)
        sys.exit(1)

if __name__ == "__main__":
    main()