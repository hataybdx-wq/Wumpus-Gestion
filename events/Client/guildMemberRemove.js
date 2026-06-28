// ============================================================
//  Événement : guildMemberRemove — Log départ + invites
// ============================================================

const { EmbedBuilder } = require('discord.js')
const { sendLog } = require('../../utils/logs')
const { getConfig, markLeft } = require('../../utils/invites')
const db = require('quick.db')

module.exports = async (client, member) => {
  if (!member.guild) return

  // ── Message de départ ────────────────────────────────────
  const welcomeCfg = db.get(`welcome_${member.guild.id}`) || {}
  if (welcomeCfg.goodbye_channel && welcomeCfg.goodbye_message && !member.user.bot) {
    const ch = member.guild.channels.cache.get(welcomeCfg.goodbye_channel)
    if (ch) {
      const { formatMessage } = require('../../commands/welcome')
      ch.send(formatMessage(welcomeCfg.goodbye_message, member, member.guild)).catch(() => false)
    }
  }

  const roles = member.roles.cache
    .filter(r => r.id !== member.guild.id)
    .map(r => `<@&${r.id}>`)
    .join(', ') || 'Aucun'

  sendLog(
    member.guild, 'members',
    'Membre parti',
    `**${member.user.username}** a quitté le serveur.\n\n**ID :** \`${member.id}\`\n**Rôles :** ${roles.slice(0, 800)}`,
    0xFF4444,
    [{ name: 'Membres restants', value: `${member.guild.memberCount}`, inline: true }]
  )

  // ── Tracking invites ─────────────────────────────────────
  const cfg = getConfig(member.guild.id)
  if (!cfg.active) return

  const result = markLeft(member.guild.id, member.id)

  if (cfg.logsChannelId) {
    const logChannel = member.guild.channels.cache.get(cfg.logsChannelId)
    if (logChannel) {
      const embed = new EmbedBuilder()
        .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
        .setColor(0xFF4444)
        .setTitle('Membre parti')
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setDescription(
        .setFooter({ text: 'Made by Wumpus' })
          `**${member.user.username}** a quitté **${member.guild.name}**.\n\n` +
          (result
            ? `Avait été invité par <@${result.inviterId}> (qui passe à **${result.stats.real || 0}** invitations réelles).`
            : 'Inviteur inconnu.')
        )
        .addFields(
        .setFooter({ text: 'Made by Wumpus' })
          { name: 'Membres restants', value: `${member.guild.memberCount}`, inline: true },
        )
        .setFooter({ text: 'Made by Wumpus' })
        .setTimestamp()

      logChannel.send({ embeds: [embed] }).catch(() => false)
    }
  }
}
