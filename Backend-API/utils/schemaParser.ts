 // Start of Selection
import { Schema, Table, Column, Relationship } from "../types/schema";

export class SchemaParser {
  async parseSchema(schemaContent: string): Promise<Schema> {
    // Quick JSON check by trimming and looking for object/array start
    const trimmed = schemaContent.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      return this.parseJSONSchema(trimmed);
    }
    return this.parseSQLSchema(schemaContent);
  }

  private parseSQLSchema(content: string): Schema {
    const tables: Table[] = [];
    const relationships: Relationship[] = [];

    // Match CREATE TABLE statements with everything inside parentheses
    const createTableRegex =
      /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"]?([\w\d_]+)[`"]?\s*\(([\s\S]*?)\)\s*;/gi;
    let tableMatch: RegExpExecArray | null;

    while ((tableMatch = createTableRegex.exec(content)) !== null) {
      const tableName = tableMatch[1];
      const body = tableMatch[2];
      const defs = this.splitSQLDefinitions(body);
      const columns: Column[] = [];

      defs.forEach((def) => {
        const line = def.trim();

        // Capture table-level foreign keys
        const fk = /FOREIGN\s+KEY\s*\([`"]?([\w\d_]+)[`"]?\)\s+REFERENCES\s+[`"]?([\w\d_]+)[`"]?\s*\([`"]?([\w\d_]+)[`"]?\)/i.exec(
          line
        );
        if (fk) {
          relationships.push({
            from: `${tableName}.${fk[1]}`,
            to: `${fk[2]}.${fk[3]}`,
            type: "foreign key",
          });
          return;
        }

        // Capture column definition: name, type (with optional precision), rest (constraints)
        const col = /^`?([\w\d_]+)`?\s+([A-Za-z]+(?:\s*\([\d,]+\))?)([\s\S]*)$/i.exec(
          line
        );
        if (col) {
          const [, name, type, rest] = col;
          const constraints = (rest.match(
            /NOT NULL|NULL|UNIQUE|PRIMARY KEY|AUTO_INCREMENT|DEFAULT\s+[^ ,)]+/gi
          ) || []).map((c) => c.trim());
          columns.push({
            name,
            type: type.trim(),
            constraints: constraints.length ? constraints : undefined,
          });
        }
      });

      tables.push({ name: tableName, columns });
    }

    return { tables, relationships };
  }

  /**
   * Splits a CREATE TABLE body on top-level commas,
   * ignoring commas inside parentheses (e.g. enum or precision lists).
   */
  private splitSQLDefinitions(body: string): string[] {
    const parts: string[] = [];
    let buffer = "";
    let depth = 0;

    for (const char of body) {
      if (char === "(") depth++;
      if (char === ")") depth--;
      if (char === "," && depth === 0) {
        parts.push(buffer);
        buffer = "";
      } else {
        buffer += char;
      }
    }
    if (buffer.trim()) parts.push(buffer);
    return parts;
  }

  private parseJSONSchema(content: string): Schema {
    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error("Invalid JSON schema format");
    }
    if (!Array.isArray(parsed.tables)) {
      throw new Error("JSON schema must include a tables array");
    }

    const tables: Table[] = parsed.tables.map((tbl: any) => {
      if (typeof tbl.name !== "string" || !Array.isArray(tbl.columns)) {
        throw new Error("Invalid table definition in JSON schema");
      }
      const cols: Column[] = tbl.columns.map((col: any) => {
        if (typeof col.name !== "string" || typeof col.type !== "string") {
          throw new Error("Invalid column definition in JSON schema");
        }
        return {
          name: col.name,
          type: col.type,
          constraints: Array.isArray(col.constraints)
            ? col.constraints
            : undefined,
        };
      });
      return { name: tbl.name, columns: cols };
    });

    const relationships: Relationship[] = Array.isArray(parsed.relationships)
      ? parsed.relationships
          .filter(
            (rel: any) =>
              typeof rel.from === "string" &&
              typeof rel.to === "string" &&
              typeof rel.type === "string"
          )
          .map((rel: any) => ({
            from: rel.from,
            to: rel.to,
            type: rel.type,
          }))
      : [];

    return { tables, relationships };
  }
}
