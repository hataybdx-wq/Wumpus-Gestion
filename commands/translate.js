// ============================================================
//  Commande : translate
//  Traduction via MyMemory (gratuit, 1000 mots/jour).
// ============================================================

const { EmbedBuilder } = require('discord.js')

module.exports = {
  name: 'translate',
  description: 'Traduire un texte',
  aliases: ['tr', 'traduire'],

  run: async (client, message, args, prefix) => {
    if (args.length < 2) {
      return message.reply(
        `**Usage :** \`${prefix}translate <langue> <texte>\`\n` +
        `**Exemples :**\n` +
        `> \`${prefix}translate en Bonjour le monde\`\n` +
        `> \`${prefix}translate fr Hello world\`\n` +
        `> \`${prefix}translate es Je vous aime\`\n\n` +
        `**Langues :** en, fr, es, de, it, pt, ru, ja, zh, ar, ko`
      )
    }

    const target = args[0].toLowerCase()
    const text = args.slice(1).join(' ')

    const waiting = await message.reply('🌐 Traduction...')

    try {
      const fetch = require('node-fetch')
      const res = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=auto|${target}`,
        { timeout: 10000 }
      )
      const data = await res.json()
      const translated = data.responseData?.translatedText
      if (!translated) return waiting.edit('Traduction échouée.')

      const embed = new EmbedBuilder()
        .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
        .setTitle('🌐 Traduction')
        .setColor(0xFF0000)
        .addFields(
        .setFooter({ text: 'Made by Wumpus' })
          { name: 'Original', value: text.slice(0, 1024),        inline: false },
          { name: `Vers ${target.toUpperCase()}`, value: translated.slice(0, 1024), inline: false },
        )
        .setFooter({ text: 'MyMemory | Made by Wumpus' })

      waiting.edit({ content: null, embeds: [embed] })
    } catch (err) {
      waiting.edit(`Erreur : ${err.message}`)
    }
  },
}
