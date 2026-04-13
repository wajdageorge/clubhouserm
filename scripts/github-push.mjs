import { execSync } from "child_process";

const CONNECTORS_HOST = process.env.REPLIT_CONNECTORS_HOSTNAME;
const IDENTITY = process.env.REPL_IDENTITY;
const RENEWAL = process.env.WEB_REPL_RENEWAL;

if (!CONNECTORS_HOST || !IDENTITY) {
  console.error("Missing connector env vars");
  process.exit(1);
}

async function proxyGitHub(path, options = {}) {
  const url = `https://${CONNECTORS_HOST}/v1/proxy/github${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Replit-Identity": IDENTITY,
      ...(RENEWAL ? { "X-Replit-Identity-Renewal": RENEWAL } : {}),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub proxy error ${res.status}: ${text}`);
  }
  return res.json();
}

async function main() {
  const user = await proxyGitHub("/user");
  console.log("GitHub user:", user.login);

  const repoName = "clubhouserm";
  let repo;
  try {
    repo = await proxyGitHub(`/repos/${user.login}/${repoName}`);
    console.log("Repository already exists:", repo.html_url);
  } catch {
    console.log("Creating repository...");
    repo = await proxyGitHub("/user/repos", {
      method: "POST",
      body: JSON.stringify({
        name: repoName,
        description: "ClubHouseRM – Golf Course Revenue Management Platform",
        private: false,
        auto_init: false,
      }),
    });
    console.log("Repository created:", repo.html_url);
  }

  const tokenRes = await fetch(`https://${CONNECTORS_HOST}/v1/token/github`, {
    headers: {
      "X-Replit-Identity": IDENTITY,
      ...(RENEWAL ? { "X-Replit-Identity-Renewal": RENEWAL } : {}),
    },
  });

  let token = null;
  if (tokenRes.ok) {
    const tokenData = await tokenRes.json();
    token = tokenData.token || tokenData.access_token;
    console.log("Got token:", token ? "yes" : "no");
  } else {
    console.log("Token endpoint status:", tokenRes.status);
  }

  if (token) {
    const remoteUrl = `https://${user.login}:${token}@github.com/${user.login}/${repoName}.git`;
    try {
      execSync(`git remote remove github 2>/dev/null || true`, { stdio: "inherit" });
    } catch {}
    execSync(`git remote add github ${remoteUrl}`, { stdio: "inherit" });
    execSync(`git push github main --force`, { stdio: "inherit" });
    console.log("\nSuccess! Code pushed to:", repo.html_url);
  } else {
    console.log("\nRepository URL:", repo.html_url);
    console.log("Could not retrieve token for git push - please push manually.");
  }
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
