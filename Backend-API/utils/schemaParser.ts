import { Schema, Table, Column, Relationship } from "../types/schema";

export class SchemaParser {
  async parseSchema(schemaContent: string): Promise<Schema> {
    // Determine if the content is JSON or SQL based on the content
    if (this.isJSON(schemaContent)) {
      return this.parseJSONSchema(schemaContent);
    } else {
      return this.parseSQLSchema(schemaContent);
    }
  }

  private isJSON(str: string): boolean {
    try {
      JSON.parse(str);
      return true;
    } catch (e) {
      return false;
    }
  }

  private parseSQLSchema(content: string): Schema {
    const tableRegex =
      /CREATE TABLE IF NOT EXISTS [`"]?(\w+)[`"]? \(([\s\S]*?)\)[^;]*;/gi;
    const columnRegex = /^\s*[`"]?(\w+)[`"]?\s+([\w()]+)(.*)$/gm;
    const fkRegex =
      /FOREIGN KEY \([`"]?(\w+)[`"]?\) REFERENCES [`"]?(\w+)[`"]? \([`"]?(\w+)[`"]?\)/gi;

    const tables: Table[] = [];
    const relationships: Relationship[] = [];
    let match;

    while ((match = tableRegex.exec(content)) !== null) {
      const [, tableName, columnsBlock] = match;
      const columns: Column[] = [];
      let colMatch;

      // Parse columns
      while ((colMatch = columnRegex.exec(columnsBlock)) !== null) {
        const [, colName, colType, rest] = colMatch;
        // Skip constraints lines (PRIMARY KEY, FOREIGN KEY, etc.)
        if (
          colName.toUpperCase() === "PRIMARY" ||
          colName.toUpperCase() === "FOREIGN"
        )
          continue;
        columns.push({ name: colName, type: colType });
      }

      // Parse foreign keys
      let fkMatch;
      while ((fkMatch = fkRegex.exec(columnsBlock)) !== null) {
        const [, sourceColumn, targetTable, targetColumn] = fkMatch;
        relationships.push({
          from: `${tableName}.${sourceColumn}`,
          to: `${targetTable}.${targetColumn}`,
          type: "foreign key",
        });
      }

      tables.push({ name: tableName, columns });
    }

    return {
      tables,
      relationships,
    };
  }

  private parseJSONSchema(content: string): Schema {
    try {
      const parsed = JSON.parse(content);
      return this.validateSchema(parsed);
    } catch (error) {
      throw new Error("Invalid JSON schema format");
    }
  }

  private validateSchema(schema: any): Schema {
    if (!schema.tables || !Array.isArray(schema.tables)) {
      throw new Error("Invalid schema format: missing tables array");
    }

    const validatedSchema: Schema = {
      tables: [],
      relationships: schema.relationships || [],
    };

    schema.tables.forEach((table: any) => {
      if (!table.name || !table.columns || !Array.isArray(table.columns)) {
        throw new Error("Invalid table format");
      }

      const validatedTable: Table = {
        name: table.name,
        columns: [],
      };

      table.columns.forEach((column: any) => {
        if (!column.name || !column.type) {
          throw new Error("Invalid column format");
        }

        const validatedColumn: Column = {
          name: column.name,
          type: column.type,
          constraints: column.constraints,
        };

        validatedTable.columns.push(validatedColumn);
      });

      validatedSchema.tables.push(validatedTable);
    });

    return validatedSchema;
  }
}
