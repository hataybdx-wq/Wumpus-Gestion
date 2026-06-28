module.exports = {
  name: 'calc',
  description: 'Calculatrice simple',
  aliases: ['math', 'compute'],
  run: async (client, message, args) => {
    const expr = args.join(' ')
    if (!expr) return message.reply(`Usage : \`!calc <expression>\` (ex: \`!calc 2+2*3\`)`)

    // Seulement chiffres, opérateurs, parenthèses, espaces
    if (!/^[\d+\-*/().\s%]+$/.test(expr)) {
      return message.reply('Expression invalide (chiffres, +, -, *, /, %, (, ) uniquement).')
    }

    try {
      const result = Function(`'use strict'; return (${expr})`)()
      if (typeof result !== 'number' || !isFinite(result)) return message.reply('Résultat invalide.')
      message.reply(`\`${expr}\` = **${result}**`)
    } catch {
      message.reply('Expression invalide.')
    }
  },
}
