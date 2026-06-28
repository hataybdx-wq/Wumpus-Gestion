// ============================================================
//  Commande : wallet
//  Affiche le solde d'une adresse crypto (ETH, BTC, SOL).
//  Détection automatique du type d'adresse.
// ============================================================

const { EmbedBuilder } = require('discord.js')

function detectType(address) {
  // Ethereum : 0x + 40 hex chars
  if (/^0x[a-fA-F0-9]{40}$/.test(address)) return 'eth'
  // Solana : 32-44 base58 chars
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) {
    // On écarte les BTC (souvent plus courts ou avec préfixe spécifique)
    if (!/^(bc1|[13])/.test(address)) return 'sol'
  }
  // Bitcoin : bc1... ou 1... ou 3...
  if (/^(bc1[a-z0-9]{25,87}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/.test(address)) return 'btc'
  return null
}

async function getEthBalance(address) {
  const fetch = require('node-fetch')
  // Utilise l'API publique eth.blockscout.com (sans clé)
  const res = await fetch(`https://eth.blockscout.com/api/v2/addresses/${address}`, { timeout: 10000 })
  if (!res.ok) throw new Error(`API ${res.status}`)
  const data = await res.json()
  const balance = parseInt(data.coin_balance || '0') / 1e18
  return { balance, token: 'ETH' }
}

async function getBtcBalance(address) {
  const fetch = require('node-fetch')
  const res = await fetch(`https://blockstream.info/api/address/${address}`, { timeout: 10000 })
  if (!res.ok) throw new Error(`API ${res.status}`)
  const data = await res.json()
  const sats = (data.chain_stats.funded_txo_sum || 0) - (data.chain_stats.spent_txo_sum || 0)
  return { balance: sats / 1e8, token: 'BTC', txs: data.chain_stats.tx_count }
}

async function getSolBalance(address) {
  const fetch = require('node-fetch')
  const res = await fetch('https://api.mainnet-beta.solana.com', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'getBalance',
      params: [address],
    }),
    timeout: 10000,
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  const balance = (data.result?.value || 0) / 1e9
  return { balance, token: 'SOL' }
}

async function getUsdPrice(symbol) {
  try {
    const fetch = require('node-fetch')
    const map = { ETH: 'ethereum', BTC: 'bitcoin', SOL: 'solana' }
    const id = map[symbol]
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd,eur`, { timeout: 5000 })
    const data = await res.json()
    return { usd: data[id]?.usd || 0, eur: data[id]?.eur || 0 }
  } catch { return { usd: 0, eur: 0 } }
}

module.exports = {
  name: 'wallet',
  description: 'Solde d\'une adresse crypto (ETH / BTC / SOL)',
  aliases: ['address', 'balance'],

  run: async (client, message, args, prefix) => {
    const address = args[0]
    if (!address) {
      return message.reply(
        `**Usage :** \`${prefix}wallet <adresse>\`\n` +
        `**Exemples :**\n` +
        `> \`${prefix}wallet 0x742d35Cc6634C0532925a3b844Bc9e7595f2BD4a\` (ETH)\n` +
        `> \`${prefix}wallet bc1q...xyz\` (BTC)\n` +
        `> \`${prefix}wallet 7xKX...abc\` (SOL)\n\n` +
        `Détection automatique du type.`
      )
    }

    const type = detectType(address)
    if (!type) return message.reply('Format d\'adresse non reconnu (ETH / BTC / SOL acceptés).')

    const waiting = await message.reply(`🔍 Récupération du solde **${type.toUpperCase()}**...`)

    try {
      let result
      if (type === 'eth') result = await getEthBalance(address)
      else if (type === 'btc') result = await getBtcBalance(address)
      else result = await getSolBalance(address)

      const price = await getUsdPrice(result.token)
      const usdValue = result.balance * price.usd
      const eurValue = result.balance * price.eur

      const explorers = {
        eth: `https://etherscan.io/address/${address}`,
        btc: `https://blockstream.info/address/${address}`,
        sol: `https://explorer.solana.com/address/${address}`,
      }

      const embed = new EmbedBuilder()
        .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
        .setTitle(`💰 Wallet ${result.token}`)
        .setColor(0xFF0000)
        .addFields(
        .setFooter({ text: 'Made by Wumpus' })
          { name: 'Adresse',  value: `\`${address}\``,                                          inline: false },
          { name: 'Solde',    value: `**${result.balance.toFixed(6)} ${result.token}**`,        inline: true },
          { name: 'Valeur',   value: `$${usdValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}\n€${eurValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}`, inline: true },
          ...(result.txs !== undefined ? [{ name: 'Transactions', value: `${result.txs}`, inline: true }] : []),
          { name: 'Explorer', value: `[Voir sur l'explorateur](${explorers[type]})`, inline: false },
        )
        .setFooter({ text: `Prix ${result.token} : $${price.usd}` })
        .setTimestamp()

      waiting.edit({ content: null, embeds: [embed] })
    } catch (err) {
      waiting.edit(`Erreur : ${err.message}`)
    }
  },
}
