// Generates the publish-directory `_redirects` file with the real backend URL.
//
// WHY THIS EXISTS: Netlify does NOT interpolate environment variables in
// netlify.toml `[[redirects]]` rules — `to = "${API_URL}/api/:splat"` stays a
// literal string (see docs: "Inject environment variable values"). The rule
// therefore points nowhere and every /api request falls through to the SPA.
// Rules in a `_redirects` file in the publish directory ARE processed first,
// so we write the actual API_URL into that file as part of the build.
//
// Wired in netlify.toml AFTER `pnpm build`, because Vite cleans the dist
// directory on every build and would delete the file otherwise.

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const publishDir = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../artifacts/jump-proptech/dist",
);
const redirectsPath = resolve(publishDir, "_redirects");

const apiUrl = (process.env.API_URL ?? "").trim();

if (!apiUrl) {
  console.error(
    "\n[write-api-redirects] FAILED: API_URL is not set. " +
      "The /api proxy cannot be generated.\n",
  );
  process.exit(1);
}

if (!/^https?:\/\//.test(apiUrl)) {
  console.error(
    `\n[write-api-redirects] FAILED: API_URL is not an absolute URL: "${apiUrl}".\n`,
  );
  process.exit(1);
}

if (apiUrl.endsWith("/")) {
  console.error(
    `\n[write-api-redirects] FAILED: API_URL ends with a trailing slash: "${apiUrl}".\n`,
  );
  process.exit(1);
}

const line = `/api/* ${apiUrl}/api/:splat 200\n`;

mkdirSync(publishDir, { recursive: true });
writeFileSync(redirectsPath, line, "utf8");

console.log(`[write-api-redirects] wrote ${redirectsPath}`);
console.log(`[write-api-redirects] /api/* proxied to ${apiUrl}`);
