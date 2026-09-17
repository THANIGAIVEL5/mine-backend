const sequelize = require('../db');
const { QueryTypes } = require('sequelize');

class TextToSqlService {
  constructor() {
    this.schemaPrompt = `
You are the MINE GUARDER Text-to-SQL AI Engine for Chasnala Deep Mine (Sector 4B).
You convert operator questions into VALID, READ-ONLY SQLite queries.

Database Schema (SQLite):

1. Table: telemetry_logs
   Columns:
   - id (INTEGER PRIMARY KEY)
   - site (TEXT, e.g., 'Chasnala Deep Mine Sector 4B')
   - sector (TEXT, e.g., 'Sector 4B')
   - phase (TEXT, e.g., 'STABLE', 'WARNING', 'CRITICAL')
   - pitch (REAL, strata roof flexure angle in degrees)
   - roll (REAL, strata roll angle in degrees)
   - rms (REAL, micro-seismic vibration RMS in g)
   - co (INTEGER, Carbon Monoxide gas in PPM)
   - ch4 (REAL, Methane gas concentration in %)
   - disp (REAL, roof delamination displacement in mm)
   - sump (REAL, drainage sump water level in meters)
   - temp (REAL, ambient temperature in °C)
   - timestamp (DATETIME)

2. Table: incident_alerts
   Columns:
   - id (INTEGER PRIMARY KEY)
   - sector (TEXT, e.g., 'Sector 4B', 'Shaft 12')
   - severity (TEXT, 'INFO', 'WARNING', 'CRITICAL')
   - alert_type (TEXT, e.g., 'GAS_CO_SPIKE', 'STRATA_DELAMINATION', 'SEISMIC_TREMOR', 'SUMP_WATER_INRUSH')
   - description (TEXT)
   - action_taken (TEXT)
   - timestamp (DATETIME)

3. Table: miner_shifts
   Columns:
   - id (INTEGER PRIMARY KEY)
   - miner_id (TEXT, e.g., 'MNR-401')
   - name (TEXT)
   - role (TEXT, e.g., 'Face Miner', 'Shift In-Charge', 'Ventilation Tech')
   - sector (TEXT, e.g., 'Sector 4B')
   - zone (TEXT, e.g., 'Drift 12', 'Shaft 12', 'Pillar 4B Gallery', 'Refuge Bay 3B')
   - scsr_status (TEXT, 'OPERATIONAL', 'DEPLOYED')
   - status (TEXT, 'ACTIVE_UNDERGROUND', 'SURFACE_STANDBY', 'EVACUATED')
   - shift_start (DATETIME)

4. Table: safety_audits
   Columns:
   - id (INTEGER PRIMARY KEY)
   - form_type (TEXT, e.g., 'DGMS Form IV')
   - auditor (TEXT)
   - sector (TEXT)
   - compliance_rating (TEXT, '100% COMPLIANT', 'NEEDS_ATTENTION', 'NON_COMPLIANT')
   - dgms_rule_reference (TEXT)
   - findings (TEXT)
   - created_at (DATETIME)

STRICT RULES:
1. Generate ONLY a raw, single-line executable SQLite SELECT statement. Do NOT include markdown code blocks (\`\`\`sql), line breaks, or explanatory text.
2. ONLY generate SELECT queries. Never use INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE, or CREATE.
3. Order results by timestamp DESC or id DESC when relevant.
4. Limit results to 50 rows maximum.
`;
  }

  /**
   * Validate and sanitize SQL query for security (Strictly Read-Only SELECT)
   */
  validateAndSanitizeSql(rawSql) {
    if (!rawSql || typeof rawSql !== 'string') {
      throw new Error('Invalid SQL generated.');
    }

    // Clean markdown code fences or quotes
    let sql = rawSql.replace(/```sql/gi, '').replace(/```/g, '').trim();
    
    // Extract first statement if multiple exist
    if (sql.includes(';')) {
      sql = sql.split(';')[0].trim();
    }

    const uppercaseSql = sql.toUpperCase();

    // Check if query starts with SELECT or WITH
    if (!uppercaseSql.startsWith('SELECT') && !uppercaseSql.startsWith('WITH')) {
      throw new Error('Security Violation: Only read-only SELECT queries are allowed.');
    }

    // Blacklisted mutating keywords
    const forbiddenKeywords = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'TRUNCATE', 'CREATE', 'REPLACE', 'ATTACH', 'DETACH', 'PRAGMA', 'VACUUM', 'EXEC', 'EXECUTE'];
    for (const kw of forbiddenKeywords) {
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      if (regex.test(sql)) {
        throw new Error(`Security Violation: Forbidden keyword '${kw}' detected.`);
      }
    }

    // Append LIMIT 50 if missing
    if (!/\bLIMIT\b/i.test(sql)) {
      sql += ' LIMIT 50';
    }

