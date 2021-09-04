import * as dotenv from "dotenv";
import { Sequelize } from "sequelize";
import "reflect-metadata";

import Core from "@core";
import { Client } from "@modules/client";
import { Player } from "@modules/player";
import { Storage } from "@modules/storage";
import { Intents } from "discord.js";

console.clear();
dotenv.config();

// init app

const sequelize = new Sequelize({
  dialect: "sqlite",
  logging: false,
  storage: "./database.sqlite",
});

const STORAGE = new Storage(sequelize);

const CLIENT = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_VOICE_STATES,
  ],
});

const PLAYER = new Player(CLIENT, {
  storage: STORAGE,
  storeName: "guildsPlayerState",
});

const CORE = new Core({ client: CLIENT, player: PLAYER });

CORE.start();
