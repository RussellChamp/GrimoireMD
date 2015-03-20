//GrimoireJS v0.2
//by Russell Champoux
//Grimoire magic item generator for the Pathfinder roleplaying game
/*global $:false, _:false, Chance:false, console:true */

'use strict';

var TYPES = {
    ARMOR_AND_SHIELDS: 'Armor and Shields',
    POTIONS: 'Potions',
    RINGS: 'Rings',
    RODS: 'Rods',
    SCROLLS: 'Scrolls',
    STAVES: 'Staves',
    WANDS: 'Wands',
    WEAPONS: 'Weapons',
    WONDROUS_ITEMS: 'Wondrous Items',
    SPELLS: 'Spells'
};
var SPELL_TYPES = {
    ARCANE: 'Arcane',
    DIVINE: 'Divine'
};
var ENERGY_TYPES = {
    ACID: 'Acid',
    COLD: 'Cold',
    ELEC: 'Electricity',
    FIRE: 'Fire',
    SONIC: 'Sonic'
};
var QUALITIES = {
    MINOR:'minor',
    MEDIUM: 'medium',
    MAJOR: 'major'
};
var WEIGHTS = {};
WEIGHTS[QUALITIES.MINOR] =
{
    ARMOR_AND_SHIELDS: 4,
    WEAPONS: 5,
    POTIONS: 35,
    RINGS: 2,
    RODS: 0,
    SCROLLS: 35,
    STAVES: 0,
    WANDS: 10,
    WONDROUS_ITEMS: 9,
};
WEIGHTS[QUALITIES.MEDIUM] =
{
    ARMOR_AND_SHIELDS: 10,
    WEAPONS: 10,
    POTIONS: 10,
    RINGS: 10,
    RODS: 10,
    SCROLLS: 15,
    STAVES: 3,
    WANDS: 15,
    WONDROUS_ITEMS: 17,
};
WEIGHTS[QUALITIES.MAJOR] = {
    ARMOR_AND_SHIELDS: 10,
    WEAPONS: 10,
    POTIONS: 5,
    RINGS: 10,
    RODS: 10,
    SCROLLS: 10,
    STAVES: 20,
    WANDS: 5,
    WONDROUS_ITEMS: 20,
};


