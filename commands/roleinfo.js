const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'roleinfo',
  description: 'Informations détaillées sur un rôle',
  aliases: ['role-info'],
  run: async (client, message, args) => {
    const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[0])
    if (!role) return message.reply(`Usage : \`!roleinfo @rôle\``)

    const perms = role.permissions.toArray()
    const created = Math.floor(role.createdTimestamp / 1000)

    message.reply({ embeds: [new EmbedBuilder()
      .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
      .setTitle(`Rôle · ${role.name}`)
      .setColor(role.color || 0xFF0000)
      .addFields(
      .setFooter({ text: 'Made by Wumpus' })
        { name: 'ID',         value: `\`${role.id}\``,                inline: true },
        { name: 'Couleur',    value: `#${role.color.toString(16).padStart(6, '0').toUpperCase()}`, inline: true },
        { name: 'Membres',    value: `${role.members.size}`,          inline: true },
        { name: 'Position',   value: `${role.position}`,              inline: true },
        { name: 'Mentionnable', value: role.mentionable ? 'Oui' : 'Non', inline: true },
        { name: 'Affiché séparément', value: role.hoist ? 'Oui' : 'Non', inline: true },
        { name: 'Créé',       value: `<t:${created}:R>`,              inline: false },
        { name: `Permissions · ${perms.length}`, value: perms.length > 0 ? perms.slice(0, 20).map(p => `\`${p}\``).join(' ') : '_Aucune_', inline: false },
      )
    ] })
  },
}
