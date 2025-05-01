from PyQt5.QtWidgets import (QWidget, QVBoxLayout, QHBoxLayout, QPushButton,
                           QTextEdit, QLabel, QSplitter, QTableWidget,
                           QTableWidgetItem, QHeaderView)
from PyQt5.QtCore import Qt, pyqtSignal
import pandas as pd
from ...database import db_manager
from ...ui.components.export_dialog import ExportDialog
from ...llm.processor import LLMProcessor

class QueryEditor(QWidget):
    query_executed = pyqtSignal(bool, object)  # Emits success status and results
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.llm_processor = LLMProcessor()
        self.setup_ui()

    def setup_ui(self):
        layout = QVBoxLayout(self)
        
        # Query input area
        input_layout = QVBoxLayout()
        input_layout.addWidget(QLabel("Enter your query in natural language:"))
        self.query_input = QTextEdit()
        self.query_input.setPlaceholderText("Example: Show me all customers who made purchases last month")
        input_layout.addWidget(self.query_input)

        # Buttons
        button_layout = QHBoxLayout()
        self.execute_btn = QPushButton("Execute Query")
        self.clear_btn = QPushButton("Clear")
        self.export_btn = QPushButton("Export Results")
        self.export_btn.setEnabled(False)
        
        button_layout.addWidget(self.execute_btn)
        button_layout.addWidget(self.clear_btn)
        button_layout.addWidget(self.export_btn)
        input_layout.addLayout(button_layout)

        # Generated SQL preview
        self.sql_preview = QTextEdit()
        self.sql_preview.setReadOnly(True)
        self.sql_preview.setMaximumHeight(100)
        self.sql_preview.setPlaceholderText("Generated SQL will appear here")
        input_layout.addWidget(QLabel("Generated SQL:"))
        input_layout.addWidget(self.sql_preview)

        # Results table
        self.results_table = QTableWidget()
        self.results_table.setAlternatingRowColors(True)
        
        # Create splitter for resizable sections
        splitter = QSplitter(Qt.Vertical)
        input_widget = QWidget()
        input_widget.setLayout(input_layout)
        splitter.addWidget(input_widget)
        splitter.addWidget(self.results_table)
        
        layout.addWidget(splitter)

        # Connect signals
        self.execute_btn.clicked.connect(self.execute_query)
        self.clear_btn.clicked.connect(self.clear_all)
        self.export_btn.clicked.connect(self.export_results)

    def execute_query(self):
        """Execute the natural language query"""
        query = self.query_input.toPlainText().strip()
        if not query:
            return

        # Generate SQL from natural language
        success, sql_query, error = self.llm_processor.generate_sql(query)
        
        if not success:
            self.sql_preview.setText(f"Error: {error}")
            return

        # Display generated SQL
        self.sql_preview.setText(sql_query)

        # Validate SQL
        is_valid, error = self.llm_processor.validate_sql(sql_query)
        if not is_valid:
            self.sql_preview.setText(f"Error: {error}")
            return

        # Execute the query
        success, results, error = db_manager.execute_query(sql_query)
        
        if success:
            self.display_results(results)
            self.export_btn.setEnabled(True)
        else:
            self.sql_preview.setText(f"Error executing query: {error}")
            self.clear_results()

    def display_results(self, df: pd.DataFrame):
        """Display results in the table"""
        self.current_results = df  # Store current results for export
        self.results_table.clear()
        self.results_table.setRowCount(len(df))
        self.results_table.setColumnCount(len(df.columns))
        
        # Set headers
        self.results_table.setHorizontalHeaderLabels(df.columns)
        
        # Populate data
        for i, row in df.iterrows():
            for j, value in enumerate(row):
                item = QTableWidgetItem(str(value))
                self.results_table.setItem(i, j, item)
        
        # Adjust columns to content
        self.results_table.resizeColumnsToContents()
        self.export_btn.setEnabled(True)

    def clear_all(self):
        """Clear all inputs and results"""
        self.query_input.clear()
        self.sql_preview.clear()
        self.clear_results()

    def clear_results(self):
        """Clear just the results table"""
        self.results_table.clear()
        self.results_table.setRowCount(0)
        self.results_table.setColumnCount(0)
        self.export_btn.setEnabled(False)

    def export_results(self):
        """Export results using the export dialog"""
        if not hasattr(self, 'current_results') or self.results_table.rowCount() == 0:
            return

        dialog = ExportDialog(self.current_results, self)
        dialog.exec_()
