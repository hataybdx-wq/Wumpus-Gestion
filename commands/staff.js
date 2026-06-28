const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'staff',
  description: 'Liste du staff (rôles contenant admin/mod/staff)',
  aliases: [],
  run: async (client, message) => {
    const staffRoles = message.guild.roles.cache.filter(r =>
      /admin|mod|staff|support|fondateur|owner/i.test(r.name)
    )
    if (staffRoles.size === 0) return message.reply('Aucun rôle staff trouvé.')

    await message.guild.members.fetch().catch(() => {})
    const staffIds = new Set()
    for (const r of staffRoles.values()) {
      for (const m of r.members.values()) staffIds.add(m.id)
    }

    const members = [...staffIds].slice(0, 30).map(id => `<@${id}>`).join('\n') || '_Personne_'
    message.reply({ embeds: [new EmbedBuilder()
      .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
      .setTitle(`Staff · ${message.guild.name}`)
      .setColor(0xFF0000)
      .setDescription(members)
      .setFooter({ text: `${staffIds.size} membre(s) · Rôles : ${[...staffRoles.values()].map(r => r.name).join(', ')} | Made by Wumpus` })
    ] })
  },
}
