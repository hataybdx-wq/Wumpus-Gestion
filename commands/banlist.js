const { EmbedBuilder, PermissionFlagsBits } = require('discord.js')
module.exports = {
  name: 'banlist',
  description: 'Liste des membres bannis',
  aliases: ['bans'],
  run: async (client, message) => {
    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) return
    try {
      const bans = await message.guild.bans.fetch()
      if (bans.size === 0) return message.reply('Aucun bannissement.')

      const list = [...bans.values()].slice(0, 25).map((b, i) =>
        `**${i + 1}.** \`${b.user.tag}\` · ID: \`${b.user.id}\`\n-# Raison : ${b.reason || '_aucune_'}`
      ).join('\n\n')

      message.reply({ embeds: [new EmbedBuilder()
        .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
        .setTitle(`Bannissements · ${message.guild.name}`)
        .setColor(0xFF0000)
        .setDescription(list)
        .setFooter({ text: `${bans.size} banni(s) au total${bans.size > 25 ? ' · 25 affichés' : ''} | Made by Wumpus` })
      ] })
    } catch { message.reply('Erreur de récupération.') }
  },
}
