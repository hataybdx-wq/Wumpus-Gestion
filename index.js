// ============================================================
//  Electron Gestion — Point d'entrée principal
//  discord.js v14 | Node.js 20+
//  Made by Wumpus
// ============================================================

const fs   = require('fs')
const path = require('path')

const {
  Client, GatewayIntentBits, Partials, Collection,
} = require('discord.js')

require('dotenv').config()
const db = require('quick.db')

// ── Client ────────────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.GuildMember,
    Partials.User,
    Partials.Reaction,
  ],
})

client.commands = new Collection()
client.aliases  = new Collection()
client.snipes   = new Map()

// ── Chargement des événements ─────────────────────────────────
const loadEvents = (dir = path.join(__dirname, 'events')) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const subPath = `${dir}/${entry.name}`
    const files   = fs.readdirSync(subPath).filter(f => f.endsWith('.js'))
    for (const file of files) {
      try {
        const evt       = require(`${subPath}/${file}`)
        const name      = file.replace('.js', '')
        const eventName = name === 'ready' ? 'clientReady' : name
        client.on(eventName, evt.bind(null, client))
        console.log(`[EVENT] ✅  ${entry.name}/${name}`)
      } catch (err) {
        console.error(`[EVENT] ❌  ${entry.name}/${file}:`, err.message)
      }
    }
  }
}
loadEvents()

// ── Chargement des commandes ──────────────────────────────────
const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(f => f.endsWith('.js'))
for (const file of commandFiles) {
  try {
    const cmd = require(path.join(__dirname, 'commands', file))
    if (!cmd?.name) continue
    client.commands.set(cmd.name, cmd)
    if (Array.isArray(cmd.aliases)) {
      for (const alias of cmd.aliases) client.aliases.set(alias, cmd.name)
    }
    console.log(`[CMD]   ✅  ${cmd.name}`)
  } catch (err) {
    console.error(`[CMD]   ❌  ${file}:`, err.message)
  }
}

// ── Erreurs globales ──────────────────────────────────────────
process.on('unhandledRejection', err => console.error('[UNHANDLED]', err?.message ?? err))
process.on('uncaughtException',  err => console.error('[UNCAUGHT]',  err?.message ?? err))

client.login(process.env.TOKEN)
