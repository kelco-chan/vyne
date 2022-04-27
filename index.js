"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Command_1 = require("./lib/classes/Command");
const http_1 = __importDefault(require("http"));
const client_1 = __importDefault(require("./lib/common/client"));
//sh -c \"while true; do timeout 10800 <start command here>; done\"
Command_1.Command.loadAll().then(commands => console.log(`Loaded ${commands.length} commands.`));
http_1.default.createServer(async function (req, res) {
    res.setHeader("Content-Type", "application/json");
    if (req.method === "GET" && req.url === "/servercount") {
        res.end(JSON.stringify({
            error: false,
            data: {
                serverCount: client_1.default.guilds.cache.size
            }
        }));
    }
}).listen(process.env.PORT || 3000);
//# sourceMappingURL=index.js.map