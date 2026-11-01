import dns from "node:dns";
import mongoose from "mongoose";

const DEFAULT_DNS_SERVERS = ["1.1.1.1", "8.8.8.8"];
const DEFAULT_ATLAS_FALLBACK_HOSTS = [
  "ac-pbuuao2-shard-00-00.lxc6cvj.mongodb.net:27017",
  "ac-pbuuao2-shard-00-01.lxc6cvj.mongodb.net:27017",
  "ac-pbuuao2-shard-00-02.lxc6cvj.mongodb.net:27017",
];

const splitCsv = (value, fallback = []) => {
  const items = String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return items.length ? items : fallback;
};

const configureNodeDns = () => {
  const servers = splitCsv(process.env.DNS_SERVERS, DEFAULT_DNS_SERVERS);

  try {
    dns.setServers(servers);
    console.log(`DNS resolvers configured for Node.js: ${servers.join(", ")}`);
  } catch (error) {
    console.warn(
      `Could not configure custom DNS resolvers: ${error?.message || error}`
    );
  }
};

const isSrvDnsError = (error) => {
  let current = error;

  for (let depth = 0; current && depth < 6; depth += 1) {
    const code = String(current.code || "").toUpperCase();
    const syscall = String(current.syscall || "").toLowerCase();
    const message = String(current.message || "").toLowerCase();

    if (
      syscall === "querysrv" ||
      message.includes("querysrv") ||
      ["ECONNREFUSED", "ENOTFOUND", "ETIMEOUT", "ESERVFAIL", "EREFUSED"].includes(
        code
      )
    ) {
      return true;
    }

    current = current.cause;
  }

  return false;
};

/**
 * Convert an Atlas mongodb+srv URI to a normal seed-list URI.
 * This bypasses SRV DNS lookups when Node/c-ares is blocked even though
 * Windows Resolve-DnsName can resolve the same record.
 */
const buildStandardMongoUri = (srvUri, hosts) => {
  const parsed = new URL(srvUri);

  if (parsed.protocol !== "mongodb+srv:") {
    return srvUri;
  }

  if (!hosts.length) {
    throw new Error(
      "MONGO_FALLBACK_HOSTS is empty. Add the Atlas shard hosts to backend .env."
    );
  }

  const username = parsed.username;
  const password = parsed.password;
  const credentials = username
    ? `${username}${password ? `:${password}` : ""}@`
    : "";

  const databasePath = parsed.pathname && parsed.pathname !== "/" ? parsed.pathname : "/";
  const params = new URLSearchParams(parsed.searchParams);

  // SRV TXT records normally supply authSource. A normal mongodb:// URI does not.
  if (!params.has("authSource")) params.set("authSource", "admin");
  params.set("tls", "true");

  const query = params.toString();
  return `mongodb://${credentials}${hosts.join(",")}${databasePath}${
    query ? `?${query}` : ""
  }`;
};

const connectionOptions = {
  serverSelectionTimeoutMS: Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS || 30000),
  connectTimeoutMS: Number(process.env.MONGO_CONNECT_TIMEOUT_MS || 30000),
  socketTimeoutMS: Number(process.env.MONGO_SOCKET_TIMEOUT_MS || 45000),
  maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE || 20),
  minPoolSize: Number(process.env.MONGO_MIN_POOL_SIZE || 0),
  family: 4,
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const connectWithUri = async (uri, { label = "MongoDB" } = {}) => {
  const maxAttempts = Math.min(
    Math.max(Number(process.env.MONGO_CONNECT_RETRIES || 4), 1),
    8
  );
  const retryDelayMs = Math.max(
    Number(process.env.MONGO_RETRY_DELAY_MS || 5000),
    1000
  );

  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await mongoose.connect(uri, connectionOptions);
    } catch (error) {
      lastError = error;
      await mongoose.disconnect().catch(() => {});

      if (attempt >= maxAttempts) break;

      console.warn(
        `${label} connection attempt ${attempt}/${maxAttempts} failed. Retrying in ${retryDelayMs}ms...`
      );
      await sleep(retryDelayMs);
    }
  }

  throw lastError;
};

const connectDB = async () => {
  const mongoUri = String(process.env.MONGO_URI || "").trim();

  if (!mongoUri) {
    throw new Error("MONGO_URI is missing from backend/.env");
  }

  configureNodeDns();

  try {
    const conn = await connectWithUri(mongoUri, { label: "MongoDB Atlas" });
    console.log(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    const isSrvUri = mongoUri.startsWith("mongodb+srv://");

    if (!isSrvUri || !isSrvDnsError(error)) {
      throw error;
    }

    console.warn(
      "MongoDB Atlas SRV lookup was refused by Node.js. Retrying with the standard Atlas seed list..."
    );

    await mongoose.disconnect().catch(() => {});

    const explicitFallbackUri = String(process.env.MONGO_FALLBACK_URI || "").trim();
    const fallbackHosts = splitCsv(
      process.env.MONGO_FALLBACK_HOSTS,
      DEFAULT_ATLAS_FALLBACK_HOSTS
    );
    const fallbackUri =
      explicitFallbackUri || buildStandardMongoUri(mongoUri, fallbackHosts);

    const conn = await connectWithUri(fallbackUri, { label: "MongoDB Atlas fallback" });
    console.log(`MongoDB connected through DNS-SRV fallback: ${conn.connection.host}`);
    return conn;
  }
};

export { buildStandardMongoUri, configureNodeDns, isSrvDnsError };
export default connectDB;
