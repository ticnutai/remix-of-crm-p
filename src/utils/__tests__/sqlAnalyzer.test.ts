/**
 * SQL Analyzer Tests - בדיקות ניתוח SQL
 * כולל: ניתוח פקודות, זיהוי סיכונים, פרסור שגיאות, טוקניזציה
 */
import { describe, it, expect } from "vitest";
import {
  analyzeSql,
  parseError,
  getRiskColor,
  getRiskBadgeVariant,
  getRiskLabel,
  tokenizeSql,
} from "@/utils/sqlAnalyzer";

describe("SQL Analyzer", () => {
  // ==================== analyzeSql ====================
  describe("analyzeSql", () => {
    it("should detect CREATE TABLE operation", () => {
      const result = analyzeSql(
        "CREATE TABLE users (id UUID PRIMARY KEY, name TEXT);",
      );
      expect(result.operationTypes).toContain("CREATE TABLE");
      expect(result.affectedTables).toContain("users");
      expect(result.estimatedRisk).toBe("low");
    });

    it("should detect DROP TABLE as critical risk", () => {
      const result = analyzeSql("DROP TABLE users;");
      expect(result.operationTypes).toContain("DROP TABLE");
      expect(result.estimatedRisk).toBe("critical");
      expect(result.warnings.some((w) => w.includes("DROP TABLE"))).toBe(true);
    });

    it("should detect TRUNCATE as critical risk", () => {
      const result = analyzeSql("TRUNCATE TABLE clients;");
      expect(result.estimatedRisk).toBe("critical");
      expect(result.warnings.some((w) => w.includes("TRUNCATE"))).toBe(true);
    });

    it("should warn about DELETE without WHERE", () => {
      const result = analyzeSql("DELETE FROM clients;");
      expect(result.operationTypes).toContain("DELETE");
      expect(result.estimatedRisk).toBe("high");
      expect(
        result.warnings.some(
          (w) => w.includes("DELETE") && w.includes("WHERE"),
        ),
      ).toBe(true);
    });

    it("should NOT warn about DELETE with WHERE", () => {
      const result = analyzeSql("DELETE FROM clients WHERE id = '123';");
      expect(
        result.warnings.some(
          (w) => w.includes("DELETE") && w.includes("WHERE"),
        ),
      ).toBe(false);
    });

    it("should warn about UPDATE without WHERE", () => {
      const result = analyzeSql("UPDATE clients SET status = 'active';");
      expect(
        result.warnings.some(
          (w) => w.includes("UPDATE") && w.includes("WHERE"),
        ),
      ).toBe(true);
    });

    it("should detect transactions", () => {
      const result = analyzeSql("BEGIN; INSERT INTO users VALUES (1); COMMIT;");
      expect(result.hasTransaction).toBe(true);
      expect(result.warnings.some((w) => w.includes("טרנזקציה"))).toBe(true);
    });

    it("should detect functions", () => {
      const sql = `
        CREATE OR REPLACE FUNCTION test_fn()
        RETURNS void AS $$
        BEGIN
          RAISE NOTICE 'hello';
        END;
        $$ LANGUAGE plpgsql;
      `;
      const result = analyzeSql(sql);
      expect(result.hasFunction).toBe(true);
      expect(result.operationTypes).toContain("CREATE FUNCTION");
    });

    it("should count statements correctly", () => {
      const result = analyzeSql("SELECT 1; SELECT 2; SELECT 3;");
      expect(result.statementCount).toBe(3);
    });

    it("should not count semicolons inside $$ function bodies as statements", () => {
      const sql = `
        CREATE FUNCTION test() RETURNS void AS $$
        BEGIN
          INSERT INTO log VALUES (1);
          INSERT INTO log VALUES (2);
        END;
        $$ LANGUAGE plpgsql;
      `;
      const result = analyzeSql(sql);
      // Only the outer CREATE statement + the final semicolon
      expect(result.statementCount).toBeLessThanOrEqual(2);
    });

    it("should suggest IF NOT EXISTS for CREATE TABLE", () => {
      const result = analyzeSql("CREATE TABLE new_table (id UUID);");
      expect(result.warnings.some((w) => w.includes("IF NOT EXISTS"))).toBe(
        true,
      );
    });

    it("should NOT suggest IF NOT EXISTS when already present", () => {
      const result = analyzeSql(
        "CREATE TABLE IF NOT EXISTS new_table (id UUID);",
      );
      expect(result.warnings.some((w) => w.includes("IF NOT EXISTS"))).toBe(
        false,
      );
    });

    it("should detect multiple operation types", () => {
      const sql = `
        CREATE TABLE test (id INT);
        INSERT INTO test VALUES (1);
        UPDATE test SET id = 2 WHERE id = 1;
      `;
      const result = analyzeSql(sql);
      expect(result.operationTypes).toContain("CREATE TABLE");
      expect(result.operationTypes).toContain("INSERT");
      expect(result.operationTypes).toContain("UPDATE");
    });

    it("should calculate line and char count", () => {
      const sql = "SELECT 1;\nSELECT 2;";
      const result = analyzeSql(sql);
      expect(result.lineCount).toBe(2);
      expect(result.charCount).toBe(sql.length);
    });

    it("should warn about long SQL files", () => {
      const sql = Array(101).fill("SELECT 1;").join("\n");
      const result = analyzeSql(sql);
      expect(result.warnings.some((w) => w.includes("ארוך"))).toBe(true);
    });

    it("should detect ALTER TABLE as medium risk", () => {
      const result = analyzeSql("ALTER TABLE clients ADD COLUMN age INT;");
      expect(result.operationTypes).toContain("ALTER TABLE");
      expect(result.estimatedRisk).toBe("medium");
    });

    it("should detect GRANT/REVOKE operations", () => {
      const result = analyzeSql("REVOKE ALL ON public.clients FROM anon;");
      expect(result.operationTypes).toContain("REVOKE");
      expect(result.estimatedRisk).toBe("high");
    });

    it("should handle empty SQL", () => {
      const result = analyzeSql("");
      expect(result.statementCount).toBe(0);
      expect(result.operationTypes).toHaveLength(0);
    });

    it("should count single statement without semicolon", () => {
      const result = analyzeSql("SELECT 1");
      expect(result.statementCount).toBe(1);
    });
  });

  // ==================== parseError ====================
  describe("parseError", () => {
    it("should extract error code (5-digit numeric)", () => {
      // The regex expects 5 digits after ERROR: - e.g. 42601
      const result = parseError("ERROR: 42601 syntax error");
      expect(result.code).toBe("42601");
      expect(result.hint).toContain("תחביר");
    });

    it("should handle alphanumeric PG error codes (not matched by regex)", () => {
      // Codes like 42P01 contain letters - current regex only matches \d{5}
      const result = parseError("ERROR: 42P01 relation does not exist");
      expect(result.code).toBeUndefined();
    });

    it("should extract position with colon format", () => {
      // Regex: /(?:position|Position|at position)\s*[:"]+\s*(\d+)/
      const result = parseError("ERROR: syntax error at position: 42");
      expect(result.position).toBe(42);
    });

    it("should calculate line from position", () => {
      const sql = "SELECT 1;\nSELECT bad syntax;";
      const result = parseError("ERROR: syntax error at position: 20", sql);
      expect(result.line).toBeGreaterThan(0);
    });

    it("should generate suggestedFix only when code is extracted", () => {
      // Since 42P07/42P01 contain letters and regex only matches \d{5},
      // suggestedFix won't be set for these codes
      const result = parseError("ERROR: 42P07 relation already exists");
      expect(result.suggestedFix).toBeUndefined();

      // But for pure numeric codes like 42601 it works
      const result2 = parseError("ERROR: 42601 syntax error");
      expect(result2.suggestedFix).toContain("תחביר");
    });

    it("should generate suggested fix for syntax error", () => {
      const result = parseError("ERROR: 42601 syntax error");
      expect(result.suggestedFix).toContain("תחביר");
    });

    it("should handle error without code", () => {
      const result = parseError("Something went wrong");
      expect(result.message).toBe("Something went wrong");
      expect(result.code).toBeUndefined();
    });

    it("should extract line number with colon", () => {
      // Regex: /(?:line|Line|שורה)\s*[:"]+\s*(\d+)/
      const result = parseError("ERROR: syntax error at line: 5");
      expect(result.line).toBe(5);
    });

    it("should extract context", () => {
      const result = parseError("ERROR: something\nCONTEXT: PL/pgSQL function");
      expect(result.context).toContain("PL/pgSQL");
    });
  });

  // ==================== Risk UI helpers ====================
  describe("getRiskColor", () => {
    it("should return correct colors", () => {
      expect(getRiskColor("low")).toContain("green");
      expect(getRiskColor("medium")).toContain("yellow");
      expect(getRiskColor("high")).toContain("orange");
      expect(getRiskColor("critical")).toContain("red");
    });
  });

  describe("getRiskBadgeVariant", () => {
    it("should return correct variants", () => {
      expect(getRiskBadgeVariant("low")).toBe("secondary");
      expect(getRiskBadgeVariant("medium")).toBe("outline");
      expect(getRiskBadgeVariant("high")).toBe("destructive");
      expect(getRiskBadgeVariant("critical")).toBe("destructive");
    });
  });

  describe("getRiskLabel", () => {
    it("should return Hebrew labels", () => {
      expect(getRiskLabel("low")).toContain("נמוך");
      expect(getRiskLabel("medium")).toContain("בינוני");
      expect(getRiskLabel("high")).toContain("גבוה");
      expect(getRiskLabel("critical")).toContain("קריטי");
    });
  });

  // ==================== tokenizeSql ====================
  describe("tokenizeSql", () => {
    it("should tokenize keywords", () => {
      const tokens = tokenizeSql("SELECT * FROM users");
      const keywords = tokens.filter((t) => t.type === "keyword");
      expect(keywords.map((k) => k.text.toUpperCase())).toContain("SELECT");
      expect(keywords.map((k) => k.text.toUpperCase())).toContain("FROM");
    });

    it("should tokenize strings", () => {
      const tokens = tokenizeSql("SELECT 'hello world'");
      const strings = tokens.filter((t) => t.type === "string");
      expect(strings.length).toBeGreaterThan(0);
      expect(strings[0].text).toContain("hello world");
    });

    it("should tokenize comments", () => {
      const tokens = tokenizeSql("SELECT 1 -- this is a comment");
      const comments = tokens.filter((t) => t.type === "comment");
      expect(comments.length).toBeGreaterThan(0);
    });

    it("should tokenize numbers", () => {
      const tokens = tokenizeSql("SELECT 42, 3.14");
      const numbers = tokens.filter((t) => t.type === "number");
      expect(numbers.length).toBe(2);
    });

    it("should tokenize identifiers", () => {
      const tokens = tokenizeSql("SELECT name FROM users");
      const identifiers = tokens.filter((t) => t.type === "identifier");
      expect(identifiers.map((i) => i.text)).toContain("name");
      expect(identifiers.map((i) => i.text)).toContain("users");
    });

    it("should handle empty SQL", () => {
      const tokens = tokenizeSql("");
      expect(tokens).toHaveLength(0);
    });
  });
});
