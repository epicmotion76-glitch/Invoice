// Renders the landing page to static HTML after `vite build` so the content,
// hero image and headings are in the first response (faster paint, better SEO).
import { readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const templatePath = path.join(root, "dist", "index.html");
const serverEntry = path.join(root, "dist-ssr", "entry-server.js");

const template = await readFile(templatePath, "utf8");
const { render } = await import(pathToFileURL(serverEntry).href);

if (!template.includes("<!--app-html-->")) {
  throw new Error("Prerender placeholder <!--app-html--> not found in dist/index.html");
}

await writeFile(templatePath, template.replace("<!--app-html-->", render()));
await rm(path.join(root, "dist-ssr"), { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }).catch(
  (error) => console.warn(`Could not remove dist-ssr (safe to ignore): ${error.message}`),
);
console.log("Prerendered dist/index.html");
