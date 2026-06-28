// ── Anti-Raid (Secur) ── sanction configurable ─────────────────
const { applySanction } = require('../../utils/sanction')
const db = require('quick.db')

module.exports = async (client, member) => {
  if (db.get(`antiraid_${member.guild.id}`) !== true) return
  if (member.user.bot) return

  // Avertit le membre en DM avant la sanction
  await member.send(
    `⛔ **${member.guild.name}** est actuellement en **mode anti-raid**.\n` +
    `Vous avez été automatiquement sanctionné. Réessayez plus tard.`
  ).catch(() => false)

  await applySanction(member, member.guild, 'raid',
    'Anti-Raid : rejoindre le serveur pendant le mode anti-raid')
}