    return sql;
  }

  /**
   * AI Translation Engine: Converts Natural Language Prompt to SQL
   */
  async generateSqlFromPrompt(naturalLanguageQuery, options = {}) {
    const { apiKey, cfToken, cfAccountId } = options;

    // 1. Try Google Gemini API
    if (apiKey) {
      try {
        const models = ['antigravity-preview-09-2026', 'gemini-2.5-flash-native-audio-latest', 'gemini-1.5-flash-latest', 'gemini-2.0-flash-exp'];
        for (const model of models) {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              system_instruction: { parts: [{ text: this.schemaPrompt }] },
              contents: [{ role: 'user', parts: [{ text: `Convert this question to SQLite SQL: "${naturalLanguageQuery}"` }] }],
              generationConfig: { temperature: 0.1, maxOutputTokens: 150 }
            })
          });
          if (res.ok) {
            const data = await res.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) return text.trim();
          }
        }
      } catch (e) {
        console.warn('Text-to-SQL Gemini API bypass:', e.message);
      }
    }

    // 2. Try Cloudflare Workers AI
    if (cfToken && cfAccountId) {
      try {
        const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/@cf/meta/llama-3.1-8b-instruct`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${cfToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: this.schemaPrompt },
              { role: 'user', content: `Convert this question to SQLite SQL: "${naturalLanguageQuery}"` }
            ],
            max_tokens: 150
          })
        });
        if (res.ok) {
          const data = await res.json();
          const reply = data?.result?.response || data?.result?.choices?.[0]?.message?.content;
          if (reply) return reply.trim();
        }
      } catch (e) {
        console.warn('Text-to-SQL Cloudflare AI bypass:', e.message);
      }
    }

    // 3. Smart Rule-Based SQL Fallback Engine for Common Domain Queries
    return this.getFallbackSqlPattern(naturalLanguageQuery);
  }

  /**
   * Rule-Based Pattern Fallback Engine
   */
  getFallbackSqlPattern(query) {
    const q = (query || '').toLowerCase();

    if (/incident|alert|warning|critical/i.test(q)) {
      return 'SELECT * FROM incident_alerts ORDER BY id DESC LIMIT 20;';
    }
    if (/miner|personnel|staff|worker|shift/i.test(q)) {
      return "SELECT miner_id, name, role, zone, status, scsr_status FROM miner_shifts WHERE status = 'ACTIVE_UNDERGROUND' LIMIT 20;";
    }
    if (/audit|compliance|dgms|form iv/i.test(q)) {
      return 'SELECT id, form_type, auditor, compliance_rating, dgms_rule_reference, findings FROM safety_audits ORDER BY id DESC LIMIT 20;';
    }
    if (/max|highest|peak/i.test(q) && /displacement|delamination/i.test(q)) {
      return 'SELECT MAX(disp) AS max_displacement_mm, AVG(disp) AS avg_disp_mm FROM telemetry_logs;';
    }
    if (/gas|co|carbon monoxide/i.test(q)) {
      return 'SELECT id, phase, co, ch4, temp, timestamp FROM telemetry_logs ORDER BY id DESC LIMIT 20;';
    }
    if (/vibration|seismic|rms/i.test(q)) {
      return 'SELECT id, phase, rms, pitch, roll, timestamp FROM telemetry_logs ORDER BY id DESC LIMIT 20;';
    }

    // Default Telemetry Query
    return 'SELECT id, phase, pitch, roll, rms, co, disp, sump, temp, timestamp FROM telemetry_logs ORDER BY id DESC LIMIT 20;';
  }

  /**
   * Generate AI Natural Language Summary of SQL Results
   */
  async summarizeResults(naturalLanguageQuery, sql, results, options = {}) {
    const rowCount = results ? results.length : 0;
    if (rowCount === 0) {
      return `[MINE GUARDER SQL ENGINE] No records matched query "${naturalLanguageQuery}".`;
    }

    const sample = results.slice(0, 3);
    const sampleStr = JSON.stringify(sample);

    return `[MINE GUARDER SQL ENGINE] Executed SQL query successfully (${rowCount} records returned).\n` +
      `Query Result Summary for "${naturalLanguageQuery}": Found ${rowCount} relevant record(s). ` +
      `Latest Record Sample: ${sampleStr.substring(0, 180)}...`;
  }

  /**
   * Main Text-to-SQL Execution Pipeline
   */
  async processTextToSql(naturalLanguageQuery, options = {}) {
    const startTime = Date.now();

    // Step 1: Translate Prompt to Raw SQL
    const rawSql = await this.generateSqlFromPrompt(naturalLanguageQuery, options);

    // Step 2: Validate & Sanitize SQL Query (Read-Only Check)
    const sanitizedSql = this.validateAndSanitizeSql(rawSql);

    // Step 3: Safe Database Execution
    let results = [];
    try {
      results = await sequelize.query(sanitizedSql, { type: QueryTypes.SELECT });
    } catch (dbErr) {
      throw new Error(`SQL Execution Error: ${dbErr.message}`);
    }

    const executionTimeMs = Date.now() - startTime;

    // Step 4: Synthesize Natural Language Summary
    const naturalSummary = await this.summarizeResults(naturalLanguageQuery, sanitizedSql, results, options);

    return {
      query: naturalLanguageQuery,
      generatedSql: sanitizedSql,
      results: results,
      rowCount: results.length,
      naturalSummary: naturalSummary,
      executionTimeMs: executionTimeMs
    };
  }
}

module.exports = new TextToSqlService();
