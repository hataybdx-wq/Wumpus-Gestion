// ============================================================
//  Commande : wiki — Résumé d'un article Wikipédia
// ============================================================

const { EmbedBuilder } = require('discord.js')

module.exports = {
  name: 'wiki',
  description: 'Article Wikipédia',
  aliases: ['wikipedia'],

  run: async (client, message, args, prefix) => {
    const term = args.join(' ')
    if (!term) return message.reply(`Usage : \`${prefix}wiki <terme>\``)

    const waiting = await message.reply('📚 Recherche...')

    try {
      const fetch = require('node-fetch')
      const res = await fetch(
        `https://fr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(term.replace(/\s+/g, '_'))}`,
        { timeout: 10000 }
      )

      if (res.status === 404) return waiting.edit('Article introuvable.')
      if (!res.ok) return waiting.edit(`Erreur API (${res.status})`)
      const data = await res.json()

      const embed = new EmbedBuilder()
        .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
        .setTitle(data.title)
        .setURL(data.content_urls?.desktop?.page)
        .setColor(0xFF0000)
        .setDescription(data.extract ? data.extract.slice(0, 2000) : '_Pas d\'extrait_')
        .setFooter({ text: 'Wikipédia (fr) | Made by Wumpus' })

      if (data.thumbnail?.source) embed.setThumbnail(data.thumbnail.source)

      waiting.edit({ content: null, embeds: [embed] })
    } catch (err) {
      waiting.edit(`Erreur : ${err.message}`)
    }
  },
}
