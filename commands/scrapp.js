// ============================================================
//  Commande : scrapp
//  Récupère les meta-données d'une URL (OpenGraph, Twitter Card)
//  pour afficher titre, description, image, favicon.
// ============================================================

const { EmbedBuilder } = require('discord.js')

function extractMeta(html, name, property = false) {
  const attr = property ? 'property' : 'name'
  const regex = new RegExp(`<meta[^>]*${attr}=["']${name}["'][^>]*content=["']([^"']*)["']`, 'i')
  const match = html.match(regex)
  if (match) return match[1]
  // Essai inverse (content avant name)
  const regex2 = new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*${attr}=["']${name}["']`, 'i')
  const match2 = html.match(regex2)
  return match2 ? match2[1] : null
}

function extractTitle(html) {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  return m ? m[1].trim() : null
}

function decodeEntities(text) {
  if (!text) return text
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
}

module.exports = {
  name: 'scrapp',
  description: 'Récupère les infos (titre, description, image) d\'une URL',
  aliases: ['scrape', 'scrap', 'preview'],

  run: async (client, message, args, prefix) => {
    const url = args[0]
    if (!url || !/^https?:\/\//i.test(url)) {
      return message.reply(
        `**Usage :** \`${prefix}scrapp <url>\`\n` +
        `**Exemples :**\n` +
        `> \`${prefix}scrapp https://github.com\`\n` +
        `> \`${prefix}scrapp https://www.lemonde.fr\``
      )
    }

    const waiting = await message.reply('🔍 Récupération des infos...')

    try {
      // Utilise fetch natif (Node.js 18+)
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)

      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        redirect: 'follow',
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout))

      if (!res.ok) {
        return waiting.edit(`⚠️ Erreur HTTP **${res.status}** : ${res.statusText}`)
      }

      const contentType = res.headers.get('content-type') || ''
      if (!contentType.includes('html')) {
        return waiting.edit(`Le contenu n'est pas une page HTML (\`${contentType}\`).`)
      }

      const html = (await res.text()).slice(0, 500000)
      const finalUrl = res.url

      const title =
        decodeEntities(extractMeta(html, 'og:title', true)) ||
        decodeEntities(extractMeta(html, 'twitter:title')) ||
        decodeEntities(extractTitle(html)) ||
        'Sans titre'

      const description =
        decodeEntities(extractMeta(html, 'og:description', true)) ||
        decodeEntities(extractMeta(html, 'twitter:description')) ||
        decodeEntities(extractMeta(html, 'description')) ||
        null

      let image =
        extractMeta(html, 'og:image', true) ||
        extractMeta(html, 'twitter:image')

      // Corriger URL relative
      if (image && !image.startsWith('http')) {
        try {
          const base = new URL(finalUrl)
          image = image.startsWith('//') ? `${base.protocol}${image}` :
                  image.startsWith('/')  ? `${base.origin}${image}` :
                  `${base.origin}/${image}`
        } catch {
          image = null
        }
      }

      const siteName =
        decodeEntities(extractMeta(html, 'og:site_name', true)) ||
        new URL(finalUrl).hostname

      const favicon = `https://www.google.com/s2/favicons?domain=${new URL(finalUrl).hostname}&sz=128`

      const embed = new EmbedBuilder()
        .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
        .setTitle(title.slice(0, 256))
        .setURL(finalUrl)
        .setColor(0xFF0000)
        .setFooter({ text: `${siteName} | Made by Wumpus`, iconURL: favicon })

      if (description) embed.setDescription(description.slice(0, 500) + (description.length > 500 ? '...' : ''))
      if (image) {
        try {
          // Vérifier que l'image est accessible
          const imgRes = await fetch(image, { method: 'HEAD', signal: AbortSignal.timeout(3000) }).catch(() => null)
          if (imgRes?.ok) embed.setImage(image)
        } catch {}
      }

      await waiting.edit({ content: null, embeds: [embed] })
    } catch (err) {
      const errMsg = err.name === 'AbortError' ? 'Temps dépassé (10s)' : err.message
      waiting.edit(`❌ Erreur : ${errMsg}`)
    }
  },
}
