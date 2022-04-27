import { Command } from "./lib/classes/Command";
import http from "http";
import client from "./lib/common/client";
//sh -c \"while true; do timeout 10800 <start command here>; done\"

Command.loadAll().then(commands => console.log(`Loaded ${commands.length} commands.`))

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