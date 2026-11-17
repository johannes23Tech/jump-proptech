// Fail-fast guard for Netlify production builds.
//
// The /api/* proxy in netlify.toml points at "${API_URL}/api/:splat". If the
// API_URL environment variable is missing or malformed, Netlify silently
// drops the redirect and every /api request falls through to the SPA's
// index.html — the site deploys green but is broken. This script makes that
// misconfiguration fail the build with an obvious message instead.
//
// Wired in via netlify.toml: `node ../../scripts/verify-netlify-env.mjs && pnpm build`

const problems = [];

const apiUrl = process.env.API_URL;

if (!apiUrl) {
  problems.push(
    "API_URL is not set. Add it in Netlify → Site configuration → Environment variables, " +
      "scoped to Builds, with the backend's public URL (e.g. https://<service>.up.railway.app).",
  );
} else {
  if (apiUrl.endsWith("/")) {
    problems.push(
      "API_URL must not end with a trailing slash — netlify.toml already appends '/api/:splat'.",
    );
  }

  let parsed;
  try {
    parsed = new URL(apiUrl);
  } catch {
    parsed = null;
  }

  if (!parsed || (parsed.protocol !== "https:" && parsed.protocol !== "http:")) {
    problems.push(
      `API_URL is not a valid absolute URL: "${apiUrl}". It must start with https:// (or http://).`,
    );
  }
}

if (problems.length > 0) {
  console.error("\n[nb:verify-netlify-env] Netlify environment check FAILED:\n");
  for (const problem of problems) {
    console.error(`  - ${problem}`);
  }
  console.error(
    "\nFix the environment variables in the Netlify UI and redeploy. " +
      "Without a valid API_URL the /api proxy is silently disabled and the live site cannot reach the backend.\n",
  );
  process.exit(1);
}

console.log(`[verify-netlify-env] API_URL OK (proxy target: ${apiUrl})`);
