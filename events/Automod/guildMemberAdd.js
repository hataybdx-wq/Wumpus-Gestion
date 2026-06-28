// ============================================================
//  Événement : guildMemberAdd (Automod) — Ghost Ping / Greet
// ============================================================

const db = require('quick.db')

module.exports = async (client, member) => {
  const guild = member.guild
  if (!guild) return

  const channels = db.get(`${guild.id}.greets`)
  if (!Array.isArray(channels) || channels.length === 0) return

  for (const channelId of channels) {
    try {
      const ch = await client.channels.fetch(channelId).catch(() => null)
      if (!ch) continue
      const msg = await ch.send(`<@${member.id}>`).catch(() => null)
      if (msg) await msg.delete().catch(() => false)
    } catch {}
  }
}
