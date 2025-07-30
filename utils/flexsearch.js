import { Index } from "flexsearch";
import { Database } from "flexsearch/db/postgres";
import pgp from "pg-promise";

let mountedIndex = null;

/**
 * Parses a PostgreSQL connection URL and returns a connection object.
 * @param {string} url - The PostgreSQL connection URL.
 * @returns {object} A pg-promise connection object.
 */
function parseDatabaseUrl(url) {
    if (!url) {
        throw new Error("DATABASE_URL environment variable is not set.");
    }
    const match = url.match(/postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    if (!match) {
        throw new Error("Invalid DATABASE_URL format.");
    }
    const [, user, password, host, port, database] = match;
    return {
        host,
        port: parseInt(port, 10),
        database,
        user,
        password,
    };
}

/**
 * Gets a singleton instance of a mounted FlexSearch index connected to PostgreSQL.
 * @returns {Promise<Index>} A promise that resolves to the mounted FlexSearch index.
 */
export async function getMountedIndex() {
    if (mountedIndex) {
        return mountedIndex;
    }

    try {
        const connectionDetails = parseDatabaseUrl(process.env.DATABASE_URL);
        const dbInstance = pgp()(connectionDetails);

        const index = new Index({
            preset: "performance",
            tokenize: "full",
            context: true,
        });

        const db = new Database("quark_search_index", { db: dbInstance });

        await index.mount(db);

        mountedIndex = index;
        console.log("FlexSearch index mounted successfully.");
        return mountedIndex;
    } catch (error) {
        console.error("Failed to mount FlexSearch index:", error);
        throw error;
    }
}