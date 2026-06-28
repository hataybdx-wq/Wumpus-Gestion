// ── Anti-Spam (Secur) — seuil configurable ──────────────────────
const { applySanction, isExempt } = require('../../utils/sanction')
const { getSeuil } = require('../../commands/set-sanction')
const db = require('quick.db')

const spamCounters = new Map()

module.exports = async (client, message) => {
  if (!message.guild) return
  if (message.author.bot) return
  if (db.get(`spam_${message.guild.id}`) !== true) return
  if (isExempt(message.guild, message.author.id, 'spam')) return

  const gid   = message.guild.id
  const seuil = getSeuil(gid, 'spam')  // 1 en secur-max, 5 par défaut

  const key   = `${gid}_${message.author.id}`
  const count = (spamCounters.get(key) ?? 0) + 1
  spamCounters.set(key, count)
  setTimeout(() => spamCounters.delete(key), 7000)

  if (count >= seuil) {
    // Supprimer les messages du spammeur
    const msgs = await message.channel.messages.fetch({ limit: 10 }).catch(() => null)
    if (msgs) {
      const toDelete = msgs.filter(m => m.author.id === message.author.id)
      message.channel.bulkDelete(toDelete, true).catch(() => false)
    }

    const member = await message.guild.members.fetch(message.author.id).catch(() => null)
    await applySanction(member, message.guild, 'spam',
      `Anti-Spam : ${count} message(s) en 7s (seuil: ${seuil})`)
  }
}
