// ============================================================
//  Commande : sondage — Sondage Oui/Non avec réactions
//  v14 : EmbedBuilder, PermissionFlagsBits
// ============================================================

const { EmbedBuilder, PermissionFlagsBits } = require('discord.js')

module.exports = {
  name: 'sondage',
  description: 'Crée un sondage avec réactions oui/non',
  aliases: [],
  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) return

    await message.delete().catch(() => false)
    if (!args[0]) return message.channel.send('❌ Veuillez fournir une question !').catch(() => false)

    const embed = new EmbedBuilder()
      .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
      .setTitle(args.join(' '))
      .setColor(0x5865F2)
      .setDescription('**Oui :** ✅\n\n**Non :** ❌')
      .setFooter({ text: `Sondage par ${message.author.username} | Made by Wumpus`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
      .setTimestamp()

    const poll = await message.channel.send({ embeds: [embed] })
    await poll.react('✅')
    await poll.react('❌')
  },
}
