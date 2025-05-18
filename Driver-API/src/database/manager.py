import mysql.connector
from mysql.connector import pooling
from typing import Dict, Any, Optional, List, Tuple
from ..config import settings
import pandas as pd

class DatabaseManager:
    def __init__(self):
        print("Initializing DatabaseManager...")
        self.pool = None
        self.current_connection = None
        self.current_schema = None
        print("DatabaseManager initialized")

    def connect(self, config: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
        """
        Create a connection pool with the given configuration
        Returns: (success: bool, error_message: Optional[str])
        """
        try:
            print("\n=== Starting Connection Process ===")
            print("Raw config received:", {k: v if k != 'password' else '****' for k, v in config.items()})
            
            # Validate configuration
            print("\nValidating configuration...")
            required_fields = ['host', 'user', 'password', 'database']
            for field in required_fields:
                if not config.get(field):
                    print(f"✗ Missing required field: {field}")
                    return False, f"Missing required field: {field}"
                print(f"✓ {field} is present")
            
            pool_config = {
                "pool_name": "mypool",
                "pool_size": 5,
                "host": config["host"],
                "user": config["user"],
                "password": config["password"],
                "database": config["database"],
                "port": config.get("port", 3306)
            }
            print("Pool configuration prepared:", {k: v if k != 'password' else '****' for k, v in pool_config.items()})
            
            print("\nAttempting to create MySQL connection pool...")
            try:
                # First try a direct connection to test credentials
                print("\n--- Testing Direct Connection ---")
                print(f"1. Connecting to host: {config['host']} on port {config.get('port', 3306)}")
                print(f"2. Using database: {config['database']}")
                print(f"3. Username: {config['user']}")
                print("4. Attempting connection...")
                
                try:
                    print("[DEBUG] Attempting to establish a direct connection...")
                    conn = mysql.connector.connect(
                        host=config["host"],
                        user=config["user"],
                        password=config["password"],
                        database=config["database"],
                        port=config.get("port", 3306),
                        connection_timeout=5,  # 5 second timeout
                        auth_plugin='mysql_native_password'  # Explicitly set authentication plugin
                    )
                    print("[DEBUG] Direct connection established successfully.")
                    print("✓ Direct connection successful")
                    print("5. Connection info:", conn.get_server_info())
                    conn.close()
                    print("6. Direct connection closed")
                except mysql.connector.Error as err:
                    print("[ERROR] MySQL Connection Error occurred.")
                    print(f"  Error Code: [{err.errno}]")
                    print(f"  Error Message: {err.msg}")
                    print(f"  SQL State: {err.sqlstate}")
                    
                    if err.errno == 1045:
                        print("\nDiagnosis: Access denied - Invalid username or password")
                        print("Solution: Verify your MySQL credentials")
                    elif err.errno == 1049:
                        print("\nDiagnosis: Unknown database")
                        print("Solution: Create the database first using:")
                        print(f"CREATE DATABASE {config['database']};")
                    elif err.errno == 2003:
                        print("\nDiagnosis: Connection refused")
                        print("Solution: Check if MySQL server is running with:")
                        print("1. Open Services (services.msc)")
                        print("2. Look for 'MySQL80' service")
                        print("3. Ensure it's running")
                    print("[DEBUG] Raising the error for further handling.")
                    raise err
                
                print("[DEBUG] Proceeding to create a connection pool...")
                print("\n--- Creating Connection Pool ---")
                self.pool = mysql.connector.pooling.MySQLConnectionPool(**pool_config)
                print("[DEBUG] Connection pool created successfully.")
                print("✓ Connection pool created successfully")
                
            except mysql.connector.Error as mysql_error:
                print(f"\n✗ Final MySQL Error: [{mysql_error.errno}] {mysql_error.msg}")
                return False, str(mysql_error)
            except Exception as pool_error:
                print(f"\n✗ General pool error: {str(pool_error)}")
                return False, str(pool_error)
            
            self.current_connection = config["database"]
            print(f"\nSetting current database to: {self.current_connection}")
            
            print("\n=== Loading Database Schema ===")
            success, schema, error = self.get_schema()
            
            if success:
                print("✓ Schema loaded successfully")
                self.current_schema = schema
                print("=== Connection Process Completed Successfully ===\n")
                return True, None
            
            print(f"✗ Failed to load schema: {error}")
            print("=== Connection Process Failed ===\n")
            return False, error
            
        except Exception as e:
            print(f"\n✗ Connection error: {str(e)}")
            print("=== Connection Process Failed ===\n")
            return False, str(e)

    def get_schema(self) -> Tuple[bool, Optional[Dict], Optional[str]]:
        """
        Get database schema information
        Returns: (success: bool, schema: Optional[Dict], error: Optional[str])
        """
        print("\n--- Starting Schema Loading ---")
        if not self.pool:
            print("✗ No active connection pool")
            return False, None, "No active connection"

        schema = {}
        try:
            print("Attempting to get connection from pool...")
            with self.pool.get_connection() as conn:
                print("✓ Got connection from pool")
                cursor = conn.cursor()
                print("✓ Cursor created")
                
                print("\nQuerying tables...")
                cursor.execute("""
                    SELECT 
                        TABLE_NAME,
                        TABLE_COMMENT
                    FROM INFORMATION_SCHEMA.TABLES 
                    WHERE TABLE_SCHEMA = %s
                """, (self.current_connection,))
                
                tables = cursor.fetchall()
                print(f"✓ Found {len(tables)} tables")
                
                for table_name, table_comment in tables:
                    print(f"\nProcessing table: {table_name}")
                    print("- Getting columns...")
                    cursor.execute("""
                        SELECT 
                            COLUMN_NAME,
                            DATA_TYPE,
                            IS_NULLABLE,
                            COLUMN_KEY,
                            COLUMN_COMMENT,
                            COLUMN_DEFAULT
                        FROM INFORMATION_SCHEMA.COLUMNS
                        WHERE TABLE_SCHEMA = %s AND TABLE_NAME = %s
                        ORDER BY ORDINAL_POSITION
                    """, (self.current_connection, table_name))
                    
                    columns = cursor.fetchall()
                    print(f"✓ Found {len(columns)} columns")
                    
                    print("- Getting foreign keys...")
                    cursor.execute("""
                        SELECT
                            COLUMN_NAME,
                            REFERENCED_TABLE_NAME,
                            REFERENCED_COLUMN_NAME
                        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
                        WHERE TABLE_SCHEMA = %s 
                            AND TABLE_NAME = %s
                            AND REFERENCED_TABLE_NAME IS NOT NULL
                    """, (self.current_connection, table_name))
                    
                    foreign_keys = cursor.fetchall()
                    print(f"✓ Found {len(foreign_keys)} foreign keys")
                    
                    print("- Building schema dictionary...")
                    schema[table_name] = {
                        "comment": table_comment,
                        "columns": [
                            {
                                "name": col[0],
                                "type": col[1],
                                "nullable": col[2] == "YES",
                                "key": col[3],
                                "comment": col[4],
                                "default": col[5]
                            }
                            for col in columns
                        ],
                        "foreign_keys": [
                            {
                                "column": fk[0],
                                "references_table": fk[1],
                                "references_column": fk[2]
                            }
                            for fk in foreign_keys
                        ]
                    }
                print("\n✓ Schema loaded successfully")
                print("--- Schema Loading Completed ---\n")
                return True, schema, None
                
        except Exception as e:
            print(f"\n✗ Schema error: {str(e)}")
            print("--- Schema Loading Failed ---\n")
            return False, None, str(e)

    def execute_query(self, query: str) -> Tuple[bool, Optional[pd.DataFrame], Optional[str]]:
        """
        Execute a SQL query and return results as pandas DataFrame
        Returns: (success: bool, results: Optional[DataFrame], error: Optional[str])
        """
        print(f"\n=== Executing Query ===")
        print(f"Query: {query}")
        
        if not self.pool:
            print("✗ No active connection")
            return False, None, "No active connection"

        try:
            print("Getting connection from pool...")
            with self.pool.get_connection() as conn:
                print("✓ Connected successfully")
                print("Executing query with pandas...")
                df = pd.read_sql(query, conn)
                print(f"✓ Query executed successfully. Result shape: {df.shape}")
                print("=== Query Execution Completed ===\n")
                return True, df, None
                    
        except Exception as e:
            print(f"✗ Query execution error: {str(e)}")
            print("=== Query Execution Failed ===\n")
            return False, None, str(e)

    def test_connection(self) -> Tuple[bool, Optional[str]]:
        """Test if the connection is working"""
        print("\n=== Testing Connection ===")
        if not self.pool:
            print("✗ No active connection pool")
            return False, "No active connection"

        try:
            print("Getting connection from pool...")
            with self.pool.get_connection() as conn:
                print("✓ Got connection from pool")
                cursor = conn.cursor()
                print("Executing test query (SELECT 1)...")
                cursor.execute("SELECT 1")
                print("✓ Test query executed successfully")
                print("=== Connection Test Passed ===\n")
                return True, None
        except Exception as e:
            print(f"✗ Connection test failed: {str(e)}")
            print("=== Connection Test Failed ===\n")
            return False, str(e)

    def close(self):
        """Close the connection pool"""
        print("\n=== Closing Connection ===")
        if self.pool:
            print("Closing connection pool...")
            self.pool = None
            self.current_connection = None
            self.current_schema = None
            print("✓ Connection closed successfully")
        else:
            print("No active connection to close")
        print("=== Connection Close Complete ===\n")
