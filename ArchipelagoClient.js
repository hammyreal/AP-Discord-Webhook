
import * as crypto from 'crypto';
import { Logger } from './logger.js';

//to get a location/item 

export class ArchipelagoClient {
    constructor(url, name, pass) {
        this.socket = new WebSocket(url);

        this.socket.addEventListener('open', event => {
            console.log("connected");
            this.connect(name, pass);
            this.logger = new Logger();
        });

        this.socket.addEventListener('message', event => {
            //console.log("received message:", event.data);
            var data = JSON.parse(event.data);
            console.log(data[0]);
            if (data[0].cmd == 'Connected') {
                this.players = data[0].players;
                var getPackagePayload = {
                    'cmd': 'GetDataPackage'
                }
                this.socket.send(JSON.stringify([getPackagePayload]));
            } else if (data[0].cmd == 'DataPackage') {
                for (var [name, [data]] of data[0].data.games) {
                    console.log(data)
                }
                //var games = JSON.parse(data[0].games)
                //console.log(games.Terraria);
            }
            switch (data[0].type) {
                case 'ItemSend':
                    var item = data[0].item.item;
                    var location = data[0].item.location;
                    var sender = data[0].item.player;
                    var receiver = data[0].receiving;
                    var flags = data[0].item.flags;
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
}