const { EmbedBuilder, PermissionFlagsBits } = require('discord.js')
module.exports = {
  name: 'inactive',
  description: 'Liste des membres potentiellement inactifs (sans rôle)',
  aliases: [],
  run: async (client, message) => {
    if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) return
    await message.guild.members.fetch().catch(() => {})

    // Membres humains sans rôles autres que @everyone, arrivés il y a +7j
    const weekAgo = Date.now() - 7 * 86400000
    const inactive = message.guild.members.cache
      .filter(m =>
        !m.user.bot &&
        m.roles.cache.size <= 1 &&
        m.joinedTimestamp < weekAgo
      )
      .sort((a, b) => a.joinedTimestamp - b.joinedTimestamp)

    const list = [...inactive.values()].slice(0, 25).map(m =>
      `<@${m.id}> · arrivé <t:${Math.floor(m.joinedTimestamp / 1000)}:R>`
    ).join('\n') || '_Aucun_'

    message.reply({ embeds: [new EmbedBuilder()
      .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
      .setTitle('Membres potentiellement inactifs')
      .setColor(0xFF8800)
      .setDescription(list)
      .setFooter({ text: `${inactive.size} membre(s) · sans rôle + arrivés il y a +7j | Made by Wumpus` })
    ] })
  },
}
