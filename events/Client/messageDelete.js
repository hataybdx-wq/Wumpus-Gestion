// ============================================================
//  Événement : messageDelete — Snipe + log messages supprimés
//  CORRECTION : partial message → message.author peut être null
//               Ajout log dans salon messages
// ============================================================

const { EmbedBuilder } = require('discord.js')
const { sendLog } = require('../../utils/logs')
const db = require('quick.db')

module.exports = async (client, message) => {
  // Partial : si le message n'est pas en cache, on ignore (pas de contenu)
  if (message.partial) return
  if (!message.guild)  return
  if (!message.author) return
  if (message.author.bot) return
  if (!message.content)   return

  // Stocke pour la commande !snipe
  client.snipes.set(message.channel.id, {
    content:   message.content,
    author:    message.author,
    deletedAt: new Date(),
  })

  // Log dans le salon messages
  const truncated = message.content.length > 1000
    ? message.content.slice(0, 1000) + '��'
    : message.content

  sendLog(
    message.guild, 'messages',
    'Message supprimé',
    `**Auteur :** <@${message.author.id}>\n**Salon :** <#${message.channel.id}>\n**Contenu :**\n\`\`\`${truncated.replace(/`/g, '\'')}\`\`\``,
    0xFF8800
  )
}
