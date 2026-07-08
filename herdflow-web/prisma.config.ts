// herdflow-web/prisma.config.ts
// Prisma 6.19 introduced prisma.config.ts. The VS Code Prisma extension
// (which ships Prisma 7 validation rules) looks for this file to satisfy
// its "url is no longer supported in schema files" diagnostic. Having it
// present tells the extension this project is migration-aware. Prisma 6
// CLI commands continue to read url from schema.prisma as normal.
import { defineConfig } from "@prisma/config";

export default defineConfig({
  schema: "./prisma/schema.prisma",
});
