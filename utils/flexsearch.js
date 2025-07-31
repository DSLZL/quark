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
            async: true, // 推荐用于服务端
            worker: true, // 启用多线程
            // 添加冲突处理策略
            onconflict: {
                // 当文档ID已存在时，不执行任何操作
                "add": (current, a) => {
                    return current;
                },
                // 当文档ID已存在时，用新内容替换旧内容
                "update": (current, u) => {
                    return u;
                }
            }
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