
import * as crypto from 'crypto';
import { Logger } from './logger.js';
import { URL } from 'url'
import * as https from 'https'

export class ArchipelagoClient {
    constructor(url, name, pass) {
        this.url = url;
        this.name = name;
        this.pass = pass;
        
        process.loadEnvFile();
        this.PORT = process.env.PORT;

        this.publicKey = process.env.PUBLICKEY;
        //this.appID

        this.roomURL = process.env.ROOM;
        this.name = process.env.SLOTNAME;
        this.pass = process.env.PASSWORD;

        this.webhookUrl = new URL(process.env.HOOKURL);
        this.logPath = process.env.LOGFILE;
        this.timezone = process.env.TIMEZONE;

        this.connected = false;

        this.createSocket();

        
    }

    createSocket() {
        this.socket = new WebSocket(this.url);

        this.socket.addEventListener('open', event => {
            console.log("connected");
            this.sendMessage("Connected on slot " + this.name);
            this.connect();
            this.logger = new Logger();
            this.connected = true;
        });

        this.socket.addEventListener('message', event => {
            //console.log("received message:", event.data);
            var data = JSON.parse(event.data);
            //console.log(data[0]);
            if (data[0].cmd == 'Connected') {
                this.players = data[0].players;
                this.slots = data[0].slot_info;
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
                    this.games[i] = { name: "", item_name_to_id: {}, location_name_to_id: {} }
                    this.games[i].name = name;
                    this.games[i].item_name_to_id = this.swap(gameData.item_name_to_id);
                    this.games[i].location_name_to_id = this.swap(gameData.location_name_to_id)
                    //console.log(this.games[i])
                    i++;
                }
                //console.log(this.players[2])
            }
            switch (data[0].type) {
                case 'ItemSend':
                    var final = "";
                    for (var j = 0; j < data.length; j++) {
                        var itemID = data[j].item.item;
                        var locationID = data[j].item.location;
                        var senderID = data[j].item.player;
                        var receiverID = data[j].receiving;
                        var flags = data[j].item.flags;

                        var senderObj = this.players[senderID - 1];
                        var senderName = senderObj.alias;
                        var senderGameName = this.slots[senderID].game;
                        var locationName;
                        for (var i = 0; i < this.games.length; i++) {
                            if (this.games[i].name == senderGameName) {
                                locationName = this.games[i].location_name_to_id[locationID]
                            }
                        }

                        var receiverObj = this.players[receiverID - 1];
                        var receiverName = receiverObj.alias;
                        var receiverGameName = this.slots[receiverID].game;
                        var itemName;
                        for (var i = 0; i < this.games.length; i++) {
                            if (this.games[i].name == receiverGameName) {
                                itemName = this.games[i].item_name_to_id[itemID]
                            }
                        }
                        var time = Date.now();
                        time = time.toString().substr(0, time.toString().length - 3);
                        var out = "<t:" + time + ":t>: " + senderName;
                        if (receiverName == senderName) {
                            out += " found their " + itemName;
                        } else {
                            out += " sent " + itemName + " to " + receiverName;
                        }
                        out += " (" + locationName + ")"
                        final += out + "\n";
                        console.log(out);
                    }
                    this.sendMessage(final);
                    console.log(data[0], data[1]);
                    break;
                //case
            }
        });

        this.socket.addEventListener('close', event => {
            console.log("socket closed:", event.code, event.reason);
            if (this.connected) {
                this.sendMessage("Lost connection, will attempt to reconnect every 30 seconds");
            } else {
                var curTime = Date.now();
                var time = new Date(curTime * 1000)
                console.log("failed reconnect at", time);
            }
            this.connected = false;
            this.reconnectLoop();
        });

        this.socket.addEventListener('error', error => {
            console.error('WebSocket error:', error);
            if (this.connected) {
                this.sendMessage("Lost connection, will attempt to reconnect every 30 seconds");
            } else {
                var curTime = Date.now();
                var time = new Date(curTime * 1000)
                console.log("failed reconnect at", time);
            }
            this.connected = false;
            this.reconnectLoop();
        });
    }

    connect() {
        var version = {
            'class': 'Version',
            'major': 0,
            'minor': 6,
            'build': 5
        }
        var payload = {
            'cmd': 'Connect',
            'password': this.pass, 'name': this.name, 'version': version,
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
            hostname: this.webhookUrl.hostname,
            path: this.webhookUrl.pathname,
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

    sleep(ms) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }

    async reconnectLoop() {
        await this.sleep(30000);
        this.createSocket();
    }
}