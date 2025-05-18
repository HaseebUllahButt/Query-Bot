from typing import Tuple, Optional, Dict
import google.generativeai as genai
from ..database import db_manager
from ..config import settings

class LLMProcessor:
    def __init__(self):
        self.model = None
        self.initialize_model()
        self.context = ""

    def initialize_model(self):
        """Initialize Gemini Pro model with API key"""
        try:
            api_key = "AIzaSyD651VD-7LanIMMtcfDED14a0lVb_or4FI"
            if not api_key:
                raise ValueError("Gemini API key not found")
            
            print("Configuring Gemini with API key...")
            genai.configure(api_key=api_key)
            
            # Initialize Gemini model
            self.model = genai.GenerativeModel(
                model_name="gemini-2.0-flash",
                generation_config={
                    "temperature": settings.get("llm.parameters.temperature", 0.7),
                    "max_output_tokens": settings.get("llm.parameters.max_length", 2048),
                }
            )
            print("✓ Gemini model initialized successfully")
        except Exception as e:
            print(f"✗ Error initializing LLM: {e}")
            self.model = None

    def build_schema_context(self) -> str:
        """Build context string from current database schema"""
        if not db_manager.current_schema:
            return ""

        context = "Database Schema:\n"
        for table_name, table_info in db_manager.current_schema.items():
            context += f"\nTable: {table_name}\n"
            if table_info['comment']:
                context += f"Description: {table_info['comment']}\n"
            
            context += "Columns:\n"
            for col in table_info['columns']:
                col_desc = f"- {col['name']} ({col['type']})"
                if col['key'] == 'PRI':
                    col_desc += " [PRIMARY KEY]"
                if not col['nullable']:
                    col_desc += " [NOT NULL]"
                if col['comment']:
                    col_desc += f" // {col['comment']}"
                context += col_desc + "\n"
            
            if table_info['foreign_keys']:
                context += "Foreign Keys:\n"
                for fk in table_info['foreign_keys']:
                    context += f"- {fk['column']} references {fk['references_table']}({fk['references_column']})\n"

        return context

    def generate_sql(self, natural_query: str) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Convert natural language query to SQL
        Returns: (success: bool, sql_query: Optional[str], error: Optional[str])
        """
        if not self.model:
            return False, None, "LLM model not initialized"

        try:
            # Build prompt with schema context
            schema_context = self.build_schema_context()
            prompt = f"""
            {schema_context}

            Given the above database schema, convert the following natural language query to SQL:
            "{natural_query}"

            Rules:
            1. Only use tables and columns that exist in the schema
            2. Use proper SQL syntax for MySQL
            3. Include appropriate JOINs when needed
            4. Return only the SQL query, no explanations

            SQL Query:
            """

            # Generate SQL query
            response = self.model.generate_content(prompt)
            sql_query = response.text.strip()

            # Basic validation
            if not sql_query.lower().startswith(('select', 'show')):
                return False, None, "Generated query must be a SELECT or SHOW statement"

            return True, sql_query, None

        except Exception as e:
            return False, None, f"Error generating SQL: {str(e)}"

    def validate_sql(self, sql_query: str) -> Tuple[bool, Optional[str]]:
        """
        Validate generated SQL query
        Returns: (is_valid: bool, error: Optional[str])
        """
        # Basic security checks
        sql_lower = sql_query.lower()
        forbidden_keywords = ['drop', 'delete', 'truncate', 'insert', 'update', 'create', 'alter', 'grant']
        
        if any(keyword in sql_lower for keyword in forbidden_keywords):
            return False, "Query contains forbidden operations"

        if not sql_lower.startswith(('select', 'show')):
            return False, "Only SELECT and SHOW queries are allowed"

        return True, None
