"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Command_1 = require("./lib/classes/Command");
const http_1 = __importDefault(require("http"));
const client_1 = __importStar(require("./lib/common/client"));
const config_1 = require("./assets/config");
const util_1 = require("util");
const common_tags_1 = require("common-tags");
const discord_js_1 = require("discord.js");
const Pomodoro_1 = require("./lib/classes/Pomodoro");
const InteractionCache_1 = require("./lib/classes/InteractionCache");
const prisma_1 = __importDefault(require("./lib/common/prisma"));
//sh -c \"while true; do timeout 10800 <start command here>; done\"
let classes = {
    Pomodoro: Pomodoro_1.Pomodoro,
    Command: Command_1.Command,
    cache: InteractionCache_1.cache,
    resolveEntry: InteractionCache_1.resolveEntry,
    prisma: prisma_1.default
};
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
client_1.leConsoleClient.on("messageCreate", async (message) => {
    if (message.author.id !== config_1.DEV_USER_ID)
        return;
    let c1 = (config_1.NODE_ENV === "production") && (message.channelId === config_1.PROD_EVAL_CHANNEL_ID);
    let c2 = (config_1.NODE_ENV === "development") && (message.channelId === config_1.DEV_EVAL_CHANNEL_ID);
    if (c1 || c2) {
        let command = message.content;
        let text;
        try {
            let result = eval(command);
            if (typeof result === "function") {
                result = await result();
            }
            result = (0, util_1.inspect)(result);
            text = (0, common_tags_1.stripIndents) `
            Evaluation successful
            
            Input:
            ${command}
            
            Output:
            ${result}`;
        }
        catch (err) {
            let e = err;
            text = (0, common_tags_1.stripIndents) `
            Evaluation failed

            Input:
            ${command}

            ${e.name}:
            ${e.stack}
            `;
        }
        if (text.length > 2000) {
            message.channel.send({
                files: [new discord_js_1.MessageAttachment(Buffer.from(text), "results.txt")]
            });
        }
        else {
            message.channel.send("```" + text + "```");
        }
    }
});
//# sourceMappingURL=index.js.map