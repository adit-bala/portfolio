import { PGlite } from '@electric-sql/pglite';
import { vector } from '@electric-sql/pglite/vector';

// This promise will cache the loaded/initialized database so we only fetch and parse it once.
let dbPromise: Promise<PGlite> | null = null;

/**
 * Loads the PGlite database from the gzipped tarball at `/notion.db.tar.gz`.
 * Uses PGlite's loadDataDir option to load from a pre-built database dump.
 */
export const getDatabase = async (): Promise<PGlite> => {
  if (dbPromise) return dbPromise;

  dbPromise = (async () => {
    // Fetch the bundled database tarball.
    const response = await fetch('/notion.db.tar.gz');
    if (!response.ok) {
      throw new Error(
        `Could not fetch /notion.db.tar.gz – status ${response.status}`,
      );
    }
    const buffer = await response.arrayBuffer();
    const blob = new Blob([buffer]);

    // Create the PGlite instance from the tarball data.
    const db = await PGlite.create({
      extensions: { vector },
      loadDataDir: blob,
    });

    return db;
  })();

  return dbPromise;
};

/**
 * Run a parameterized query and return results as array of objects.
 * @param sql SQL query string (use $1, $2, etc. for parameters)
 * @param params Optional parameters for the query
 */
export async function runQuery<T = any>(
  sql: string,
  params?: any[],
): Promise<T[]> {
  const db = await getDatabase();
  const result = await db.query<T>(sql, params);
  return result.rows;
}
