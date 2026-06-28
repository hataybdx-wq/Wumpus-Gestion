// ============================================================
//  Événement : guildBanRemove (Client) — Log débannissement
// ============================================================

const { sendLog } = require('../../utils/logs')
const { AuditLogEvent } = require('discord.js')

module.exports = async (client, ban) => {
  if (!ban.guild) return

  let moderator = 'Inconnu'
  try {
    const audit = await ban.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberBanRemove })
    const entry = audit.entries.first()
    if (entry && Date.now() - entry.createdTimestamp < 5000) moderator = `<@${entry.executor.id}>`
  } catch {}

  sendLog(
    ban.guild, 'mod',
    'Membre débanni',
    `**Membre :** ${ban.user.username} (<@${ban.user.id}>)\n**Par :** ${moderator}`,
    0x00FF88
  )
}
