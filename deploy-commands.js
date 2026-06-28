// ============================================================
//  deploy-commands.js — Electron Gestion
//  Enregistre toutes les slash commands auprès de Discord.
//  Lancer une seule fois : node deploy-commands.js
// ============================================================

'use strict'
require('dotenv').config()

const { REST, Routes, SlashCommandBuilder } = require('discord.js')
const fs   = require('fs')
const path = require('path')

// ── Chargement automatique des commandes prefix avec description ──
// Toutes les commandes qui ont un champ `description` dans leur module
// sont automatiquement enregistrées comme slash commands.

const PREFIX_COMMANDS_DIR = path.join(__dirname, 'commands')
const autoSlash = []

for (const file of fs.readdirSync(PREFIX_COMMANDS_DIR).filter(f => f.endsWith('.js'))) {
  try {
    // On efface le cache pour avoir la version fraîche
    const fullPath = path.join(PREFIX_COMMANDS_DIR, file)
    delete require.cache[require.resolve(fullPath)]
    const mod = require(fullPath)

    // Ignorer les commandes sans nom ou sans description
    if (!mod?.name || !mod?.description) continue

    // Ignorer les commandes déjà définies manuellement ci-dessous
    const MANUAL = ['claim', 'my-bot', 'genkey', 'prevnames']
    if (MANUAL.includes(mod.name)) continue

    // Slash commands Discord : nom max 32 chars, description max 100 chars
    const name = mod.name.slice(0, 32).toLowerCase().replace(/[^a-z0-9-]/g, '-')
    const desc = mod.description.slice(0, 100)

    autoSlash.push(
      new SlashCommandBuilder()
        .setName(name)
        .setDescription(desc)
        .toJSON()
    )
  } catch { /* ignore les fichiers mal formés */ }
}

// ── Commandes manuelles (avec options/sous-commandes) ─────────────
const manualCommands = [
  new SlashCommandBuilder()
    .setName('claim')
    .setDescription('Activer votre bot privé Electron Gestion'),

  new SlashCommandBuilder()
    .setName('my-bot')
    .setDescription('Gérer votre bot privé Electron Gestion')
    .addSubcommand(s => s.setName('status').setDescription('Voir l\'état de votre bot'))
    .addSubcommand(s => s.setName('start').setDescription('Démarrer votre bot'))
    .addSubcommand(s => s.setName('stop').setDescription('Arrêter votre bot'))
    .addSubcommand(s => s.setName('profil').setDescription('Voir le profil de votre bot'))
    .addSubcommand(s => s.setName('reset').setDescription('Supprimer votre token')),

  new SlashCommandBuilder()
    .setName('genkey')
    .setDescription('Générer des clés d\'activation [OWNER ONLY]'),

  new SlashCommandBuilder()
    .setName('prevnames')
    .setDescription('Voir les anciens pseudos d\'un membre')
    .addUserOption(o =>
      o.setName('membre')
       .setDescription('Membre à inspecter (vous-même si vide)')
       .setRequired(false)
    ),
].map(cmd => cmd.toJSON())

const allCommands = [...manualCommands, ...autoSlash]

// Dédoublonnage par nom (les manuels ont priorité)
const seen   = new Set(manualCommands.map(c => c.name))
const final  = [...manualCommands]
for (const cmd of autoSlash) {
  if (!seen.has(cmd.name)) {
    seen.add(cmd.name)
    final.push(cmd)
  }
}

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN)

;(async () => {
  try {
    console.log(`Enregistrement de ${final.length} slash commands...`)
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: final })
    console.log(`${final.length} slash commands enregistrées avec succès.`)
    console.log('Commandes :', final.map(c => `/${c.name}`).join('  '))
  } catch (err) {
    console.error('Erreur :', err)
  }
})()
