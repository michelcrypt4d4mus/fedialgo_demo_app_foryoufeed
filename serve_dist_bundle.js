/*
 * Janky way to serve dist/bundle.js locally based on:
 * https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Server-side/Node_server_without_framework
 */

const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const STATIC_PATH = path.join(process.cwd(), "./dist");
const PORT = 9090;

const MIME_TYPES = {
    default: "application/octet-stream",
    html: "text/html; charset=UTF-8",
    js: "text/javascript",
    css: "text/css",
    png: "image/png",
    jpg: "image/jpeg",
    gif: "image/gif",
    ico: "image/x-icon",
    svg: "image/svg+xml",
};

const toBool = [() => true, () => false];


const prepareFile = async (url) => {
    const [baseUrl, args] = url.split("?");
    console.log(`* [prepareFile] url: ${url}, baseUrl: ${baseUrl}`);
    let paths = [STATIC_PATH, baseUrl];

    if (baseUrl.endsWith("/")) {
        paths.push("index.html");
    } else if (baseUrl.endsWith("/callback")) {
        paths = [STATIC_PATH, "index.html"];
    }

    await new Promise(r => setTimeout(r, 1000));
    console.log(`* [prepareFile] baseUrl: ${baseUrl}, paths: ${JSON.stringify(paths)}`);
    const filePath = path.join(...paths);
    const pathTraversal = !filePath.startsWith(STATIC_PATH);
    const exists = await fs.promises.access(filePath).then(...toBool);
    const found = !pathTraversal && exists;
    const streamPath = found ? filePath : STATIC_PATH + "/index.html";
    const ext = path.extname(streamPath).substring(1).toLowerCase();
    const stream = fs.createReadStream(streamPath);
    return { found, ext, stream };
};


http.createServer(async (req, res) => {
        console.log(`\n\n* [server] req.url: ${req.url}`);
        const file = await prepareFile(req.url);
        console.log(`* [server] result of prepareFile(): ${JSON.stringify(file)}`);
        const statusCode = file.found ? 200 : 404;
        const mimeType = MIME_TYPES[file.ext] || MIME_TYPES.default;
        res.writeHead(statusCode, { "Content-Type": mimeType });
        file.stream.pipe(res);
        console.log(`${req.method} ${req.url} ${statusCode}`);
    })
    .listen(PORT);


console.log(`Server running at http://127.0.0.1:${PORT}/`);
