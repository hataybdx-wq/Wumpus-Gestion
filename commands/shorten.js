module.exports = {
  name: 'shorten',
  description: 'Raccourcit une URL via is.gd',
  aliases: ['shorturl'],
  run: async (client, message, args) => {
    const url = args[0]
    if (!url || !/^https?:\/\//.test(url)) {
      return message.reply(`Usage : \`!shorten <url>\` (doit commencer par http:// ou https://)`)
    }
    try {
      const fetch = require('node-fetch')
      const res = await fetch(`https://is.gd/create.php?format=simple&url=${encodeURIComponent(url)}`)
      const short = await res.text()
      if (short.startsWith('http')) message.reply(`🔗 ${short}`)
      else message.reply('Échec du raccourcissement.')
    } catch {
      message.reply('Erreur réseau.')
    }
  },
}
