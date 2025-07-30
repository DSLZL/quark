import { Index } from "flexsearch";
import Database from "flexsearch/db/postgres";
import pgp from "pg-promise";

let mountedIndex = null;

/**
 * Gets a singleton instance of a mounted FlexSearch index connected to PostgreSQL.
 * @returns {Promise<Index>} A promise that resolves to the mounted FlexSearch index.
 */
export async function getMountedIndex() {
    if (mountedIndex) {
        return mountedIndex;
    }

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error("DATABASE_URL environment variable is not set.");
    }

    try {
        // pg-promise can take the connection string directly.
        // It should handle the `sslmode=require` parameter correctly.
        const dbInstance = pgp()(connectionString);

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