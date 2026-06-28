// ============================================================
//  Commande : weather
//  Météo en temps réel via wttr.in (gratuit, sans clé).
// ============================================================

const { EmbedBuilder } = require('discord.js')

module.exports = {
  name: 'weather',
  description: 'Météo en temps réel d\'une ville',
  aliases: ['meteo-real', 'wttr'],

  run: async (client, message, args, prefix) => {
    const city = args.join(' ')
    if (!city) return message.reply(`Usage : \`${prefix}weather <ville>\` (ex: \`${prefix}weather Paris\`)`)

    const waiting = await message.reply('☁️ Récupération...')

    try {
      const fetch = require('node-fetch')
      const res = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1&lang=fr`, { timeout: 10000 })
      if (!res.ok) return waiting.edit('Impossible de récupérer la météo.')
      const data = await res.json()

      const current = data.current_condition?.[0]
      const area = data.nearest_area?.[0]
      const today = data.weather?.[0]
      if (!current) return waiting.edit('Données indisponibles.')

      const desc = current.lang_fr?.[0]?.value || current.weatherDesc?.[0]?.value || '—'
      const loc = `${area?.areaName?.[0]?.value || city}${area?.country?.[0]?.value ? `, ${area.country[0].value}` : ''}`

      const embed = new EmbedBuilder()
        .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
        .setTitle(`☁️ Météo · ${loc}`)
        .setColor(0xFF0000)
        .setDescription(`**${desc}**`)
        .addFields(
        .setFooter({ text: 'Made by Wumpus' })
          { name: 'Température', value: `${current.temp_C}°C (ressenti ${current.FeelsLikeC}°C)`, inline: true },
          { name: 'Humidité',     value: `${current.humidity}%`,                                    inline: true },
          { name: 'Vent',         value: `${current.windspeedKmph} km/h`,                            inline: true },
          { name: 'Pression',     value: `${current.pressure} hPa`,                                  inline: true },
          { name: 'Visibilité',   value: `${current.visibility} km`,                                 inline: true },
          { name: 'UV',           value: `${current.uvIndex}`,                                       inline: true },
          ...(today ? [
            { name: 'Aujourd\'hui', value: `Min : ${today.mintempC}°C · Max : ${today.maxtempC}°C`, inline: false },
            { name: 'Lever / Coucher', value: `${today.astronomy?.[0]?.sunrise} → ${today.astronomy?.[0]?.sunset}`, inline: false },
          ] : []),
        )
        .setFooter({ text: 'Source : wttr.in' })

      waiting.edit({ content: null, embeds: [embed] })
    } catch (err) {
      waiting.edit(`Erreur : ${err.message}`)
    }
  },
}
