import json
import os
from pathlib import Path
from typing import Dict, Any, Optional

class Settings:
    def __init__(self):
        self.config_dir = Path.home() / '.querybot'
        self.config_file = self.config_dir / 'config.json'
        self.default_settings = {
            "database": {
                "last_connection": None,
                "saved_connections": {}  # Empty by default, will be populated by user input
            },
            "ui": {
                "window_size": (800, 600),
                "theme": "light",
                "font_size": 10
            },
            "llm": {
                "api_key": "AIzaSyD651VD-7LanIMMtcfDED14a0lVb_or4FI",  # Hardcoded API key
                "model": "gemini-2.0-flash",  # Using Gemini Flash API
                "parameters": {
                    "max_length": 2048,
                    "temperature": 0.7,
                    "batch_size": 1
                }
            },
            "export": {
                "default_format": "csv",
                "default_directory": str(Path.home() / 'Downloads')
            }
        }
        self.settings = self.load_settings()
        self.initialize_api_key()

    def initialize_api_key(self):
        """Initialize Gemini API key"""
        try:
            api_key = self.default_settings["llm"]["api_key"]
            if api_key:
                print("Found Gemini API key in settings")
                self.set('llm.api_key', api_key)
            else:
                print("⚠️ No Gemini API key found in settings")
        except Exception as e:
            print(f"Error initializing API key: {e}")

    def load_settings(self) -> Dict[str, Any]:
        """Load settings from file or create default if not exists"""
        try:
            self.config_dir.mkdir(parents=True, exist_ok=True)
            
            if self.config_file.exists():
                with open(self.config_file, 'r') as f:
                    return json.load(f)
            else:
                self.save_settings(self.default_settings)
                return self.default_settings
                
        except Exception as e:
            print(f"Error loading settings: {e}")
            return self.default_settings

    def save_settings(self, settings: Dict[str, Any]) -> bool:
        """Save settings to file"""
        try:
            with open(self.config_file, 'w') as f:
                json.dump(settings, f, indent=4)
            self.settings = settings
            return True
        except Exception as e:
            print(f"Error saving settings: {e}")
            return False

    def get(self, key: str, default: Any = None) -> Any:
        """Get a setting value by key"""
        keys = key.split('.')
        value = self.settings
        try:
            for k in keys:
                value = value[k]
            return value
        except (KeyError, TypeError):
            return default

    def set(self, key: str, value: Any) -> bool:
        """Set a setting value by key"""
        keys = key.split('.')
        settings = self.settings
        try:
            for k in keys[:-1]:
                settings = settings[k]
            settings[keys[-1]] = value
            return self.save_settings(self.settings)
        except (KeyError, TypeError):
            return False

    def get_database_config(self, name: str = None) -> Optional[Dict[str, Any]]:
        """Get database configuration"""
        if name:
            return self.settings['database']['saved_connections'].get(name)
        return self.settings['database'].get('last_connection')

    def save_database_config(self, config: Dict[str, Any], name: str) -> bool:
        """Save database configuration"""
        try:
            self.settings['database']['saved_connections'][name] = config
            self.settings['database']['last_connection'] = name
            return self.save_settings(self.settings)
        except Exception as e:
            print(f"Error saving database config: {e}")
            return False
