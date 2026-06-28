const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'perms',
  description: 'Permissions d\'un membre dans le salon actuel',
  aliases: ['permissions'],
  run: async (client, message) => {
    const target = message.mentions.members.first() || message.member
    const perms = target.permissionsIn(message.channel).toArray()

    const list = perms.slice(0, 30).map(p => `\`${p}\``).join(' ') || '_Aucune_'
    message.reply({ embeds: [new EmbedBuilder()
      .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
      .setTitle(`Permissions de ${target.user.username}`)
      .setColor(0xFF0000)
      .setDescription(list)
      .setFooter({ text: `Dans #${message.channel.name} · ${perms.length} permission(s) | Made by Wumpus` })
    ] })
  },
}
