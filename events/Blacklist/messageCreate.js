// ============================================================
//  Événement : messageCreate (Blacklist) — Avertissement + ban
// ============================================================

const db = require('quick.db')

module.exports = async (client, message) => {
  if (!message.guild) return
  if (message.author.id === client.user.id) return

  if (db.get(`${message.author.id}.bl`) === true) {
    const member = message.guild.members.cache.get(message.author.id)
    if (!member) return

    message.channel.send(':warning: Vous êtes **GBAN** — vous serez banni dans __5 secondes !__').catch(() => false)

    setTimeout(async () => {
      await member.ban({ reason: 'Blacklist globale' }).catch(() => false)
      message.delete().catch(() => false)
    }, 5000)
  }
}
