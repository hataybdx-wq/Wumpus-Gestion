const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'rolelist',
  description: 'Liste de tous les rôles',
  aliases: ['roles-list', 'list-roles'],
  run: async (client, message) => {
    const roles = message.guild.roles.cache
      .filter(r => r.id !== message.guild.id)
      .sort((a, b) => b.position - a.position)
      .map(r => `<@&${r.id}> · ${r.members.size} membre(s)`)

    const chunks = []
    for (let i = 0; i < roles.length; i += 25) chunks.push(roles.slice(i, i + 25).join('\n'))

    message.reply({ embeds: [new EmbedBuilder()
      .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
      .setTitle(`Rôles · ${message.guild.name}`)
      .setColor(0xFF0000)
      .setDescription(chunks[0] || '_Aucun rôle_')
      .setFooter({ text: `${roles.length} rôles · ${chunks.length > 1 ? 'Affiche les 25 premiers' : ''} | Made by Wumpus` })
    ] })
  },
}
