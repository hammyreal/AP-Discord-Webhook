# NOTE
This was a hobby project to learn about webhooks and create something
to make the Archipelago experience better for my group of friends.
There are better tools out there for the job, like [Bridgeipelago](https://github.com/Quasky/bridgeipelago)

# Usage

## Prerequisites
NodeJS, probably through [npm](https://www.npmjs.com/)

## Setup
Edit the `.env.example` to include the necessary info, and rename it to `.env`

Note: PORT, PUBLICKEY, LOGFILE and TIMEZONE are currently unused

Run `index.js` from this repo with NodeJS, and preferably pipe the
output to a text file for now because i haven't been bothered to
set up proper logging:

`node index.js > out.txt`

## Features
The script now features a working WebSocket client, meaning using
the log from the ArchipelagoTextClient is no longer required

Webhook messages will come through with any found items from the
Archipelago room


### Planned future features:
Discord interactions, allowing users to track items, and maybe more