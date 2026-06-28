const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'boosters',
  description: 'Liste des boosters du serveur',
  aliases: ['boost-list'],
  run: async (client, message) => {
    await message.guild.members.fetch().catch(() => {})
    const boosters = message.guild.members.cache.filter(m => m.premiumSince)
    const list = boosters.size > 0
      ? [...boosters.values()].sort((a, b) => a.premiumSinceTimestamp - b.premiumSinceTimestamp)
          .map(m => `<@${m.id}> · depuis <t:${Math.floor(m.premiumSinceTimestamp / 1000)}:R>`).join('\n')
      : '_Aucun booster_'

    message.reply({ embeds: [new EmbedBuilder()
      .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
      .setTitle(`Boosters · ${message.guild.name}`)
      .setColor(0xF47FFF)
      .setDescription(list.slice(0, 4000))
      .setFooter({ text: `${boosters.size} booster(s) · Total boosts : ${message.guild.premiumSubscriptionCount || 0} | Made by Wumpus` })
    ] })
  },
}
