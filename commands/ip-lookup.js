// ============================================================
//  Commande : ip
//  Géolocalisation et infos sur une IP ou un domaine.
// ============================================================

const { EmbedBuilder } = require('discord.js')

module.exports = {
  name: 'ip',
  description: 'Géolocalisation d\'une IP ou d\'un domaine',
  aliases: ['iplookup', 'domain-info', 'geoip'],

  run: async (client, message, args, prefix) => {
    const target = args[0]
    if (!target) {
      return message.reply(
        `**Usage :**\n` +
        `> \`${prefix}ip <ip|domaine>\`\n` +
        `**Exemples :**\n` +
        `> \`${prefix}ip 8.8.8.8\`\n` +
        `> \`${prefix}ip google.com\``
      )
    }

    const waiting = await message.reply('🌍 Recherche...')

    try {
      const fetch = require('node-fetch')
      const res = await fetch(`http://ip-api.com/json/${encodeURIComponent(target)}?fields=66846719`, { timeout: 10000 })
      const data = await res.json()

      if (data.status !== 'success') {
        return waiting.edit(`Erreur : ${data.message || 'IP/domaine invalide'}`)
      }

      const embed = new EmbedBuilder()
        .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
        .setTitle(`🌍 ${target}`)
        .setColor(0xFF0000)
        .addFields(
        .setFooter({ text: 'Made by Wumpus' })
          { name: 'IP',         value: `\`${data.query}\``,                     inline: true },
          { name: 'Pays',       value: `${data.country} (${data.countryCode})`, inline: true },
          { name: 'Région',     value: data.regionName || '—',                   inline: true },
          { name: 'Ville',      value: data.city || '—',                         inline: true },
          { name: 'Code postal', value: data.zip || '—',                         inline: true },
          { name: 'Fuseau',     value: data.timezone || '—',                     inline: true },
          { name: 'ISP',        value: data.isp || '—',                          inline: false },
          { name: 'Organisation', value: data.org || '—',                        inline: false },
          { name: 'AS',         value: data.as || '—',                           inline: false },
          { name: 'Coords',     value: `${data.lat}, ${data.lon}`,              inline: true },
          { name: 'Mobile',     value: data.mobile ? 'Oui' : 'Non',              inline: true },
          { name: 'Proxy/VPN',  value: data.proxy ? '⚠️ Oui' : 'Non',             inline: true },
          { name: 'Hosting',    value: data.hosting ? 'Oui' : 'Non',             inline: true },
        )
        .setFooter({ text: 'ip-api.com' })

      waiting.edit({ content: null, embeds: [embed] })
    } catch (err) {
      waiting.edit(`Erreur : ${err.message}`)
    }
  },
}
