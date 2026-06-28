// ============================================================
//  Commande : steam — Recherche d'un jeu Steam
// ============================================================

const { EmbedBuilder } = require('discord.js')

module.exports = {
  name: 'steam',
  description: 'Recherche d\'un jeu Steam',
  aliases: [],

  run: async (client, message, args, prefix) => {
    const query = args.join(' ')
    if (!query) return message.reply(`Usage : \`${prefix}steam <nom du jeu>\``)

    const waiting = await message.reply('🎮 Recherche Steam...')

    try {
      const fetch = require('node-fetch')
      // Recherche
      const searchRes = await fetch(
        `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query)}&l=french&cc=FR`,
        { timeout: 10000 }
      )
      const searchData = await searchRes.json()
      if (!searchData.items?.length) return waiting.edit('Jeu introuvable.')

      const app = searchData.items[0]

      // Détails
      const detailsRes = await fetch(
        `https://store.steampowered.com/api/appdetails?appids=${app.id}&l=french&cc=FR`,
        { timeout: 10000 }
      )
      const detailsData = await detailsRes.json()
      const details = detailsData[app.id]?.data

      const embed = new EmbedBuilder()
        .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
        .setTitle(app.name)
        .setURL(`https://store.steampowered.com/app/${app.id}`)
        .setColor(0xFF0000)
        .setThumbnail(app.tiny_image)
        .setFooter({ text: 'Made by Wumpus' })

      if (details) {
        if (details.header_image) embed.setImage(details.header_image)
        if (details.short_description) embed.setDescription(details.short_description.slice(0, 500))

        const price = details.is_free ? 'Gratuit' :
          details.price_overview ? details.price_overview.final_formatted : '—'
        const discount = details.price_overview?.discount_percent
          ? ` (-${details.price_overview.discount_percent}%)` : ''

        embed.addFields(
          { name: 'Prix',           value: price + discount,                            inline: true },
          { name: 'Sortie',         value: details.release_date?.date || '—',           inline: true },
          { name: 'Développeur',    value: (details.developers || []).join(', ') || '—', inline: true },
          { name: 'Éditeur',        value: (details.publishers || []).join(', ') || '—', inline: true },
          ...(details.metacritic?.score ? [{ name: 'Metacritic', value: `${details.metacritic.score}/100`, inline: true }] : []),
          ...(details.genres ? [{ name: 'Genres', value: details.genres.map(g => g.description).join(', '), inline: false }] : []),
        )
      }

      waiting.edit({ content: null, embeds: [embed] })
    } catch (err) {
      waiting.edit(`Erreur : ${err.message}`)
    }
  },
}
