// ============================================================
//  Événement : guildMemberAdd (Blacklist) — Auto-ban blacklist
// ============================================================

const db = require('quick.db')

module.exports = async (client, member) => {
  if (!member.guild) return
  if (member.id === client.user.id) return

  if (db.get(`${member.id}.bl`) === true) {
    await member.ban({ reason: 'Blacklist globale' }).catch(() => false)
  }
}
