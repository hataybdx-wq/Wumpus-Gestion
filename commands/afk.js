const db = require('quick.db')
module.exports = {
  name: 'afk',
  description: 'Marquer comme AFK',
  aliases: [],
  run: async (client, message, args) => {
    const reason = args.join(' ') || 'AFK'
    db.set(`afk_${message.author.id}`, { reason, at: Date.now() })
    message.reply(`😴 Tu es maintenant AFK : **${reason}**`)
  },
}
