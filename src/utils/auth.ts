import { MongoClient } from "mongodb";
import "dotenv/config";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/digital_wallet";

// Singleton pattern for MongoDB client
let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
    var _mongoClientPromise: Promise<MongoClient>;
}

if (!process.env.MONGODB_URI) {
    console.warn("MONGODB_URI not found in environment variables, falling back to localhost or failing.");
}

if (process.env.NODE_ENV === "development") {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    if (!global._mongoClientPromise) {
        client = new MongoClient(uri);
        global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
} else {
    // In production mode, it's best to not use a global variable.
    client = new MongoClient(uri);
    clientPromise = client.connect();
}

// Better Auth expects a Db instance.
const db = client!.db();

// Lazy initialization for better-auth (ESM-only package)
let authInstance: any = null;

export async function getAuth() {
    if (authInstance) {
        return authInstance;
    }

    // Use new Function to bypass TypeScript's CommonJS require() transformation
    const { betterAuth } = await (new Function("return import('better-auth')")());
    const { mongodbAdapter } = await (new Function("return import('better-auth/adapters/mongodb')")());

    authInstance = betterAuth({
        database: mongodbAdapter(db),
        socialProviders: {
            google: {
                clientId: process.env.GOOGLE_CLIENT_ID || "",
                clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
            },
            github: {
                clientId: process.env.GITHUB_CLIENT_ID || "",
                clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
            },
        },
        emailAndPassword: {
            enabled: true,
        },
        user: {
            additionalFields: {
                role: {
                    type: "string",
                    defaultValue: "user",
                },
                firstName: {
                    type: "string",
                    required: false
                }
            }
        }
    });

    return authInstance;
}

// For backwards compatibility, export a proxy that lazily loads auth
// This allows existing code using `auth.api.getSession` to work
export const auth = new Proxy({} as any, {
    get(_target, prop) {
        return new Proxy({}, {
            get(_t, subProp) {
                return async (...args: any[]) => {
                    const authObj = await getAuth();
                    return authObj[prop][subProp](...args);
                };
            }
        });
    }
});
