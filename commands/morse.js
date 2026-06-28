const MORSE = {
  a:'.-',b:'-...',c:'-.-.',d:'-..',e:'.',f:'..-.',g:'--.',h:'....',i:'..',
  j:'.---',k:'-.-',l:'.-..',m:'--',n:'-.',o:'---',p:'.--.',q:'--.-',r:'.-.',
  s:'...',t:'-',u:'..-',v:'...-',w:'.--',x:'-..-',y:'-.--',z:'--..',
  '0':'-----','1':'.----','2':'..---','3':'...--','4':'....-',
  '5':'.....','6':'-....','7':'--...','8':'---..','9':'----.',
  ' ':'/','.':'.-.-.-',',':'--..--','?':'..--..','!':'-.-.--',
}
const INV = Object.fromEntries(Object.entries(MORSE).map(([k, v]) => [v, k]))

module.exports = {
  name: 'morse',
  description: 'Texte ↔ morse',
  aliases: [],
  run: async (client, message, args) => {
    if (!args.length) return message.reply(`Usage : \`!morse <texte>\` · \`!morse decode <.-. ...>\``)

    if (args[0] === 'decode' || args[0] === '-d') {
      const morse = args.slice(1).join(' ')
      const result = morse.split(' ').map(c => INV[c] || '').join('').replace(/\//g, ' ')
      return message.reply(result || 'Morse invalide.')
    }

    const text = args.join(' ').toLowerCase()
    const result = text.split('').map(c => MORSE[c] || '').join(' ').trim()
    message.reply(result.length > 1900 ? result.slice(0, 1900) : result || 'Rien à convertir.')
  },
}
