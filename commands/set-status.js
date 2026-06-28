const { EmbedBuilder, PermissionFlagsBits } = require('discord.js')
const db = require('quick.db')

module.exports = {
  name: 'set-status',
  description: 'Définit un statut/activité pour les membres avec un rôle',
  aliases: [],
  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return

    const role   = message.mentions.roles.first() || message.guild.roles.cache.get(args[0])
    const status = args.slice(1).join(' ')

    if (!role)   return message.reply(`❌ Usage : \`${prefix}set-status @rôle <texte du statut>\``)
    if (!status) return message.reply(`❌ Usage : \`${prefix}set-status @rôle <texte du statut>\``)

    db.set(`${message.guild.id}.statusrole`,    role.id)
    db.set(`${message.guild.id}.statusmessage`, status)

    const embed = new EmbedBuilder()
      .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
      .setTitle('✅ Set-Status configuré')
      .addFields(
      .setFooter({ text: 'Made by Wumpus' })
        { name: '🎭 Rôle',   value: `<@&${role.id}>`, inline: true },
        { name: '💬 Statut', value: status,            inline: true },
      )
      .setFooter({ text: message.author.username, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
      .setTimestamp()

    message.reply({ embeds: [embed] })
  },
}
