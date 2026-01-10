# NOTE
This was a hobby project to learn about webhooks and create something
to make the Archipelago experience better for my group of friends.
There are better tools out there for the job, like [Bridgeipelago](https://github.com/Quasky/bridgeipelago)

# Usage

## Prerequisites
[Archipelago](https://github.com/ArchipelagoMW/Archipelago)
NodeJS, probably through [npm](https://www.npmjs.com/)

## Setup
Run `ArchipelagoTextClient` from your Archipelago folder with nogui, like this:

```
./ArchipelagoTextClient --nogui --name [slotName] archipelago://[room URL+port]
```

Locate the log this TextClient instance has created, it should be located
in `C:/ProgramData/Archipelago/Logs` on Windows, and wherever you installed
Archipelago on Linux

Edit the `.env.example` to include the necessary info, and rename it to `.env`

Note: PORT and PUBLICKEY are currently unused

Run the js script from this repo with NodeJS

## Features
The script will skip over any existing messages in the log, this will
be an editable setting soon maybe

Webhook messages will come through with any found items from the
Archipelago room, including a Discord timestamp to give the local time
it was found

Hints for the slot you connected to will still come through, this will
be removed soon

### Planned future features:
Discord interactions, allowing users to track items, and maybe more