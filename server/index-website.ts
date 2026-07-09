import "dotenv/config";

process.env.PORT = process.env.WEBSITE_API_PORT || "4174";
process.env.DATA_FILE =
  process.env.DATA_FILE || process.env.WEBSITE_DATA_FILE || "server/data/herdflow-website.json";
process.env.STATIC_DIR = process.env.STATIC_DIR || process.env.WEBSITE_STATIC_DIR || "dist";

await import("./index");
