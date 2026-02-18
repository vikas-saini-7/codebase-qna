// github.ts
// Download and extract a public GitHub repo as ZIP
import fetch from "node-fetch";
import * as fs from "fs";
import * as path from "path";
import AdmZip from "adm-zip";

export async function downloadAndExtractGitHubRepo(
  owner: string,
  repo: string,
  destDir: string,
): Promise<string> {
  const url = `https://api.github.com/repos/${owner}/${repo}/zipball`;
  const zipPath = path.join(destDir, `${repo}.zip`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download repo ZIP: ${res.status}`);
  const fileStream = fs.createWriteStream(zipPath);
  await new Promise<void>((resolve, reject) => {
    if (!res.body) {
      reject(new Error("No response body"));
      return;
    }
    res.body.pipe(fileStream);
    res.body.on("error", reject);
    fileStream.on("finish", () => resolve());
  });
  // Extract ZIP using adm-zip
  const zip = new AdmZip(zipPath);
  zip.extractAllTo(destDir, true);
  return destDir;
}
