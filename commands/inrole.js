const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'inrole',
  description: 'Liste des membres ayant un rôle',
  aliases: ['hasrole'],
  run: async (client, message, args) => {
    const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[0])
    if (!role) return message.reply(`Usage : \`!inrole @rôle\``)

    const members = [...role.members.values()].slice(0, 50)
    const list = members.length > 0
      ? members.map(m => `<@${m.id}>`).join(' ')
      : '_Personne_'

    message.reply({ embeds: [new EmbedBuilder()
      .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
      .setTitle(`Membres ayant ${role.name}`)
      .setColor(role.color || 0xFF0000)
      .setDescription(list.slice(0, 4000))
      .setFooter({ text: `${role.members.size} membre(s) au total${role.members.size > 50 ? ' · 50 affichés' : ''} | Made by Wumpus` })
    ] })
  },
}
