// ============================================================
//  Commande : urban
//  Définition depuis Urban Dictionary.
// ============================================================

const { EmbedBuilder } = require('discord.js')

module.exports = {
  name: 'urban',
  description: 'Définition Urban Dictionary',
  aliases: ['urbandictionary', 'ud'],

  run: async (client, message, args, prefix) => {
    const term = args.join(' ')
    if (!term) return message.reply(`Usage : \`${prefix}urban <terme>\``)

    const waiting = await message.reply('📖 Recherche...')

    try {
      const fetch = require('node-fetch')
      const res = await fetch(`https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(term)}`, { timeout: 10000 })
      const data = await res.json()

      if (!data.list?.length) return waiting.edit(`Aucune définition pour \`${term}\`.`)

      const entry = data.list[0]

      const clean = (s) => s.replace(/\[|\]/g, '').slice(0, 1024)

      const embed = new EmbedBuilder()
        .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
        .setTitle(`📖 ${entry.word}`)
        .setURL(entry.permalink)
        .setColor(0xFF0000)
        .setDescription(clean(entry.definition))
        .addFields(
        .setFooter({ text: 'Made by Wumpus' })
          { name: 'Exemple', value: clean(entry.example) || '_aucun_', inline: false },
          { name: '👍',       value: `${entry.thumbs_up}`,              inline: true },
          { name: '👎',       value: `${entry.thumbs_down}`,            inline: true },
          { name: 'Auteur',   value: entry.author || '—',               inline: true },
        )
        .setFooter({ text: 'Urban Dictionary | Made by Wumpus' })

      waiting.edit({ content: null, embeds: [embed] })
    } catch (err) {
      waiting.edit(`Erreur : ${err.message}`)
    }
  },
}
