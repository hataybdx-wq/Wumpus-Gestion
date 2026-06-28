// ============================================================
//  Commande : hash — Génère un hash de texte
// ============================================================

const crypto = require('crypto')

module.exports = {
  name: 'hash',
  description: 'Générer un hash (md5, sha256, sha512)',
  aliases: [],

  run: async (client, message, args, prefix) => {
    const algo = (args[0] || '').toLowerCase()
    const text = args.slice(1).join(' ')

    if (!['md5', 'sha1', 'sha256', 'sha512'].includes(algo) || !text) {
      return message.reply(
        `**Usage :** \`${prefix}hash <algorithme> <texte>\`\n` +
        `**Algos :** md5, sha1, sha256, sha512\n` +
        `**Exemple :** \`${prefix}hash sha256 Hello World\``
      )
    }

    const h = crypto.createHash(algo).update(text).digest('hex')
    message.reply({ embeds: [{
      title: `Hash ${algo.toUpperCase()}`,
      author: { name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' },
      description: `\`${h}\``,
      color: 0xFF0000,
      author: { name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' },
          footer: { text: 'Made by Wumpus' },
      fields: [{ name: 'Input', value: `\`${text.slice(0, 500)}\`` }],
    }] })
  },
}
