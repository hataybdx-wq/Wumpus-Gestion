// ── Anti-Mass-Mention (SecurOn) — seuil configurable ────────────
const { applySanction, isExempt } = require('../../utils/sanction')
const { getSeuil } = require('../../commands/set-sanction')
const db = require('quick.db')

const pingCounters = new Map()

module.exports = async (client, message) => {
  if (!message.guild) return
  if (message.author.bot) return
  if (db.get(`massping_${message.guild.id}`) !== true) return

  const hasMassPing = message.mentions.everyone
  if (!hasMassPing) return
  if (isExempt(message.guild, message.author.id, 'massmention')) return

  const gid   = message.guild.id
  const seuil = getSeuil(gid, 'everyone')  // 1 en secur-max

  const key   = `${gid}_${message.author.id}`
  const count = (pingCounters.get(key) ?? 0) + 1
  pingCounters.set(key, count)
  setTimeout(() => pingCounters.delete(key), 20000)

  if (count >= seuil) {
    // Supprimer le message
    message.delete().catch(() => false)

    const member = await message.guild.members.fetch(message.author.id).catch(() => null)
    await applySanction(member, message.guild, 'massmention',
      `Anti-Masse-Mention : ${count} ping(s) @everyone/@here (seuil: ${seuil})`)
  }
}
