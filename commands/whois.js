const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'whois',
  description: 'Retrouver un utilisateur Discord par son ID',
  aliases: ['lookup'],
  run: async (client, message, args) => {
    const id = args[0] || message.mentions.users.first()?.id
    if (!id) return message.reply(`Usage : \`!whois <ID>\``)

    const user = await client.users.fetch(id).catch(() => null)
    if (!user) return message.reply('Utilisateur introuvable.')

    const created = Math.floor(user.createdTimestamp / 1000)
    const member = message.guild.members.cache.get(id)

    message.reply({ embeds: [new EmbedBuilder()
      .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
      .setTitle(`Lookup · ${user.username}`)
      .setColor(0xFF0000)
      .setThumbnail(user.displayAvatarURL({ size: 256 }))
      .addFields(
      .setFooter({ text: 'Made by Wumpus' })
        { name: 'Tag',      value: user.tag,                  inline: true },
        { name: 'ID',       value: `\`${user.id}\``,          inline: true },
        { name: 'Bot',      value: user.bot ? 'Oui' : 'Non',  inline: true },
        { name: 'Créé',     value: `<t:${created}:F>\n<t:${created}:R>`, inline: false },
        { name: 'Sur ce serveur', value: member ? `<@${user.id}> (Oui)` : 'Non', inline: false },
      )
    ] })
  },
}
