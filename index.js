/*
const https = require('node:https')
const fs = require('node:fs')
const { URL } = require('url')
*/

import * as https from 'https'
import * as fs from 'node:fs'
import { URL } from 'url'
import * as crypto from 'crypto'

//import express from 'express';
/*
import {
	ButtonStyleTypes,
	InteractionResponseFlags,
	InteractionResponseType,
	InteractionType,
	MessageComponentTypes,
	verifyKeyMiddleware,
} from 'discord-interactions';
*/
import { readFileSync } from 'fs';
import { ArchipelagoClient } from './ArchipelagoClient.js';

process.loadEnvFile();

//const app = express();
const PORT = process.env.PORT;

const publicKey = process.env.PUBLICKEY;
//const appID

const roomURL = process.env.ROOM;
const name = process.env.SLOTNAME;
const pass = process.env.PASSWORD;

const webhookUrl = new URL(process.env.HOOKURL);
const logPath = process.env.LOGFILE;
const timezone = process.env.TIMEZONE;
var lastHash = '';
var lastIndex = 0;
/*
app.post('/interactions', verifyKeyMiddleware(publicKey), (req, res) => {
	const { type, data } = req.body;

	if (type === InteractionType.APPLICATION_COMMAND) {

    }
})

app.get('/', (req, res) => {
	//res = 'deez';
	console.log('deez');
	res.send('deez');
})

app.listen(PORT, () => {

	console.log('listening on port ', PORT)
})
*/

clientStuff();
async function clientStuff() {

	var client = await new ArchipelagoClient("wss://" + roomURL, name, pass);
	await sleep(3000);
	console.log(client.players)
}
/*
while (true) {
	compareHash();

	await sleep(10000);
}
*/
function sleep(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

function compareHash() {
	var content = readFileSync(logPath, 'utf8')
	const hash = getHash(content)
	console.log(lastHash + ', ' + hash)
	//TODO: add a way to scan the entire log on the first run and not send all the
	//webhook messages, but still updating the lastIndex
	if (hash == lastHash) {
		console.log('same')
		return
	} else if (lastHash == '') {
		lastHash = hash
		parseLog(false)
	} else {
		parseLog(true)
		lastHash = hash
    }
}

function parseLog(isOut) {
	var input = readFileSync(logPath, 'utf8')
	var lines = input.split('\n')
	var out = '';
	var index = lastIndex
	for (let i = index; i < lines.length; i++) {
		console.log(i + ': ' + lines[i])
		formatCheck: if (lines[i].startsWith('[FileLog') && lines[i].trim().endsWith(')') == true && lines[i].includes('[Hint]:') == false) {
			//get the time and date
			var datetime = lines[i].split(' ')
			var date = datetime[2] + 'T' + datetime[3].substr(0, datetime[3].length-2).replace(',', '.') + 'Z'
			var stamp = Date.parse(date)
			stamp -= 1000 * 60 * 60 * timezone
			//some shenanigans because Discord timestamps are shorter than unix
			var DiscordStamp = '<t:' + stamp
			DiscordStamp = DiscordStamp.substr(0, 13) + ':t>'


			//get the actual text of the line
			var line = lines[i].substring(lines[i].indexOf(']') + 3)
			var final = DiscordStamp + ': ' + line + '\n'
			out += final
			if (out.length > 1850 && isOut == true) {
				sendMessage(out)
				out = ''
            }

		} else if (lines[i].includes('[Hint]:')) {
			break formatCheck;
		} else {
			break formatCheck;
		}
		index++
	}
	lastIndex = index - 1
	if (isOut == true) {
		sendMessage(out)
    }

}

function sendMessage(data) {
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

function getHash(data) {
	const d = crypto.createHash('sha256')
	d.update(data)
	return (d.digest('hex'))
}