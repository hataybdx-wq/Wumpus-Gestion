const { EmbedBuilder, PermissionFlagsBits } = require('discord.js')
const db = require('quick.db')

module.exports = {
  name: 'secur-on',
  description: 'Active la protection standard (anti-massban, anti-masskick)',
  aliases: [],
  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return

    const gid = message.guild.id
    db.set(`bots_${gid}`,           true)
    db.set(`spam_${gid}`,           true)
    db.set(`link_${gid}`,           true)
    db.set(`massbans_${gid}`,       true)
    db.set(`masskick_${gid}`,       true)
    db.set(`massping_${gid}`,       true)
    db.set(`antiguildupdate_${gid}`,true)
    // secur-on = protection standard, les admins restent exempts (pas le mode secur-max)
    db.set(`secur_${gid}`,          false)
    db.set(`channels_${gid}`,       null)
    db.set(`bans_${gid}`,           null)
    db.set(`kick_${gid}`,           null)
    const embed = new EmbedBuilder()
      .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
      .setTitle('🛡️ Sécurité de base activée')
      .setDescription(
      .setFooter({ text: 'Made by Wumpus' })
        '✅ Anti-Bot\n✅ Anti-Spam\n✅ Anti-Lien\n✅ Anti-Mass-Ban\n' +
        '✅ Anti-Mass-Kick\n✅ Anti-Mass-Mention\n✅ Anti-Guild-Update\n\n' +
        '❌ Raid-Mode\n❌ Anti-Channel\n❌ Anti-Ban\n❌ Anti-Kick\n\n' +
        '*Pour toutes les protections : `secur-max`*'
      )
      .setColor(0x00FF88)
      .setFooter({ text: `Par ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })

    message.reply({ embeds: [embed] })
  },
}