//Contains all the source info
var Grimoire = function(config) { // jshint ignore:line
    var self = this;
    this.chance = (config && config.chance ? config.chance : config && config.seed ? new Chance(config.seed) : new Chance());

    this.SOURCES = [];
    $.ajaxSetup({
        async: false //A project that works now is better than one that doesn't exist.
                     //I MUST come back and revisit this with promises later
    });
    $.getJSON('./data/sources.json', function(sources) { 
        sources.sources.forEach(function(url) {
            $.getJSON(url, function(source) {
                    console.log('loaded '+ url);
                    source.data = {};
                    //construct the data containers we will insert later data into
                    source.types.forEach(function(type) {
                        source.data[type.name] = {};
                        source.data[type.name].enabled = true;
                        if(type.source) {
                            $.getJSON(type.source, function(typeData) {
                                source.data[type.name].data = typeData;
                                console.log('loaded ' + type.source);
                            })
                            .fail(function(d, textStatus, error) {
                            console.error('getJSON failed to load '+type.source+ ', status: ' + textStatus + ', error: '+error);
                            });
                        }
                    });
                    self.SOURCES.push(source);
                })
                .fail(function(d, textStatus, error) {
                    console.error('getJSON failed to load '+url+ ', status: ' + textStatus + ', error: '+error);
                });
            });
        sources.other.forEach(function(url) {
            $.getJSON(url, function(data) {
                var dataName = url.replace(/.*\/(.*)\.json/, '$1');
                self[dataName] = data;
                console.log('loaded ' + url + ' as ' + dataName);
            })
            .fail(function(d, textStatus, error) {
                console.error('getJSON failed to load '+url+', status: '+textStatus+', error: '+error);
            });
        });
        //LOADED ALL SOURCES AND DATA
        })
        .fail(function(err) {
            console.error('Failed to load sources list:', err);
        });
    $.ajaxSetup({
        async: true
    });

    //options.sources manually select which sources you want to use
    //                  will not use sources that are marked as disabled
    //options.types manually specify what types you want to get
    this.getItems = function(quality, count, options) {
        options = options ? options : {};
        var sources = options.sources ? options.sources : self.SOURCES;
        var types = options.types ? options.types : _.values(TYPES);

        //Error checking block
        if(!sources || sources.length === 0) { console.error('No sources given!'); return items; }
        if(!types || types == 'any' || types.length === 0) { 
            types = _.values(TYPES); //set to all types
        }
        for(var i in types) { 
            if(_.values(TYPES).indexOf(types[i]) == -1) { console.error('Invalid type ' + types[i]); return items; }
        }
        if(_.values(QUALITIES).indexOf(quality) == -1) { console.error('Invalid quality ' + quality); return items; }
        if(!count || count < 1) { count = 1; }
        

        //initialize the chance engine, using a seed if provided (for testing purposes)
        //we do this now instead of reinitializing the Chance engine each time we generate an item
        self.chance = (self.chance ? self.chance : options.seed ? new Chance(options.seed) : new Chance());

        var items = [];

        _.times(count, function() {
            var item = self.getItem(quality, options);
            if(item) {
                items.push(item);
                //console.log(item);
            }
        });
        return items;
    };

    var selectSource = function(sources, quality, type, options) {
        options = options ? options : {};
        //this is a concern when "getPotions/getWands" calls "getSpell" which calls "selectSource"
        type = options.typeOverride ? options.typeOverride : type;
        quality = quality ? quality : options.quality;

        var chance = (self.chance ? self.chance : options.seed ? new Chance(options.seed) : new Chance());

        var source = {};
        var sourceWeights = {};

        //***UNIQUES FOR WEAPONS AND ARMORS***
        //************************************
        if(type == 'Uniques') {
            if(!options.itemType || !options.uniqueType) {
                console.error('itemType or uniqueType not provided', options);
            }
            sourceWeights = _.map(sources, function(source) {
                var items = source.data[options.itemType];
                if(items && items.enabled && items.data[options.uniqueType]) {
                        return _.filter(items.data[options.uniqueType],
                        function(special) { 
                            return special.weight[quality] > 0; 
                        }).length; //return a count of all specials that have a quality weight above 0
                }
                else {
                    return 0; //either itemType not found or not enabled or uniqueType not found
                }
            });
            
        }
        //***SPECIALS FOR WEAPONS AND ARMORS***
        //*************************************
        else if(type == 'Specials') {
            if(!options.itemType || !options.specialType) {
                console.error('itemType or specialType not provided', options);
            }
            sourceWeights = _.map(sources, function(source) {
                if(source.data[options.itemType] && source.data[options.itemType].enabled &&
                    source.data[options.itemType].data[options.specialType]) {
                        return _.filter(source.data[options.itemType].data[options.specialType],
                        function(special) { 
                            return special.weight[quality] > 0; 
                        }).length; //return a count of all specials that have a quality weight above 0
                }
                else {
                    return 0; //either itemType not found or not enabled or specialType not found
                }
            });
        }
        //***SPELLS AND SCROLLS AND WANDS***
        //**********************************
        else if(type == TYPES.SCROLLS || type == TYPES.SPELLS || type == TYPES.WANDS) {
            if(!options.spellType || options.spellLevel > 9 || options.spellLevel < 0) {
                console.error('Error selecting source for Spells. Invalid options', type, options);
            }
            sourceWeights = _.map(sources, function(source) {
                //Check that we have a spells section
                //AND that the specific item type we are looking for is enabled
                if(source.data[TYPES.SPELLS] && source.data[type] && source.data[type].enabled) {
                    if(source.data[TYPES.SPELLS].data[options.spellType]) {
                        return source.data[TYPES.SPELLS].data[options.spellType][options.spellLevel].length;
                    }
                    else { //source did not have my desired spell type
                        return 0;
                    }
                }
                else { //source has no spells
                    return 0;
                }
                
                });
        }
        //***POTIONS***
        //*************
        else if(type == TYPES.POTIONS) {
            sourceWeights = _.map(sources,
                function(source) {
                    if(source.data[type] && source.data[type].enabled && source.data[type].data[options.potionLevel]) {
                        return source.data[type].data[options.potionLevel].length;
                    }
                    else {
                        return 0; //either no data, disabled, or not items of that quality
                    }
                });
        }
        //***WONDROUS ITEMS***
        //********************
        else if(type == TYPES.WONDROUS_ITEMS) {
            sourceWeights = _.map(sources,
                function(source) {
                    if(source.data[type] && source.data[type].enabled && source.data[type].data[quality]) {
                        return source.data[type].data[quality].length;
                    }
                    else {
                        return 0; //either no data, disabled, or not items of that quality
                    }
                });
        }
        //***EVERYTHING ELSE***
        //*********************
        else {
            if((type == TYPES.RODS || type == TYPES.STAVES) && quality == QUALITIES.MINOR) {
                console.error('Error! There are no ' + QUALITIES.MINOR + ' ' + type);
                return;
            }
            //Determine which source to use
            //get a count from each source of what we're looking for
            sourceWeights = _.map(sources, 
                function(source) {
                    //only choose from sources that HAVE that type of item
                    //AND are enabled
                    //AND have at least one item of that quality with a probability weight
                    if(source.data[type] && source.data[type].enabled) {
                        return _.filter(source.data[type].data,
                        function(item) {
                            return item.weight[quality] > 0; 
                        }).length; 
                    }
                    else {
                        return 0;
                    }
                });
        }
        if(_.sum(sourceWeights) <= 0) {
            console.error('Unable to find valid ' + quality + ' ' + type + ' within sources!', sources);
            return;
        }
        //chance.weighted will DESTRUCTIVELY modify paramaters that have a weight of zero
        //in this case, that means sources that do not contain the selected type
        //or sources that have types we want but with no weight
        //because of that, I create a temp array that I don't care if chance mangles
        source = sources[chance.weighted(_.range(sources.length), sourceWeights)];
        return source;
    };


    this.getItem = function(quality, options) {
        options = options ? options : {};
        var sources = options.sources ? options.sources : self.SOURCES;
        var types = options.types ? options.types : _.values(TYPES);

        var chance = (self.chance ? self.chance : options.seed ? new Chance(options.seed) : new Chance());

        var itemType = '';
        if(types.length == 1) {
            itemType = types[0];
        }
        else {
            //Create a weighted-average map based on the desired types
            var localWeights = _.clone(WEIGHTS[quality]); //copy the default weighted-average for this quality
            for(var key in localWeights) {
                if(_.values(types).indexOf(TYPES[key]) == -1) { //remove any items that were not selected
                    delete localWeights[key];
                }
            }
            //Determine the type of item to generate
            itemType = TYPES[chance.weighted(_.keys(localWeights), _.values(localWeights))];
        }
        
        var item = {};
        var source = {};

        //GENERATE ITEM
        //SCROLLS
        if(itemType == TYPES.SCROLLS) {
            item = self.getScroll(quality, options);
        }
        //POTIONS
        else if(itemType == TYPES.POTIONS) {
            item = self.getPotion(quality, options);
        }
        //WANDS
        else if(itemType == TYPES.WANDS) {
            item = self.getWand(quality, options);
        }
        //WONDROUS ITEMS
        else if(itemType == TYPES.WONDROUS_ITEMS) {
            item = self.getWondrousItem(quality, options);
        }
        //WEAPONS
        else if(itemType == TYPES.WEAPONS) {
            item = self.getWeapon(quality, options);
        }
        //ARMOR AND SHIELDS
        else if(itemType == TYPES.ARMOR_AND_SHIELDS) {
            item = self.getArmorOrShield(quality, options);
        }
        //RINGS
        else if(itemType == TYPES.RINGS) {
            item = self.getRing(quality, options);
        }
        //RODS
        else if(itemType == TYPES.RODS) {
            item = self.getRod(quality, options);
        }
        //STAVES
        else if(itemType == TYPES.STAVES) {
            item = self.getStaff(quality, options);
        }
        //EVERYTHING ELSE NOT LISTED.
        //All TYPES should have their own 'get' method but this allows for additional types to be added
        // as long as they follow the data structure standard of source.data.type and contain weights
        else {
            //Select the item source based on the quality and item type
            source = selectSource(sources, quality, itemType, options);

            item = self.getWeightedItem(source.data[itemType].data, quality);
            item.source = source.shortName;
            item.itemType = itemType;
        }

        if(!options.disableClue && chance.d100() <= (options.clueChance || 20)) {
            item.name += ' with a clue to it\'s purpose!';
        }
        item.quality = quality;
        return item;
    };

    //options.maxRoll - override the maximul value that can be rolled for these items
    //                  default is the sum of the quality weights
    this.getWeightedItem = function(itemData, quality, options) {
        options = options ? options : {};
        var chance = (self.chance ? self.chance : options.seed ? new Chance(options.seed) : new Chance());

        var maxRoll = options.maxRoll || _.sum(_.map(itemData, function(item) { 
                                                return item.weight[quality]; }));
        var roll = chance.integer({min: 1, max: maxRoll});
        var item = {};

        for(var i in itemData) { //check all 'itemType' items in the source
                if(roll <= itemData[i].weight[quality]) { //if we roll under their weighted probability
                    item = _.clone(itemData[i]);
                    delete item.weight;
                    return item;
                }
                else { //decrease the roll value by the current item's weighted probability
                    roll -= itemData[i].weight[quality];
                }
            }
        console.error('Could not find valid '+quality+'item in',itemData);
    };

    //options.type can be 'Arcane' or 'Divine'
    this.getSpells = function(level, count, options) {
        options = options ? options : {};

        var spells = [];
        self.chance = (self.chance ? self.chance : options.seed ? new Chance(options.seed) : new Chance());

        _.times(count, function() {
            spells.push(self.getSpell(level, options));
        });

        return spells;
    };

    //options.type can be 'Arcane' or 'Divine'
    this.getSpell = function(level, options) {
        options = options ? options : {};
        var sources = options.sources ? options.sources : self.SOURCES;
        var type = options.type;

        //initialize the chance engine, using a seed if provided (for testing purposes)
        var chance = (self.chance ? self.chance : options.seed ? new Chance(options.seed) : new Chance());
        
        var spellType = type ? type : chance.pick(_.values(SPELL_TYPES));
        options.spellType = spellType;
        options.spellLevel = level;
        var source = selectSource(sources, options.quality, TYPES.SPELLS, options);
        //console.log('Generating a level ' + level + ' ' + spellType + ' spell from ' + source.shortName);

        var spell = {
            name: chance.pick(source.data[TYPES.SPELLS].data[spellType][level]),
            level: level,
            type: spellType,
            source: source.shortName
        };

        return spell;
    };

    //options.level manually override the scroll spell level
    this.getScroll = function(quality, options) {
        options = options ? options : {};

        var chance = (self.chance ? self.chance : options.seed ? new Chance(options.seed) : new Chance());

        var cost = [12.5, 25, 150, 375, 700, 1125, 1650, 2275, 3000, 3825];
        var spellLevel = options.scrollLevel;

        if(!spellLevel || spellLevel < 0 || spellLevel > 9) {
            var weights = {};
            weights[QUALITIES.MINOR]  = [5, 45, 45,  5,  0,  0,  0,  0,  0, 0];
            weights[QUALITIES.MEDIUM] = [0,  0,  5, 60, 30,  5,  0,  0,  0, 0];
            weights[QUALITIES.MAJOR]  = [0,  0,  0,  0,  5, 45, 20, 15, 10, 5];

            spellLevel = chance.weighted([0,1,2,3,4,5,6,7,8,9], weights[quality]);
        }

        options.quality = quality;
        var spell = self.getSpell(spellLevel, options);

        return {
            'name': 'Scroll of ' + spell.name,
            'description': '(' + spell.type + ', spell level ' + spellLevel + ', caster level ' + _.max([1, (spellLevel*2-1)]) + ')',
            'cost': cost[spellLevel],
            'source': spell.source,
            'itemType': TYPES.SCROLLS
        };
    };

    this.getPotion = function(quality, options) {
        options = options ? options : {};
        var sources = options.sources ? options.sources : self.SOURCES;
        var level = options.potionLevel;

        var chance = (self.chance ? self.chance : options.seed ? new Chance(options.seed) : new Chance());
        var cost = [25, 50, 300, 750];
        
        if(!level || level < 0 || level > 3) {
            var weights = {};
            weights[QUALITIES.MINOR]  = [20, 40, 40,  0];
            weights[QUALITIES.MEDIUM] = [ 0, 20, 40, 40];
            weights[QUALITIES.MAJOR]  = [ 0,  0, 20, 80];

            level = chance.weighted([0,1,2,3], weights[quality]);
        }
        options.typeOverride = TYPES.POTIONS;
        options.potionLevel = level;
        var source = selectSource(sources, quality, TYPES.POTIONS, options);

        return {
            'name': 'Potion/Oil of ' + chance.pick(source.data[TYPES.POTIONS].data[level]),
            'description': '(spell level ' + level + ', caster level ' + _.max([1, (level*2-1)]) + ')',
            'cost': cost[level],
            'source': source.shortName,
            'itemType': TYPES.POTIONS
        };
    };

    this.getWand = function(quality, options) {
        options = options ? options : {};
        var level = options.wandLevel;

        var chance = (self.chance ? self.chance : options.seed ? new Chance(options.seed) : new Chance());
        var cost = [375, 750, 4500, 11250, 21000];


        if(!level || level < 0 || level > 4) {
            var weights = {};
            weights[QUALITIES.MINOR]  = [ 5, 55, 40,  0,  0];
            weights[QUALITIES.MEDIUM] = [ 0,  0, 60, 40,  0];
            weights[QUALITIES.MAJOR]  = [ 0,  0,  0, 60, 40];

            level = chance.weighted([0,1,2,3,4], weights[quality]);
        }

        options.wandLevel = level;
        options.typeOverride = TYPES.WANDS;
        options.spellType = SPELL_TYPES.ARCANE;
        var spell = self.getSpell(level, options);
        return {'name': 'Wand of ' + spell.name,
                'description': '(spell level ' + level + ', caster level ' + _.max([1, (level*2-1)]) + ', 50 charges)',
                'cost': cost[level],
                'source': spell.source,
                'itemType': TYPES.WANDS
            };
    };

    this.getWondrousItem = function(quality, options) {
        options = options ? options : {};
        var chance = (self.chance ? self.chance : options.seed ? new Chance(options.seed) : new Chance());

        //Select the item source based on the quality and item type
        var sources = options.sources ? options.sources : self.SOURCES;
        var source = selectSource(sources, quality, TYPES.WONDROUS_ITEMS, options);

        //wondrous items of the same quality have equal probability weight
        var item = _.clone(chance.pick(source.data[TYPES.WONDROUS_ITEMS].data[quality]));
        item.source = source.shortName;
        item.itemType = TYPES.WONDROUS_ITEMS;
        
        //consumable items should NEVER be intelligent. I don't have a perfect filter, but here's a start
        //I may instead add an attribute for 'consumable'
        if(!/\b(dust|token|tome|elixir|salve|ointment|polish)\b/i.test(item.name)) {
            //make an intelligent item if we either want ALL intelligent items
            //OR intelligent items are NOT disabled AND we roll under the chance threshold
            if(options.allIntelligent || (!options.disableIntelligent && chance.d100() <= (options.intelligenceChance || 1))) {
                item.intelligence = self.getIntelligence(item.cost, options); //'WOOHOO I AM INTELLIGENT!';
                item.cost += item.intelligence.cost;
            }
        }
        return item;
    };

    this.getRing = function(quality, options) {
        options = options ? options : {};

        var sources = options.sources ? options.sources : self.SOURCES;
        var source = selectSource(sources, quality, TYPES.RINGS, options);
        var ring = self.getWeightedItem(source.data[TYPES.RINGS].data, quality);
        ring.source = source.shortName;
        ring.itemType = TYPES.RINGS;
        return ring;
    };

    this.getRod = function(quality, options) {
        options = options ? options : {};

        var sources = options.sources ? options.sources : self.SOURCES;
        var source = selectSource(sources, quality, TYPES.RODS, options);
        var rod = self.getWeightedItem(source.data[TYPES.RODS].data, quality);
        rod.source = source.shortName;
        rod.itemType = TYPES.RODS;
        return rod;
    };

    this.getStaff = function(quality, options) {
        options = options ? options : {};
        if(quality == QUALITIES.MINOR) {
            console.error('Error! There are no minor staves!');
            return;
        }

        var sources = options.sources ? options.sources : self.SOURCES;
        var source = selectSource(sources, quality, TYPES.STAVES, options);
        var staff = self.getWeightedItem(source.data[TYPES.STAVES].data, quality);
        staff.source = source.shortName;
        staff.itemType = TYPES.STAVES;

        return staff;
    };

    this.getHumanoid = function(options) {
        options = options ? options : {};
        var chance = (self.chance ? self.chance : options.seed ? new Chance(options.seed) : new Chance());
        return chance.weighted(
            _.map(self.Humanoids, function(h) { return h.name; }),
            _.map(self.Humanoids, function(h) { return h.weight; }));
    };

    this.getOutsider = function(options) {
        options = options ? options : {};
        var chance = (self.chance ? self.chance : options.seed ? new Chance(options.seed) : new Chance());
        return chance.weighted(
            _.map(self.Outsiders, function(o) { return o.name; }),
            _.map(self.Outsiders, function(o) { return o.weight; }));
    };
    this.getBane = function(options) {
        options = options ? options : {};
        var chance = (self.chance ? self.chance : options.seed ? new Chance(options.seed) : new Chance());
        var bane = chance.weighted(
            _.map(self.Banes, function(b) { return b.name; }),
            _.map(self.Banes, function(b) { return b.weight; }));
        bane = bane.replace(/GET_HUMANOID_TYPE/, self.getHumanoid(options));
        bane = bane.replace(/GET_OUTSIDER_TYPE/, self.getOutsider(options));
        return bane;
    };
    this.getEnergyType = function(options) {
        options = options ? options : {};
        var chance = (self.chance ? self.chance : options.seed ? new Chance(options.seed) : new Chance());

        return chance.pick(_.values(ENERGY_TYPES));
    };

    //type is 'armor', 'shield', 'melee', or 'ranged'
    //options.excludeSpecials can contain a list of specials you do NOT want to get
    //this is useful when creating a weapon that you do not want to have duplicate specials
    //options.disableRecursiveSpecials 
    this.getSpecials = function(quality, type, options) {
        options = options ? options : {};
        options.excludeSpecials = options.excludeSpecials ? options.excludeSpecials : [];
        options.itemType = options.itemType ? options.itemType : 
                            (type == 'melee' || type == 'ranged') ? TYPES.WEAPONS :
                            (type == 'armor' || type == 'shield') ? TYPES.ARMOR_AND_SHIELDS :
                            undefined;
        options.specialType = type + 'Specials';
        options.disableRecursiveSpecials = options.disableRecursiveSpecials || false;
        if(!options.itemType) {
            console.error('Invalid special type', type);
            return;
        }

        var chance = (self.chance ? self.chance : options.seed ? new Chance(options.seed) : new Chance());
        var sources = options.sources ? options.sources : self.SOURCES;

        var specials = [];
        var special = {};
        do {
            var source = selectSource(sources, quality, 'Specials', options);
            //data source will look like source.data.Weapons.meleeSpecials

            special = self.getWeightedItem(source.data[options.itemType].data[options.specialType], quality);
            special.source = source.shortName;

            //EXCEPTION for Bane special
            if(/GET_BANE_TYPE/.test(special.name)) {
                special.name = special.name.replace(/GET_BANE_TYPE/, self.getBane(options));
            } else if(/GET_ENERGY_RESISTANCE_TYPE/.test(special.name)) {
                special.name = special.name.replace(/GET_ENERGY_RESISTANCE_TYPE/, self.getEnergyType(options));
            }

        } while(_.chain(options.excludeSpecials).map(function(s) { return s.name; }).includes(special.name).value()); //if we get something from our exclusions, try again
        specials.push(special);

        var roll = chance.d100();
        //chance for a second special
        if((quality == QUALITIES.MINOR && roll === 100) ||
            (quality == QUALITIES.MEDIUM && roll > 95) ||
            (quality == QUALITIES.MAJOR && roll > 90)) {
            
            options.excludeSpecials = options.excludeSpecials.concat(specials); //exclude the special(s) just rolled
            var bonusSpecials = self.getSpecials(quality, type, options);
            if(options.disableRecursiveSpecials) {
                specials.push(bonusSpecials[0]); //if we're not allowed to return recursive specials, just take the first one
            }
            else {
                specials = specials.concat(bonusSpecials);
            }
        }

        return specials; //return special as array in case we need to concat it with another special
    };

    this.getUniqueWeapon = function(quality, options) {
        options = options ? options : {};
        options.itemType = TYPES.WEAPONS;
        options.uniqueType = 'uniqueWeapons';

        var sources = options.sources ? options.sources : self.SOURCES;

        var source = selectSource(sources, quality, 'Uniques', options);
        var weapon = self.getWeightedItem(source.data[TYPES.WEAPONS].data.uniqueWeapons, quality);
        weapon.source = source.shortName;
        weapon.itemType = TYPES.WEAPONS;

        return weapon;
    };

    //options.type can be 'melee' or 'ranged'
    //note that this option is NOT alwawys honored when a unique item is rolled
    //I'm not sure if unique weapons should be allowed to have modifiers.
    //I'm allowing it because it is more awesome. This can cause problems when the unique rolled is, for example, an arrow
    //config.disableRecursiveSpecials If you roll 'get a special and roll again' twice, it will only
    // generate one specials
    this.getWeapon = function(quality, options) {
        options = options ? options : {};
        options.excludeSpecials = options.excludeSpecials || [];
        options.disableRecursiveSpecials = options.disableRecursiveSpecials || false;
        var chance = (self.chance ? self.chance : options.seed ? new Chance(options.seed) : new Chance());
        var weapon = {
            name: '',
            type: '',
            bonus: 0,
            baseCost: 0,
            cost: 0,
            specials: [],
            intelligence: {},
            glowing: false
        };
        weapon.type = (options.type == 'melee' || options.type == 'ranged') ? options.type
                    : chance.weighted(['melee', 'ranged'], [7,3]);

        var roll = chance.d100();
        var action = '';

        if(quality == QUALITIES.MINOR) {
            if(roll <= 70) {
                //generic +1 weapon
                weapon.bonus = 1;
            }
            else if(roll <= 85) {
                //generic +2 weapon
                weapon.bonus = 2;
            }
            else if(roll <= 90) {
                action = 'getUnique';
            }
            else {
                //10% special ability and roll again
                action = 'getSpecial';
            }
        }
        else if(quality == QUALITIES.MEDIUM) {
            if(roll <= 10) {
                weapon.bonus = 1;
            }
            else if(roll <= 29) {
                weapon.bonus = 2;
            }
            else if(roll <= 58) {
                weapon.bonus = 3;
            }
            else if(roll <= 62) {
                weapon.bonus = 4;
            }
            else if(roll <= 68) {
                action = 'getUnique';
            }
            else {
                //32% special ability and roll again
                action = 'getSpecial';
            }            
        }
        else if(quality == QUALITIES.MAJOR) {
            if(roll <= 20) {
                weapon.bonus = 3;
            }
            else if(roll <= 38) {
                weapon.bonus = 4;
            }
            else if(roll <= 49) {
                weapon.bonus = 5;
            }
            else if(roll <= 63) {
                action = 'getUnique';
            }
            else {
                //37% special ability and roll again
                action = 'getSpecial';
            }
        }
        else {
            console.error('invalid quality', quality);
            return;
        }
        if(action == 'getUnique') {
            var unique = self.getUniqueWeapon(quality, options);
            weapon.name = unique.name;
            weapon.baseCost = unique.cost;
            weapon.source = unique.source;
            weapon.url = unique.url;
        }
        else if(action == 'getSpecial') {
            //if we either do not already have any specials OR we allow recursive specials
            if(weapon.specials.length === 0 || options.disableRecursiveSpecials === false) {
                weapon = self.getWeapon(quality, options);
                var specialsBonus = _.chain(weapon.specials).map(function(s) { return s.bonus; }).sum().value();
                var specials = [];
                var newSpecialsBonus = 0;
                options.excludeSpecials = options.excludeSpecials.concat(weapon.specials);
                if(weapon.bonus + specialsBonus < 10) {
                    var tries = 5;
                    //this has the opportunity to loop forever either if no match can be found
                    do {
                        specials = self.getSpecials(quality, weapon.type, options);
                        newSpecialsBonus = _.chain(specials).map(function(s) { return s.bonus; }).sum().value();
                    } while(weapon.bonus + specialsBonus + newSpecialsBonus > 10  && --tries > 0);
                    if(tries > 0) { //we found a match without running out of tries!
                        weapon.specials = weapon.specials.concat(specials);
                    }
                }
            }
        }        

        //ALL
        //1% chance to be intelligent (NOT usable items - eg Arrows)
        //30% chance to be glowing
        if(options.allIntelligent || 
            (!options.disableIntelligent && chance.d100() <= (options.intelligenceChance || 1))) {
            var cost = weapon.baseCost + 2000 * Math.pow(weapon.bonus, 2);
            weapon.intelligence = self.getIntelligence(cost, options); //'WOOHOO I AM INTELLIGENT!';
            weapon.cost += weapon.intelligence.cost;
        }
        if(!options.disableGlowing && chance.d100() <= (options.glowingChance || 30)) {
            weapon.glowing = true;
        }
        
        var totalBonus = weapon.bonus + _.sum(_.map(weapon.specials, function(s) { return s.bonsu; }));
        weapon.cost = weapon.baseCost + 2000 * Math.pow(totalBonus, 2) + (weapon.intelligence.cost || 0);
        weapon.print = function() {
            var ret = 'Name: ';
            ret += this.glowing ? 'Glowing ' : '';
            ret += this.bonus > 0 ? ('+' + this.bonus + ' ') : '';
            ret += this.specials.length > 0 ? _.map(this.specials, function(s) { return s.name;}).join(', ') + ' ' : '';
            ret += this.name ? this.name : (this.type + ' weapon');
            ret += ';';
            ret += this.intelligence.print ? 'Intelligence: [' + this.intelligence.print() + '];' : '';
            ret += 'Cost: ' + this.cost + 'gp';
            return ret;
        };

        weapon.itemType = TYPES.WEAPONS;
        return weapon;
    };

    this.getUniqueArmorOrShield = function(quality, options) {
        options = options ? options : {};
        var chance = (self.chance ? self.chance : options.seed ? new Chance(options.seed) : new Chance());

        options.itemType = TYPES.ARMOR_AND_SHIELDS;
        options.uniqueType = (options.type == 'armor' ? 'uniqueArmors' :
                                options.type == 'shield' ? 'uniqueShields' :
                                chance.pick(['uniqueArmors', 'uniqueShields'])); //50-50 chance if type is not selected
        options.disableRecursiveSpecials = options.disableRecursiveSpecials || false;

        var sources = options.sources ? options.sources : self.SOURCES;

        var source = selectSource(sources, quality, 'Uniques', options);
        var item = self.getWeightedItem(source.data[TYPES.ARMOR_AND_SHIELDS].data[options.uniqueType], quality);
        item.source = source.shortName;
        item.itemType = TYPES.ARMOR_AND_SHIELDS;

        return item;
    };

    //options.type can be 'armor' or 'shield'
    this.getArmorOrShield = function(quality, options) {
        options = options ? options : {};
        options.excludeSpecials = options.excludeSpecials || [];
        options.maxSpecials = options.maxSpecials || 5;
        var chance = (self.chance ? self.chance : options.seed ? new Chance(options.seed) : new Chance());

        var item = {
            name: '',
            type: '',
            bonus: 0,
            baseCost: 0,
            cost: 0,
            specials: [],
        };

        var roll = chance.d100();
        var action = '';

        if(quality == QUALITIES.MINOR) {
            if(roll <= 60) {
                item.type = 'shield';
                item.bonus = 1;
            }
            else if(roll <= 80) {
                item.type = 'armor';
                item.bonus = 1;
            }
            else if(roll <= 85) {
                item.type = 'shield';
                item.bonus = 2;
            }
            else if(roll <= 87) {
                item.type = 'armor';
                item.bonus = 2;
            }
            else if(roll <= 89) {
                item.type = 'armor';
                action = 'getUnique';
            }
            else if(roll <= 91) {
                item.type = 'shield';
                action = 'getUnique';
            }
            else if(roll <= 100) {
                //9% special ability and roll again
                action = 'getSpecial';
            }
        }
        else if(quality == QUALITIES.MEDIUM) {
            if(roll <= 5) {
                item.type = 'shield';
                item.bonus = 1;
            }
            else if(roll <= 10) {
                item.type = 'armor';
                item.bonus = 1;
            }
            else if(roll <= 20) {
                item.type = 'shield';
                item.bonus = 2;
            }
            else if(roll <= 30) {
                item.type = 'armor';
                item.bonus = 2;
            }
            else if(roll <= 40) {
                item.type = 'shield';
                item.bonus = 3;
            }
            else if(roll <= 50) {
                item.type = 'armor';
                item.bonus = 3;
            }
            else if(roll <= 55) {
                item.type = 'shield';
                item.bonus = 4;
            }
            else if(roll <= 57) {
                item.type = 'armor';
                item.bonus = 2;
            }
            else if(roll <= 60) {
                item.type = 'armor';
                action = 'getUnique';
            }
            else if(roll <= 63) {
                item.type = 'shield';
                action = 'getUnique';
            }
            else if(roll <= 100) {
                //37% special ability and roll again
                action = 'getSpecial';
            }
        }
        else if(quality == QUALITIES.MAJOR) {
            if(roll <= 8) {
                item.type = 'shield';
                item.bonus = 3;
            }
            else if(roll <= 16) {
                item.type = 'armor';
                item.bonus = 3;
            }
            else if(roll <= 27) {
                item.type = 'shield';
                item.bonus = 4;
            }
            else if(roll <= 38) {
                item.type = 'armor';
                item.bonus = 4;
            }
            else if(roll <= 49) {
                item.type = 'shield';
                item.bonus = 5;
            }
            else if(roll <= 57) {
                item.type = 'armor';
                item.bonus = 5;
            }
            else if(roll <= 60) {
                item.type = 'armor';
                action = 'getUnique';
            }
            else if(roll <= 63) {
                item.type = 'shield';
                action = 'getUnique';
            }
            else if(roll <= 100) {
                //37% special ability and roll again
                action = 'getSpecial';
            }
        }
        if(action == 'getUnique') {
            options.type = item.type;
            var unique = self.getUniqueArmorOrShield(quality, options);
            item.name = unique.name;
            item.baseCost = unique.cost;
            item.url = unique.url;
        }
        else if(action == 'getSpecial') {
            if(item.specials.length === 0 || options.disableRecursiveSpecials === false) {
                item = self.getArmorOrShield(quality, options);
                var specialsBonus = _.chain(item.specials).map(function(s) { return s.bonus; }).sum().value();

                var specials = [];
                var newSpecialsBonus = 0;
                options.excludeSpecials = options.excludeSpecials.concat(item.specials);

                if(item.bonus + specialsBonus < 10) {
                    var tries = 5;
                    //this has the opportunity to loop forever either if no match can be found
                    do {
                        specials = self.getSpecials(quality, item.type, options);
                        newSpecialsBonus = _.chain(specials).map(function(s) { return s.bonus; }).sum().value();

                    } while(item.bonus + specialsBonus + newSpecialsBonus > 10 && --tries > 0);
                    if(tries > 0) { //we found a match without running out of tries!
                        item.specials = item.specials.concat(specials);
                    }
                }
            }
        }


        var totalBonus = item.bonus + _.sum(_.map(item.specials, function(s) { return s.bonsu; }));
        item.cost = item.baseCost + 1000 * Math.pow(totalBonus, 2);

        item.print = function() {
            var ret = 'Name: ';
            ret += this.bonus > 0 ? ('+' + this.bonus + ' ') : '';
            ret += this.specials.length > 0 ? _.map(this.specials, function(s) { return s.name;}).join(', ') + ' ' : '';
            ret += this.name ? this.name : this.type;
            ret += ';';
            ret += 'Cost: ' + this.cost + 'gp';
            return ret;
        };

        item.itemType = TYPES.ARMOR_AND_SHIELDS;
        return item;
    };


    //can take clWeights and geWeights to weight the alignment probabilities
    //clWeights are for [chaotic, neutral, lawful]
    //geWeights are for [good, neutral, evil]
    this.getAlignment = function(options) {
        options = options ? options : {};
        var chance = (self.chance ? self.chance : options.seed ? new Chance(options.seed) : new Chance());
        var clWeights = options.clWeights ? options.clWeights : [1,1,1];
        var geWeights = options.geWeights ? options.geWeights : [1,1,1];

        var alignment = chance.weighted(['Chaotic', 'Neutral', 'Lawful'], clWeights) +
                        ' ' +
                        chance.weighted(['Good', 'Neutral', 'Evil'], geWeights);
        if(alignment == 'Neutral Neutral') {
            alignment = 'True Neutral';
        }
        return alignment;
    };

    //options.cl can be Chaotic, Neutral, or Lawful
    //options.ge can be Good, Neutral, or Evil
    this.getDeity = function(options) {
        options = options ? options : {};
        var chance = (self.chance ? self.chance : options.seed ? new Chance(options.seed) : new Chance());
        var cl = options.cl || chance.pick(['Chaotic', 'Neutral', 'Lawful']);
        var ge = options.ge || chance.pick(['Good', 'Neutral', 'Evil']);
        var deity = {};
        deity.name = chance.pick(self.Deities.data[cl][ge]);
        deity.alignment = (cl == 'Neutral' && ge == 'Neutral') ? 'True Neutral' : (cl + ' ' + ge);

        return deity;
    };

    //baseCost is the base cost of the item the intelligence is being made for. 
    //This directly affects the intelligence's ego score!
    //baseCost also directly affects the probability of the number of special abilities an intelligence will have
    //options.numPowers
    //options.purposeChance
    //options.numDedicatedPowers
    this.getIntelligence = function(baseCost, options) {
        baseCost = baseCost || 0;
        options = options || {};
        var chance = (self.chance ? self.chance : options.seed ? new Chance(options.seed) : new Chance());
        var i = {}; //intelligence object. we'll be referencing this a LOT


        //***BASE VALUES***
        i.cost = 500; //base starting cost
        i.ego = 0;
        //Base cost ego modifier
        switch(true) {
            case (baseCost <= 1000): i.ego += 0; break;
            case (baseCost <= 5000): i.ego += 1; break;
            case (baseCost <= 10000): i.ego += 2; break;
            case (baseCost <= 20000): i.ego += 3; break;
            case (baseCost <= 50000): i.ego += 4; break;
            case (baseCost <= 100000): i.ego += 6; break;
            case (baseCost <= 200000): i.ego += 8; break;
            case (baseCost  > 200000): i.ego += 12; break;
        }


        //***ITEM ABILITY STATS***
        var statScores = [
                            {'score': 10, 'costMod': 0, 'egoMod': 0},
                            {'score': 11, 'costMod': 200, 'egoMod': 0},
                            {'score': 12, 'costMod': 500, 'egoMod': 1},
                            {'score': 13, 'costMod': 700, 'egoMod': 1},
                            {'score': 14, 'costMod': 1000, 'egoMod': 2},
                            {'score': 15, 'costMod': 1400, 'egoMod': 2},
                            {'score': 16, 'costMod': 2000, 'egoMod': 3},
                            {'score': 17, 'costMod': 2800, 'egoMod': 3},
                            {'score': 18, 'costMod': 4000, 'egoMod': 4},
                            {'score': 19, 'costMod': 5200, 'egoMod': 4},
                            {'score': 20, 'costMod': 8000, 'egoMod': 5},
                        ];
        var statWeights = [10, 10, 20, 10, 20, 5, 5, 5, 5, 5, 5];

        i.stats = {};
        ['intelligence', 'wisdom', 'charisma'].forEach(function(stat) {
            var score = chance.weighted(statScores, statWeights);
            i.stats[stat] = score.score;
            i.cost += score.costMod;
            i.ego += score.egoMod;
        });

        i.alignment = self.getAlignment(options);


        //***ITEM COMMUNICATION AND SENSES***
        //get communication ability for the item.
        var communicationTypes = [
            {'description': 'Empathy', 'costMod': 0, 'egoMod': 0},
            {'description': 'Speech', 'costMod': 500, 'egoMod': 0},
            {'description': 'Telepathy', 'costMod': 1000, 'egoMod': 1},
        ];
        var communicationWeights = [3,4,3]; //There was no roll table so I made this up
        var communication = chance.weighted(communicationTypes, communicationWeights);

        //get senses for the item. there was no roll table so I made this up
        var basicSenses = [
            {'description': 'Senses (30 ft.)', 'costMod': 0, 'egoMod': 0},
            {'description': 'Senses (60 ft.)', 'costMod': 500, 'egoMod': 0},
            {'description': 'Senses (120 ft.)', 'costMod': 1000, 'egoMod': 0},
        ];
        var basicSensesWeights = [5,3,2]; //There was no roll table so I made this up
        var basicSense = chance.weighted(basicSenses, basicSensesWeights);

        //get special senses for the item. 
        var specialSenses = [
            {'description': '', 'costMod': 0, 'egoMod': 0},
            {'description': 'Darkvision', 'costMod': 500, 'egoMod': 0},
            {'description': 'Blindsense', 'costMod': 5000, 'egoMod': 1},
            {'description': 'Read languages', 'costMod': 1000, 'egoMod': 1},
            {'description': 'Read magic', 'costMod': 2000, 'egoMod': 1},
        ];
        //There was no roll table so I made this up and limited it to only 1 special per item
        var specialSensesWeights = [50, 20, 5, 15, 10];
        var specialSense = chance.weighted(specialSenses, specialSensesWeights);
        
        i.communication = communication.description;
        i.senses = basicSense.description + (specialSense.description ? ', ' + specialSense.description : '');

        i.cost += communication.costMod + basicSense.costMod + specialSense.costMod;
        i.ego += communication.egoMod + basicSense.egoMod + specialSense.egoMod;


        //***ITEM POWERS***
        //Get item powers!
        var powerCountWeights = [1,1,1,1,1];
        //The probability for more powers is directly related to the base cost of the item
        //I made up these roll weights. references the same basecost as the basic ego modifier
        switch(true) {
            case (baseCost <= 1000):   powerCountWeights = [6,4,0,0,0]; break;
            case (baseCost <= 5000):   powerCountWeights = [3,4,3,0,0]; break;
            case (baseCost <= 10000):  powerCountWeights = [2,3,4,1,0]; break;
            case (baseCost <= 20000):  powerCountWeights = [1,3,4,2,0]; break;
            case (baseCost <= 50000):  powerCountWeights = [0,2,4,3,1]; break;
            case (baseCost <= 100000): powerCountWeights = [0,1,3,4,2]; break;
            case (baseCost <= 200000): powerCountWeights = [0,0,2,5,3]; break;
            case (baseCost  > 200000): powerCountWeights = [0,0,0,6,4]; break;
        }

        var powerWeights = _.map(self.ItemPowers, function(p) { return p.weight; });

        i.powers = [];
        var reSkill = /GET_ITEM_SKILL/;
        var reSpell = /GET_SPELL_LEVEL_(.)/; //for spell levels 0-9

        //Another option would be to do this with _.sample but it does not support weights
        _.times((options.numPowers || chance.weighted(_.range(1,6), powerCountWeights)), function() {
            var power = {};
            do {
                power = _.clone(chance.weighted(_.clone(self.ItemPowers), powerWeights));
                if(reSkill.test(power.description)) {
                    power.description = power.description.replace(reSkill, chance.pick(self.ItemSkills).name);
                }
                else if (reSpell.test(power.description)) {
                    var spellLevel = reSpell.exec(power.description)[1];
                    power.spell = self.getSpell(spellLevel, options); //add the spell onto the power for later reference
                    power.description = power.description.replace(reSpell, power.spell.name);
                }
            } while(_.findWhere(i.powers, {'description': power.description}) && !power.repeatable); //power exists in item powers and is not repeatable 
            if(_.findWhere(i.powers, {'description': power.description})) { //if we selected an existing but repeatable power
                //add the new power values to the old power
                var oldPower = _.findWhere(i.powers, {'description': power.description});
                oldPower.costMod += power.costMod;
                oldPower.egoMod  += power.egoMod;
                oldPower.value   += power.value;
            }
            else {
                i.powers.push(power);
            }            
        });
        
        //Set for the next section
        var bonusLanguages = 0; 

        //Finalize powers
        i.powers.forEach(function(p) {
            p.description = p.description.replace(/#/, p.value);
            i.ego += p.egoMod;
            i.cost += p.costMod;

            if(/Linguistics/i.test(p.description)) { //check if we got any ranks in linguistics
                bonusLanguages += p.value;
            }

            //clean up the power
            delete p.value;
            delete p.egoMod;
            delete p.costMod;
            delete p.weight;
            delete p.repeatable;
            //final power should only have description and spell
        });


        //***ITEM BONUS LANGUAGES***
        i.languages = ['Common']; //ALL intelligent items know Common
        //extra languages are based on intelligence and ranks in Linguistics
        bonusLanguages += Math.floor((i.stats.intelligence-10)/2);
        //pick is safe even if we have more bonusLanguages than exist
        i.languages.concat(chance.pick(self.Languages.data, bonusLanguages));


        //***ITEM PURPOSE***
        //there was NO roll chart for determining if an item has a purpose so I made this up
        //I figure 30% of the time sounds good
        i.purpose = '';
        i.dedicatedPowers = [];

        if(chance.d100() <= (options.purposeChance || 30)) {
            var reBane = /GET_BANE/;
            var reHumOrOut = /GET_HUMANOID_OR_OUTSIDER_TYPE/;
            var reDeity = /GET_DEITY/;
            //get purpose
            var purpose = chance.weighted(_.clone(self.ItemPurposes), 
                            _.map(self.ItemPurposes, function(p) { return p.weight; }));
            i.purpose = purpose.description;
            i.ego += purpose.egoMod;

            if(reBane.test(i.purpose)) {
                i.purpose = i.purpose.replace(reBane, self.getBane(options));
            }
            else if(reHumOrOut.test(i.purpose)) {
                i.purpose = i.purpose.replace(reHumOrOut,
                    chance.pick(['Humanoids (' + self.getHumanoid(options) + ')', 
                        'Outsiders (' + self.getOutsider(options) + ')']));
            }
            else if(reDeity.test(i.purpose)) {
                var deity = self.getDeity(options);
                i.purpose = i.purpose.replace(reDeity, deity.name + ' (' + deity.alignment + ')');
            }

            //console.log(i.purpose.description);
            i.dedicatedPowers = [];
            //I decided that purposed items get between 1-3 dedicated powers, heavily leaning on 1
            var numDedicatedPowers = options.numDedicatedPowers || chance.weighted([1,2,3], [7,2,1]);
            _.times(numDedicatedPowers, function() {
                var power = {};
                do {
                    power = _.clone(chance.weighted(self.ItemDedicatedPowers, 
                        _.map(self.ItemDedicatedPowers, function(p) { return p.weight; })));
                    
                    if (reSpell.test(power.description)) { //as in the normal powers
                        var spellLevel = reSpell.exec(power.description)[1];
                        power.spell = self.getSpell(spellLevel, options); //add the spell onto the power for later reference
                        power.description = power.description.replace(reSpell, power.spell.name);
                    }
                //don't allow for duplicate dedicated powers
                } while(_.findWhere(i.dedicatedPowers, {'description': power.description}));
                //finalize dedicated power
                i.cost += power.costMod;
                i.ego  += power.egoMod;
                delete power.costMod;
                delete power.egoMod;
                delete power.weight;
                i.dedicatedPowers.push(power);
            });
        }

        //***PRINT FUNCTION***
        i.print = function() {
            var ret = '';
            ret += 'Alignment: ' + this.alignment + ';';
            ret += 'Stats: Ego ' + this.ego + ', Int ' + this.stats.intelligence + ', ' +
                    'Wis ' + this.stats.wisdom + ', ' +
                    'Cha ' + this.stats.charisma + ';';
            ret += 'Communication: ' + this.communication + ' (' + this.languages.join(',' ) + ');';
            ret += 'Senses: ' + this.senses + ';';
            ret += 'Powers: ' + _.map(this.powers, function(p) { return p.description; }).join(', ') + ';';
            if(this.purpose) {
                ret += 'Purpose: ' + this.purpose + ';';
                ret += 'Dedicated Powers: ' + _.map(this.dedicatedPowers, function(p) {return p.description; }).join(', ') + ';';
            }            
            ret += 'Cost: ' + i.cost + 'gp';

            return ret;

        };

        return i; //object intelligence
    };

};