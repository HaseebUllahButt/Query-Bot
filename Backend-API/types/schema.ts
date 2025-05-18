export interface Schema {
  tables: Table[];
  relationships: Relationship[];
  databaseName: string;
}

export interface Table {
  name: string;
  columns: Column[];
}

export interface Column {
  name: string;
  type: string;
  constraints?: string[];
  isPrimaryKey?: boolean;
}

export interface Relationship {
  from: string;
  to: string;
  type: string;
}
