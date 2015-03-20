//GrimoireJS v0.1
//by Russell Champoux
//Grimoire magic item generator for the Pathfinder roleplaying game
/*global _:false, console:true */
/*global Armors, Weapons, Potions, Rings, Rods, Scrolls, Shields, Staves, Wands, WondrousItems*/
/*
module Grimoire
    # A = Armor and shields
    # W = Weapons
    # P = Potions
    # R = Rings
    # O = rOds
    # C = sCrolls
    # T = sTaves
    # N = waNds
    # S = wondrouS items
*/
'use strict';

var Grimoire = {};
Grimoire.getItems = function(num_minor, num_medium, num_major, total_value) {
    var items = [];
    _(num_minor).times(function() {
        var roll = _.random(1,100);
        switch(true) {
            case (roll <= 4):  items.push(Grimoire.getArmorOrShield('minor')); break;
            case (roll <= 9):  items.push(Weapons.getWeapon('minor')); break;
            case (roll <= 44): items.push(Potions.getPotion('minor')); break;
            case (roll <= 46): items.push(Rings.getRing('minor')); break;
            case (roll <= 81): items.push(Scrolls.getScroll('minor')); break;
            case (roll <= 91): items.push(Wands.getWand('minor')); break;
            case (roll <= 100): items.push(WondrousItems.getItem('minior')); break;
        }
    });
    _(num_medium).times(function() {
        var roll = _.random(1,100);
        switch(true) {
            case (roll <= 10): items.push(Grimoire.getArmorOrShield('medium')); break;
            case (roll <= 20): items.push(Weapons.getWeapon('medium')); break;
            case (roll <= 30): items.push(Potions.getPotion('medium')); break;
            case (roll <= 40): items.push(Rings.getRing('medium')); break;
            case (roll <= 50): items.push(Rods.getRod('medium')); break;
            case (roll <= 65): items.push(Scrolls.getScroll('medium')); break;
            case (roll <= 68): items.push(Staves.getStaff('medium')); break;
            case (roll <= 83): items.push(Wands.getWand('medium')); break;
            case (roll <= 100): items.push(WondrousItems.getItem('medium')); break;
        }
    });
    _(num_major).times(function() {
        var roll = _.random(1,100);
        switch(true) {
            case (roll <= 10): items.push(Grimoire.getArmorOrShield('major')); break;
            case (roll <= 20): items.push(Weapons.getWeapon('major')); break;
            case (roll <= 25): items.push(Potions.getPotion('major')); break;
            case (roll <= 35): items.push(Rings.getRing('major')); break;
            case (roll <= 45): items.push(Rods.getRod('major')); break;
            case (roll <= 55): items.push(Scrolls.getScroll('major')); break;
            case (roll <= 75): items.push(Staves.getStaff('major')); break;
            case (roll <= 80): items.push(Wands.getWand('major')); break;
            case (roll <= 100): items.push(WondrousItems.getItem('major')); break;
        }
    });
    items.forEach(function(i) { console.log(i);});
    return items;

};

Grimoire.getArmorOrShield = function(type, final) {
    final = typeof final !== 'undefined' ? final : true; //set to false when we recursively call getArmorOrShield
    var roll = _.random(1,100);
    if(type === 'minor') {
        switch(true) {
            case (roll <= 60): return Shields.getShields()[0];
            case (roll <= 80): return Armors.getArmors()[0];
            case (roll <= 85): return Shields.getShields()[1];
            case (roll <= 87): return Armors.getArmors()[1];
            case (roll <= 89): return Armors.getSpecific('minor');
            case (roll <= 91): return Shields.getSpecific('minor');
            case (roll <= 100): /*add modifier*/ break;
        }
    }
    else if(type === 'medium') {
        switch(true) {
            case (roll <= 5): return Shields.getShields()[0];
            case (roll <= 10): return Armors.getArmors()[0];
            case (roll <= 20): return Shields.getShields()[1];
            case (roll <= 30): return Armors.getArmors()[1];
            case (roll <= 40): return Shields.getShields()[2];
            case (roll <= 50): return Armors.getArmors()[2];
            case (roll <= 55): return Shields.getShields()[3];
            case (roll <= 57): return Armors.getArmors()[3];
            case (roll <= 60): return Armors.getSpecific('medium');
            case (roll <= 63): return Shields.getSpecific('medium');
            case (roll <= 100): /*add modifier*/ break;
        }
    }
    else if(type === 'major') {
        switch(true) {
            case (roll <= 8): return Shields.getShields()[2];
            case (roll <= 16): return Armors.getArmors()[2];
            case (roll <= 27): return Shields.getShields()[3];
            case (roll <= 38): return Armors.getArmors()[3];
            case (roll <= 49): return Shields.getShields()[4];
            case (roll <= 57): return Armors.getArmors()[4];
            case (roll <= 60): return Armors.getSpecific('major');
            case (roll <= 63): return Shields.getSpecific('major');
            case (roll <= 100): /*add modifier*/ break;
        }
    }
    if(['minor','medium','major'].indexOf(type) >= 0) {
        //this means that we hit an 'add a special effect' in one of the above cases
        var item = Grimoire.getArmorOrShield(type, false);
        var special = {'name': '', 'bonus': 0, 'cost': 0};
        //in case we can't figure out if it's an armor or shield, we can use default values

        if(item.name.search(/shield|buckler/) >= 0) {
            special = Shields.getSpecial(type);
        }
        else if (item.name.search(/armor|shirt|plate|chain|hide|mail/) >= 0) {
            special = Armors.getSpecial(type);
        }

        if(item.bonus + special.bonus <= 10) { //not alowed to go over 10
            item = {
                'name': special.name + ' ' + item.name,
                'bonus': special.bonus + item.bonus,
                'cost': special.cost + item.cost +
                Armors.getArmors()[special.bonus+item.bonus].cost - Armors.getArmors()[item.bonus].cost
            };
        }
        var i = item.name.indexOf('+');
        if(i !== -1) {
            //move the '+X' to the front
            item.name = item.name.slice(i, i+3) + item.name.slice(0, i) + item.name.slice(i+3);
        }
        return item;
    }
};
