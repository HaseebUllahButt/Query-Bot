from PyQt5.QtWidgets import (QDialog, QVBoxLayout, QHBoxLayout, QLabel, 
                           QPushButton, QComboBox, QFileDialog, QLineEdit,
                           QFormLayout, QDialogButtonBox, QMessageBox)
from PyQt5.QtCore import Qt
import pandas as pd
from pathlib import Path
from ...config import settings

class ExportDialog(QDialog):
    def __init__(self, data: pd.DataFrame, parent=None):
        super().__init__(parent)
        self.data = data
        self.setWindowTitle("Export Results")
        self.setModal(True)
        self.resize(500, 200)
        self.setup_ui()

    def setup_ui(self):
        layout = QVBoxLayout(self)
        form = QFormLayout()

        # Export format selection
        self.format_combo = QComboBox()
        self.format_combo.addItems(['CSV', 'Excel', 'JSON', 'SQL'])
        default_format = settings.get('export.default_format', 'csv').upper()
        self.format_combo.setCurrentText(default_format)
        form.addRow("Format:", self.format_combo)

        # File path selection
        path_layout = QHBoxLayout()
        self.path_input = QLineEdit()
        self.path_input.setText(str(Path(settings.get('export.default_directory', str(Path.home()))) / 'query_results'))
        self.browse_btn = QPushButton("Browse...")
        self.browse_btn.clicked.connect(self.browse_path)
        path_layout.addWidget(self.path_input)
        path_layout.addWidget(self.browse_btn)
        form.addRow("Save to:", path_layout)

        # Options based on format
        self.options_layout = QFormLayout()
        self.format_combo.currentTextChanged.connect(self.update_options)
        form.addRow(self.options_layout)

        layout.addLayout(form)

        # Buttons
        button_box = QDialogButtonBox(
            QDialogButtonBox.Save | QDialogButtonBox.Cancel
        )
        button_box.accepted.connect(self.export_data)
        button_box.rejected.connect(self.reject)
        layout.addWidget(button_box)

        # Initialize options
        self.update_options(self.format_combo.currentText())

    def update_options(self, format_type: str):
        # Clear previous options
        while self.options_layout.rowCount() > 0:
            self.options_layout.removeRow(0)

        if format_type == 'CSV':
            self.delimiter_input = QComboBox()
            self.delimiter_input.addItems([',', ';', '\t', '|'])
            self.options_layout.addRow("Delimiter:", self.delimiter_input)
            
            self.encoding_input = QComboBox()
            self.encoding_input.addItems(['utf-8', 'utf-16', 'ascii', 'iso-8859-1'])
            self.options_layout.addRow("Encoding:", self.encoding_input)

        elif format_type == 'Excel':
            self.sheet_name_input = QLineEdit("Sheet1")
            self.options_layout.addRow("Sheet name:", self.sheet_name_input)

        elif format_type == 'SQL':
            self.table_name_input = QLineEdit("query_results")
            self.options_layout.addRow("Table name:", self.table_name_input)

    def browse_path(self):
        format_type = self.format_combo.currentText()
        extensions = {
            'CSV': '*.csv',
            'Excel': '*.xlsx',
            'JSON': '*.json',
            'SQL': '*.sql'
        }
        
        file_filter = f"{format_type} files ({extensions[format_type]})"
        path, _ = QFileDialog.getSaveFileName(
            self,
            "Save File",
            self.path_input.text(),
            file_filter
        )
        
        if path:
            self.path_input.setText(path)

    def export_data(self):
        try:
            format_type = self.format_combo.currentText()
            path = self.path_input.text()

            # Ensure directory exists
            Path(path).parent.mkdir(parents=True, exist_ok=True)

            if format_type == 'CSV':
                self.data.to_csv(
                    path,
                    sep=self.delimiter_input.currentText(),
                    encoding=self.encoding_input.currentText(),
                    index=False
                )
            elif format_type == 'Excel':
                self.data.to_excel(
                    path,
                    sheet_name=self.sheet_name_input.text(),
                    index=False
                )
            elif format_type == 'JSON':
                self.data.to_json(
                    path,
                    orient='records',
                    indent=2
                )
            elif format_type == 'SQL':
                table_name = self.table_name_input.text()
                with open(path, 'w') as f:
                    # Write CREATE TABLE statement
                    create_stmt = self.generate_create_table(table_name)
                    f.write(f"{create_stmt}\n\n")
                    
                    # Write INSERT statements
                    insert_stmt = self.data.to_sql(
                        table_name,
                        None,
                        index=False,
                        if_exists='append'
                    )
                    f.write(insert_stmt)

            # Save last used directory
            settings.set('export.default_directory', str(Path(path).parent))
            settings.set('export.default_format', format_type.lower())

            QMessageBox.information(self, "Success", "Data exported successfully!")
            self.accept()

        except Exception as e:
            QMessageBox.critical(self, "Error", f"Failed to export data: {str(e)}")

    def generate_create_table(self, table_name: str) -> str:
        """Generate CREATE TABLE statement based on DataFrame structure"""
        type_mapping = {
            'int64': 'INTEGER',
            'float64': 'FLOAT',
            'datetime64[ns]': 'DATETIME',
            'bool': 'BOOLEAN',
            'object': 'TEXT'
        }
        
        columns = []
        for col, dtype in self.data.dtypes.items():
            sql_type = type_mapping.get(str(dtype), 'TEXT')
            columns.append(f"    `{col}` {sql_type}")

        return f"CREATE TABLE `{table_name}` (\n" + ",\n".join(columns) + "\n);"
