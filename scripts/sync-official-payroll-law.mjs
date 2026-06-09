// Sync official payroll-law sources into a reviewable, inactive version.
// Usage:
//   $env:ADMIN_EMAIL="..."; $env:ADMIN_PASSWORD="..."; node scripts/sync-official-payroll-law.mjs

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://eadeymehidcndudeycnf.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhZGV5bWVoaWRjbmR1ZGV5Y25mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4Mzg2ODQsImV4cCI6MjA4NDQxNDY4NH0.8t74NyPPHaWXHGyllAvdjPZ6DfAWM9fsAKopVEVogpM";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error("Missing ADMIN_EMAIL/ADMIN_PASSWORD environment variables.");
  process.exit(1);
}

const officialSources = {
  tax: [
    "https://www.taxes.gov.il",
    "https://www.gov.il/he/departments/israel_tax_authority/govil-landing-page",
  ],
  ni: [
    "https://www.btl.gov.il",
    "https://www.btl.gov.il/benefits/Work_Injury/Pages/default.aspx",
  ],
};

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function toSnapshot(text, url) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  const excerpt = clean.slice(0, 3500);
  return `Source: ${url}\nFetchedAt: ${new Date().toISOString()}\n\n${excerpt}`;
}

async function fetchSource(url) {
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed fetching ${url}: HTTP ${res.status}`);
  }

  return res.text();
}

async function fetchFromOfficialUrls(urls, label) {
  const errors = [];
  for (const url of urls) {
    try {
      const html = await fetchSource(url);
      return {
        url,
        html,
        warning: null,
      };
    } catch (err) {
      errors.push(`${url} -> ${err.message || err}`);
    }
  }

  return {
    url: urls[0],
    html: "",
    warning: `${label} source fetch failed. Attempts:\n${errors.join("\n")}`,
  };
}

async function main() {
  console.log("Logging in as admin...");
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  if (loginError || !loginData.session) {
    throw new Error(`Admin login failed: ${loginError?.message || "unknown error"}`);
  }

  console.log("Fetching official sources...");
  const [taxFetch, niFetch] = await Promise.all([
    fetchFromOfficialUrls(officialSources.tax, "Tax"),
    fetchFromOfficialUrls(officialSources.ni, "NI"),
  ]);

  if (!taxFetch.html && !niFetch.html) {
    throw new Error(`All official-source fetch attempts failed.\n${taxFetch.warning}\n${niFetch.warning}`);
  }

  const { data: activeLawRows, error: activeLawError } = await supabase
    .from("payroll_law_versions")
    .select("*")
    .eq("is_active", true)
    .limit(1);
  if (activeLawError) {
    throw new Error(`Cannot load active payroll law version: ${activeLawError.message}`);
  }

  const active = activeLawRows?.[0];
  const now = new Date();
  const versionName = `official-sync-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const payload = {
    version_name: versionName,
    effective_from: now.toISOString().slice(0, 10),
    source_url_tax: taxFetch.url,
    source_url_ni: niFetch.url,
    source_snapshot_tax: taxFetch.html ? toSnapshot(taxFetch.html, taxFetch.url) : taxFetch.warning,
    source_snapshot_ni: niFetch.html ? toSnapshot(niFetch.html, niFetch.url) : niFetch.warning,
    tax_credit_point_value: Number(active?.tax_credit_point_value ?? 248),
    income_tax_brackets: active?.income_tax_brackets ?? [
      { upTo: 7010, rate: 0.1 },
      { upTo: 10060, rate: 0.14 },
      { upTo: 16150, rate: 0.2 },
      { upTo: 22440, rate: 0.31 },
      { upTo: 46690, rate: 0.35 },
      { upTo: 60130, rate: 0.47 },
      { upTo: 999999999, rate: 0.5 },
    ],
    ni_reduced_rate: Number(active?.ni_reduced_rate ?? 0.004),
    ni_full_rate: Number(active?.ni_full_rate ?? 0.07),
    health_reduced_rate: Number(active?.health_reduced_rate ?? 0.031),
    health_full_rate: Number(active?.health_full_rate ?? 0.05),
    ni_health_threshold: Number(active?.ni_health_threshold ?? 7522),
    ni_health_ceiling: Number(active?.ni_health_ceiling ?? 49030),
    is_active: false,
    created_by: loginData.user.id,
  };

  const { data: inserted, error: insertError } = await supabase
    .from("payroll_law_versions")
    .insert(payload)
    .select("id, version_name, is_active")
    .single();

  if (insertError) {
    throw new Error(`Failed inserting law version: ${insertError.message}`);
  }

  console.log("Done.");
  console.log(`Created version: ${inserted.version_name} (${inserted.id})`);
  console.log("Status: inactive (requires explicit admin approval/activation).");
  if (taxFetch.warning) {
    console.log(`Tax warning: ${taxFetch.warning}`);
  }
  if (niFetch.warning) {
    console.log(`NI warning: ${niFetch.warning}`);
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
