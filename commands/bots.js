const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'bots',
  description: 'Liste des bots du serveur',
  aliases: [],
  run: async (client, message) => {
    await message.guild.members.fetch().catch(() => {})
    const bots = message.guild.members.cache.filter(m => m.user.bot)
      .sort((a, b) => a.user.username.localeCompare(b.user.username))

    const list = [...bots.values()].slice(0, 40).map(m => `<@${m.id}>`).join('\n') || '_Aucun bot_'

    message.reply({ embeds: [new EmbedBuilder()
      .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
      .setTitle(`Bots · ${message.guild.name}`)
      .setColor(0xFF0000)
      .setDescription(list)
      .setFooter({ text: `${bots.size} bot(s) | Made by Wumpus` })
    ] })
  },
}
