import http from "http";
import client, { leConsoleClient } from "./lib/common/client";
import { DEV_EVAL_CHANNEL_ID, DEV_USER_ID, NODE_ENV, PROD_EVAL_CHANNEL_ID } from "./assets/config";
import { inspect } from "util"
import { stripIndents } from "common-tags";
import { MessageAttachment } from "discord.js";
import { Pomodoro } from "./lib/classes/Pomodoro";
import { cache, resolveEntry } from "./lib/classes/InteractionCache";
import prisma from "./lib/common/prisma"
import { loadCommands } from "./lib/classes/Command";
//sh -c \"while true; do timeout 10800 <start command here>; done\"
let classes = {
    Pomodoro,
    cache,
    resolveEntry,
    prisma
}
loadCommands().then(commands => console.log(`Loaded ${commands.length} commands.`))

http.createServer(async function(req,res){
    res.setHeader("Content-Type", "application/json");
    if(req.method === "GET" && req.url === "/servercount"){
        res.end(JSON.stringify({
            error: false,
            data: {
                serverCount: client.guilds.cache.size
            }
        }))
    }

}).listen(process.env.PORT || 3000);


leConsoleClient.on("messageCreate", async message => {
    if(message.author.id !== DEV_USER_ID) return;
    let c1 = (NODE_ENV === "production") && (message.channelId === PROD_EVAL_CHANNEL_ID);
    let c2 = (NODE_ENV === "development") && (message.channelId === DEV_EVAL_CHANNEL_ID);
    if(c1 || c2){
        let command = message.content;
        let text;
        try{
            let result = eval(command);
            if(typeof result === "function"){
                result = await result();
            }
            result = inspect(result);
            text = stripIndents`
            Evaluation successful
            
            Input:
            ${command}
            
            Output:
            ${result}`
        }catch(err){
            let e = err as Error;
            text = stripIndents`
            Evaluation failed

            Input:
            ${command}

            ${e.name}:
            ${e.stack}
            `
        }
        if(text.length > 2000){
            message.channel.send({
                files:[new MessageAttachment(Buffer.from(text), "results.txt")]
            })
        }else{
            message.channel.send("```"+text+"```");
        }
    }
})