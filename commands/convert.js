const RATES = {
  // Longueur (base = m)
  mm: 0.001, cm: 0.01, m: 1, km: 1000,
  in: 0.0254, ft: 0.3048, yd: 0.9144, mi: 1609.344,
  // Poids (base = g)
  mg: 0.001, g: 1, kg: 1000,
  oz: 28.3495, lb: 453.592,
  // Volume (base = l)
  ml: 0.001, cl: 0.01, l: 1,
  gal: 3.78541, 'fl-oz': 0.0295735,
  // Température (spécial)
}
const GROUPS = {
  longueur: ['mm','cm','m','km','in','ft','yd','mi'],
  poids: ['mg','g','kg','oz','lb'],
  volume: ['ml','cl','l','gal','fl-oz'],
}

module.exports = {
  name: 'convert',
  description: 'Convertir des unités (longueur, poids, volume, température)',
  aliases: ['conv'],
  run: async (client, message, args) => {
    if (args.length < 3) {
      return message.reply(
        `**Usage :** \`!convert <valeur> <de> <vers>\`\n` +
        `**Exemples :**\n` +
        `> \`!convert 100 cm m\`\n` +
        `> \`!convert 5 kg lb\`\n` +
        `> \`!convert 10 mi km\`\n` +
        `> \`!convert 25 c f\` (Celsius → Fahrenheit)\n\n` +
        `**Unités :** ${Object.keys(GROUPS).map(g => `**${g}** : ${GROUPS[g].join(', ')}`).join(' · ')}\n` +
        `**Temp :** c, f, k`
      )
    }

    const val = parseFloat(args[0])
    const from = args[1].toLowerCase()
    const to   = args[2].toLowerCase()
    if (isNaN(val)) return message.reply('Valeur invalide.')

    // Température
    if (['c','f','k'].includes(from) && ['c','f','k'].includes(to)) {
      let celsius = val
      if (from === 'f') celsius = (val - 32) * 5 / 9
      if (from === 'k') celsius = val - 273.15
      let result = celsius
      if (to === 'f') result = celsius * 9 / 5 + 32
      if (to === 'k') result = celsius + 273.15
      return message.reply(`${val}°${from.toUpperCase()} = **${result.toFixed(2)}°${to.toUpperCase()}**`)
    }

    // Trouver le groupe
    const group = Object.entries(GROUPS).find(([, units]) => units.includes(from) && units.includes(to))
    if (!group) return message.reply('Unités incompatibles ou inconnues. Tape \`!convert\` pour voir les unités.')

    const baseVal = val * RATES[from]
    const result  = baseVal / RATES[to]
    message.reply(`${val} ${from} = **${result.toFixed(4)} ${to}**`)
  },
}
