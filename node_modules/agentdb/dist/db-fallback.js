/**
 * Database System using sql.js (WASM SQLite)
 * Pure JavaScript implementation with NO build dependencies
 *
 * SECURITY: Fixed SQL injection vulnerabilities:
 * - PRAGMA commands validated against whitelist
 * - Removed eval() usage (replaced with async import)
 */
import { validatePragmaCommand, ValidationError } from './security/input-validation.js';
import * as fs from 'fs';
import * as path from 'path';
let sqlJsWrapper = null;
/**
 * Get sql.js database implementation (ONLY sql.js, no better-sqlite3)
 */
export async function getDatabaseImplementation() {
    // Return cached wrapper
    if (sqlJsWrapper) {
        return sqlJsWrapper;
    }
    try {
        console.log('✅ Using sql.js (WASM SQLite, no build tools required)');
        // sql.js requires async initialization
        const mod = await import('sql.js');
        const SQL = await mod.default();
        // Create database wrapper
        sqlJsWrapper = createSqlJsWrapper(SQL);
        return sqlJsWrapper;
    }
    catch (error) {
        console.error('❌ Failed to initialize sql.js:', error.message);
        throw new Error('Failed to initialize SQLite. Please ensure sql.js is installed:\n' +
            'npm install sql.js');
    }
}
/**
 * Create a better-sqlite3 compatible wrapper around sql.js
 * This allows AgentDB to work (with reduced performance) without native compilation
 */
function createSqlJsWrapper(SQL) {
    return class SqlJsDatabase {
        db;
        filename;
        constructor(filename, options) {
            this.filename = filename;
            // In-memory database
            if (filename === ':memory:') {
                this.db = new SQL.Database();
            }
            else {
                // File-based database - use safe fs module (no eval)
                try {
                    if (fs.existsSync(filename)) {
                        const buffer = fs.readFileSync(filename);
                        this.db = new SQL.Database(buffer);
                    }
                    else {
                        this.db = new SQL.Database();
                    }
                }
                catch (error) {
                    console.warn('⚠️  Could not read database file:', error.message);
                    this.db = new SQL.Database();
                }
            }
        }
        prepare(sql) {
            const stmt = this.db.prepare(sql);
            return {
                run: (...params) => {
                    stmt.bind(params);
                    stmt.step();
                    stmt.reset();
                    return {
                        changes: this.db.getRowsModified(),
                        lastInsertRowid: this.db.exec('SELECT last_insert_rowid()')[0]?.values[0]?.[0] || 0
                    };
                },
                get: (...params) => {
                    stmt.bind(params);
                    const hasRow = stmt.step();
                    if (!hasRow) {
                        stmt.reset();
                        return undefined;
                    }
                    const columns = stmt.getColumnNames();
                    const values = stmt.get();
                    stmt.reset();
                    const result = {};
                    columns.forEach((col, idx) => {
                        result[col] = values[idx];
                    });
                    return result;
                },
                all: (...params) => {
                    stmt.bind(params);
                    const results = [];
                    while (stmt.step()) {
                        const columns = stmt.getColumnNames();
                        const values = stmt.get();
                        const result = {};
                        columns.forEach((col, idx) => {
                            result[col] = values[idx];
                        });
                        results.push(result);
                    }
                    stmt.reset();
                    return results;
                },
                finalize: () => {
                    stmt.free();
                }
            };
        }
        exec(sql) {
            return this.db.exec(sql);
        }
        save() {
            // Save to file if needed
            if (this.filename !== ':memory:') {
                try {
                    // Create parent directories if they don't exist
                    const dir = path.dirname(this.filename);
                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir, { recursive: true });
                    }
                    const data = this.db.export();
                    fs.writeFileSync(this.filename, Buffer.from(data));
                }
                catch (error) {
                    console.error('❌ Could not save database to file:', error.message);
                    throw error;
                }
            }
        }
        close() {
            // Save to file before closing
            this.save();
            this.db.close();
        }
        pragma(pragma, options) {
            try {
                // SECURITY: Validate PRAGMA command against whitelist to prevent SQL injection
                const validatedPragma = validatePragmaCommand(pragma);
                // Execute validated PRAGMA
                const result = this.db.exec(`PRAGMA ${validatedPragma}`);
                return result[0]?.values[0]?.[0];
            }
            catch (error) {
                if (error instanceof ValidationError) {
                    console.error(`❌ Invalid PRAGMA command: ${error.message}`);
                    throw error;
                }
                throw error;
            }
        }
        transaction(fn) {
            // Return a function that executes the transaction when called
            // This matches better-sqlite3 API where transaction() returns a callable function
            return () => {
                try {
                    this.db.exec('BEGIN TRANSACTION');
                    const result = fn();
                    this.db.exec('COMMIT');
                    return result;
                }
                catch (error) {
                    this.db.exec('ROLLBACK');
                    throw error;
                }
            };
        }
    };
}
/**
 * Create a database instance using sql.js
 */
export async function createDatabase(filename, options) {
    const DatabaseImpl = await getDatabaseImplementation();
    return new DatabaseImpl(filename, options);
}
/**
 * Get information about current database implementation
 */
export function getDatabaseInfo() {
    return {
        implementation: 'sql.js (WASM)',
        isNative: false,
        performance: 'medium',
        requiresBuildTools: false
    };
}
//# sourceMappingURL=db-fallback.js.map