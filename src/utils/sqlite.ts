import initSqlJs, { Database } from 'sql.js';

// This promise will cache the loaded/initialized database so we only fetch and parse it once.
let dbPromise: Promise<Database> | null = null;

/**
 * Loads the SQLite database that lives in `public/notion.db` using sql.js.
 * The underlying WASM file must be available at `/sql-wasm.wasm`.
 */
export const getDatabase = async (): Promise<Database> => {
  if (dbPromise) return dbPromise;

  dbPromise = (async () => {
    // Initialise sql.js and point it to the wasm file served from the public folder.
    const SQL = await initSqlJs({
      locateFile: (file) => `/${file}`,
    });

    // Fetch the bundled database file.
    const response = await fetch('/notion.db');
    if (!response.ok) {
      throw new Error(`Could not fetch /notion.db – status ${response.status}`);
    }
    const buffer = await response.arrayBuffer();

    // Create the database instance from the binary data.
    return new SQL.Database(new Uint8Array(buffer));
  })();

  return dbPromise;
};

/**
 * Run a parameterized query and return results as array of objects.
 * @param sql SQL query string
 * @param params Optional parameters for the query
 */
export async function runQuery<T = any>(
  sql: string,
  params?: any[],
): Promise<T[]> {
  const db = await getDatabase();
  const stmt = db.prepare(sql);
  if (params) stmt.bind(params);
  const rows: T[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return rows;
}
