import fs from "fs";
import path from "path";

const htmlPath = path.resolve("dist/index.html");

if (fs.existsSync(htmlPath)) {
  let html = fs.readFileSync(htmlPath, "utf8");
  
  // Inject favicon tags before </head>
  const faviconTags = `  <link rel="icon" type="image/png" href="/favicon.png" />\n  <link rel="shortcut icon" href="/favicon.ico" />\n  </head>`;
  
  if (!html.includes("favicon.png")) {
    html = html.replace("</head>", faviconTags);
    fs.writeFileSync(htmlPath, html, "utf8");
    console.log("Successfully patched dist/index.html with custom favicon links!");
  } else {
    console.log("Favicon links already present in dist/index.html.");
  }
} else {
  console.error("dist/index.html not found, skipping patch.");
}
