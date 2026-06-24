const { Client, GatewayIntentBits, Partials } = require("discord.js");
const path = require("path");

const runtimeDir = process.pkg ? path.dirname(process.execPath) : path.join(__dirname, "..");
require("dotenv").config({ path: path.join(runtimeDir, ".env") });
require("dotenv").config();

const token = process.env.DISCORD_BOT_TOKEN;
const defaultChannelId = process.env.DISCORD_DEV_CHANNEL_ID;
const replyPrefix = process.env.DISCORD_REPLY_PREFIX || "!oldoodle";
const statusText = process.env.DISCORD_STATUS_TEXT || "developing Oldoodle";
const publicSite = process.env.OLDOODLE_PUBLIC_SITE || "https://aki2457.github.io/oldoogle-xp-search/";

if (!token || token.includes("demo") || token.includes("replace_me")) {
  console.error("DISCORD_BOT_TOKEN is missing or still set to a demo value.");
  console.error("Create a Discord bot token, put it in .env, then run npm run discord:bot.");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

function oldoodleReply(messageText) {
  const text = messageText.toLowerCase();

  if (text.includes("status")) {
    return `Oldoodle dev desk: app is wired for XP search, GitHub Pages fallback search, and a Zeabur Node API attempt. Site: ${publicSite}`;
  }

  if (text.includes("search")) {
    return "Search notes: localhost/Zeabur can use live `/api/search`; GitHub Pages falls back to DuckDuckGo, Google, and Internet Archive links.";
  }

  if (text.includes("deploy") || text.includes("github")) {
    return "Deploy notes: `main` holds the source, `gh-pages` serves the static app, and GitHub Actions publishes `public/`.";
  }

  return "Oldoodle dev desk here. Ask me about `status`, `search`, or `deploy`, or drop a note for the next build pass.";
}

client.once("ready", async () => {
  console.log(`Oldoodle Discord bot logged in as ${client.user.tag}`);
  client.user.setPresence({
    activities: [{ name: statusText }],
    status: "online"
  });

  if (defaultChannelId) {
    try {
      const channel = await client.channels.fetch(defaultChannelId);
      if (channel?.isTextBased()) {
        await channel.send(`Oldoodle dev desk is online. Prefix: \`${replyPrefix}\``);
      }
    } catch (error) {
      console.warn(`Could not post startup message: ${error.message}`);
    }
  }
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const isMention = message.mentions.has(client.user);
  const isPrefixed = message.content.trim().toLowerCase().startsWith(replyPrefix.toLowerCase());
  const isDm = !message.guildId;

  if (!isMention && !isPrefixed && !isDm) return;

  const cleaned = message.content
    .replace(new RegExp(`<@!?${client.user.id}>`, "g"), "")
    .replace(new RegExp(`^${replyPrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i"), "")
    .trim();

  await message.reply(oldoodleReply(cleaned));
});

client.login(token);
