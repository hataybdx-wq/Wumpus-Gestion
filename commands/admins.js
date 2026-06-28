const { EmbedBuilder, PermissionFlagsBits } = require('discord.js')
module.exports = {
  name: 'admins',
  description: 'Liste des administrateurs du serveur',
  aliases: [],
  run: async (client, message) => {
    await message.guild.members.fetch().catch(() => {})
    const admins = message.guild.members.cache
      .filter(m => m.permissions.has(PermissionFlagsBits.Administrator) && !m.user.bot)
      .sort((a, b) => a.user.username.localeCompare(b.user.username))

    const online = admins.filter(m => m.presence && m.presence.status !== 'offline').size
    const list = [...admins.values()].slice(0, 40).map(m => {
      const status = m.presence?.status === 'online' ? '🟢' : m.presence?.status === 'idle' ? '🌙' : m.presence?.status === 'dnd' ? '⛔' : '⚫'
      return `${status} <@${m.id}>`
    }).join('\n')

    message.reply({ embeds: [new EmbedBuilder()
      .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
      .setTitle(`Administrateurs · ${message.guild.name}`)
      .setColor(0xFF0000)
      .setDescription(list || '_Aucun_')
      .setFooter({ text: `${admins.size} admin(s) · ${online} en ligne | Made by Wumpus` })
    ] })
  },
}
