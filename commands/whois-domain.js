// ============================================================
//  Commande : domain — Infos DNS d'un domaine
// ============================================================

const dns = require('dns').promises
const { EmbedBuilder } = require('discord.js')

module.exports = {
  name: 'domain',
  description: 'Infos DNS d\'un domaine',
  aliases: ['dns'],

  run: async (client, message, args, prefix) => {
    const d = args[0]?.toLowerCase()
    if (!d) return message.reply(`Usage : \`${prefix}domain <domaine>\` (ex: \`${prefix}domain google.com\`)`)

    const waiting = await message.reply('🔎 Résolution DNS...')

    try {
      const fields = []

      const [a, aaaa, mx, ns, txt, cname] = await Promise.allSettled([
        dns.resolve4(d),
        dns.resolve6(d),
        dns.resolveMx(d),
        dns.resolveNs(d),
        dns.resolveTxt(d),
        dns.resolveCname(d).catch(() => []),
      ])

      if (a.status === 'fulfilled' && a.value.length)
        fields.push({ name: 'IPv4 (A)', value: a.value.slice(0, 5).map(x => `\`${x}\``).join('\n'), inline: true })
      if (aaaa.status === 'fulfilled' && aaaa.value.length)
        fields.push({ name: 'IPv6 (AAAA)', value: aaaa.value.slice(0, 3).map(x => `\`${x}\``).join('\n'), inline: true })
      if (mx.status === 'fulfilled' && mx.value.length)
        fields.push({ name: 'MX', value: mx.value.slice(0, 5).map(x => `${x.priority} · \`${x.exchange}\``).join('\n'), inline: false })
      if (ns.status === 'fulfilled' && ns.value.length)
        fields.push({ name: 'NS', value: ns.value.slice(0, 5).map(x => `\`${x}\``).join('\n'), inline: false })
      if (txt.status === 'fulfilled' && txt.value.length)
        fields.push({ name: 'TXT', value: txt.value.slice(0, 3).map(x => `\`${x.join('').slice(0, 100)}\``).join('\n'), inline: false })

      if (fields.length === 0) return waiting.edit('Aucun enregistrement DNS trouvé.')

      waiting.edit({ content: null, embeds: [new EmbedBuilder()
        .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
        .setTitle(`🌐 ${d}`)
        .setColor(0xFF0000)
        .addFields(fields)
        .setFooter({ text: 'DNS lookup | Made by Wumpus' })
      ] })
    } catch (err) {
      waiting.edit(`Erreur : ${err.message}`)
    }
  },
}
