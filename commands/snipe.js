// ============================================================
//  Commande : snipe — Affiche le dernier message supprimé
//  v14 : EmbedBuilder, setAuthor({ name, iconURL })
// ============================================================

const { EmbedBuilder } = require('discord.js')

module.exports = {
  name: 'snipe',
  description: 'Affiche le dernier message supprimé dans ce salon',
  aliases: [],
  run: async (client, message, args, prefix) => {
    const msg = client.snipes.get(message.channel.id)
    if (!msg) return message.reply('❌ Aucun message supprimé enregistré dans ce salon.')

    // Masque les codes d'invitation discord.gg/XXXXX
    let content = msg.content
    if (content.includes('discord.gg/')) {
      content = content.replace(/discord\.gg\/\S+/g, 'discord.gg/●●●●●●')
    }

    const embed = new EmbedBuilder()
      .setTitle(`Message supprimé de ${msg.author.username}`)
      .setAuthor({ name: `${msg.author.username} · Wumpus Project`, iconURL: msg.author.displayAvatarURL({ dynamic: true }), url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
      .setDescription(content)
      .setColor(0xFF0000)
      .setFooter({ text: `Supprimé le ${msg.deletedAt.toLocaleString('fr-FR')} | Made by Wumpus` })

    message.reply({ embeds: [embed] })
  },
}
