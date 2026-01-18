
import * as crypto from 'crypto';
import { Logger } from './logger.js';

//to get a location/item 

export class ArchipelagoClient {
    constructor(url, name, pass) {
        this.socket = new WebSocket(url);
        process.loadEnvFile();
        this.PORT = process.env.PORT;

        this.publicKey = process.env.PUBLICKEY;
        //const appID

        this.roomURL = process.env.ROOM;
        this.name = process.env.SLOTNAME;
        this.pass = process.env.PASSWORD;

        this.webhookUrl = new URL(process.env.HOOKURL);
        this.logPath = process.env.LOGFILE;
        this.timezone = process.env.TIMEZONE;

        this.socket.addEventListener('open', event => {
            console.log("connected");
            this.connect(name, pass);
            this.logger = new Logger();
        });

        this.socket.addEventListener('message', event => {
            //console.log("received message:", event.data);
            var data = JSON.parse(event.data);
            //console.log(data[0]);
            if (data[0].cmd == 'Connected') {
                this.players = data[0].players;
                var getPackagePayload = {
                    'cmd': 'GetDataPackage'
                }
                this.socket.send(JSON.stringify([getPackagePayload]));
            } else if (data[0].cmd == 'DataPackage') {
                var i = 0;
                this.games = new Array();
                //console.log(data[0].data.games);
                for (var [name, gameData] of Object.entries(data[0].data.games)) {
                    //console.log(name, i);
                    
                    this.games[i] = {item_name_to_id:{}, location_name_to_id:{}}
                    this.games[i].item_name_to_id = this.swap(gameData.item_name_to_id);
                    this.games[i].location_name_to_id = this.swap(gameData.location_name_to_id)
                    //console.log(this.games[i])
                    i++;
                }
                console.log(this.games[25])
            }
            switch (data[0].type) {
                case 'ItemSend':
                    var itemID = data[0].item.item;
                    var locationID = data[0].item.location;
                    var senderID = data[0].item.player;
                    var receiverID = data[0].receiving;
                    var flags = data[0].item.flags;

                    var senderObj = this.players[senderID - 1];
                    var senderName = senderObj.alias;

                    var receiverObj = this.players[receiverID - 1];
                    var receiverName = receiverObj.alias;



                    console.log(data[0]);
                    console.log(senderName, receiverName);
                    break;
                //case
            }
            
                
            
            
            

        });

        this.socket.addEventListener('close', event => {
            console.log("socket closed:", event.code, event.reason);
        });

        this.socket.addEventListener('error', error => {
            console.error('WebSocket error:', error);
        });

        
    }

    connect(name, pass) {
        var version = {
            'class': 'Version',
            'major': 0,
            'minor': 6,
            'build': 5
        }
        var payload = {
            'cmd': 'Connect',
            'password': pass, 'name': name, 'version': version,
            'tags': ['TextOnly'], 'items_handling': 0b111,
            'uuid': crypto.randomUUID(), 'game': '', 'slot_data': true
        };

        this.socket.send(JSON.stringify([payload]));
    }

    // https://stackoverflow.com/questions/23013573/swap-key-with-value-in-object
    swap(json) {
        var ret = {};
        for (var key in json) {
            ret[json[key]] = key;
        }
        return ret;
    }

    sendMessage(data) {
    const hookData = JSON.stringify({
        content: data,
    })

    const hookOptions = {
        hostname: webhookUrl.hostname,
        path: webhookUrl.pathname,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(hookData),
        }
    };


    const request = https.request(hookOptions, (res) => {
        let resData = '';

        res.on('data', (chunk) => {
            resData += chunk;
        });

        res.on('end', () => {
            console.log(resData);
        })

    });

    request.on('error', (e) => {
        console.error("error: ", e);
    })
    request.write(hookData);
    request.end();
    console.log("ending");
}
}