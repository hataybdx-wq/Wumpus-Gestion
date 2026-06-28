// ============================================================
//  Événement : messageUpdate — Log des modifications
// ============================================================

const { sendLog } = require('../../utils/logs')

module.exports = async (client, oldMessage, newMessage) => {
  if (oldMessage.partial || newMessage.partial) return
  if (!newMessage.guild)       return
  if (!newMessage.author)      return
  if (newMessage.author.bot)   return
  if (oldMessage.content === newMessage.content) return

  const oldTrunc = (oldMessage.content || '*(vide)*').slice(0, 500)
  const newTrunc = (newMessage.content || '*(vide)*').slice(0, 500)

  sendLog(
    newMessage.guild, 'messages',
    'Message modifié',
    `**Auteur :** <@${newMessage.author.id}>\n**Salon :** <#${newMessage.channel.id}>\n[Voir le message](${newMessage.url})\n\n**Avant :**\n\`\`\`${oldTrunc.replace(/`/g, '\'')}\`\`\`\n**Après :**\n\`\`\`${newTrunc.replace(/`/g, '\'')}\`\`\``,
    0xFFAA00
  )
}
