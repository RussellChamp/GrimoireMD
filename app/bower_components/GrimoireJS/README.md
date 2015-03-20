GrimoireJS
========

GrimoireJS: Magic item generator for the Pathfinder tabletop RPG
written by Russell Champoux

This project contains a series of function under the 'Grimoire' module.
 * The primary file to include is grimoire.rb

Grimoire currently only rolls for items based on the Pathfinder Core Rulebook
I hope to add roll tables for the Pathfinder Advanced Player's Guide soon

While the primary purpose of this project is to be used as a library accessed by other projects, you can manually generate items by following these steps
 1. Open grimoire.html in a web browser
 2. Hit F12 to open the developer console
 3. All commands are within the following objects:
  * Grimoire
  * Armors
  * Weapons
  * Deities
  * Intelligence
  * Potions
  * Rings
  * Rods
  * Scrolls
  * Shields
  * Staves
  * Wands
  * Weapons
  * WondrousItems
Tip: All get*() function take a "type" argument that can be either 'minor', 'medium', or 'major'
Tip: Try running Grimoire.getItems(2,2,2) to generate several minor, medium, and major items

Send questions, feedback, or bug reports/fixes to RussellChamp [at] gmail [dot] com
 
