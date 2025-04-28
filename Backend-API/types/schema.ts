export interface Schema {
  tables: Table[];
  relationships: Relationship[];
}

export interface Table {
  name: string;
  columns: Column[];
}

export interface Column {
  name: string;
  type: string;
  constraints?: string[];
}

export interface Relationship {
  from: string;
  to: string;
  type: string;
}
