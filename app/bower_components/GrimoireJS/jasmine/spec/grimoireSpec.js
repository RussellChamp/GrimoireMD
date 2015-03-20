/*global Grimoire:true, _:true, jasmine:true, describe:true, beforeEach:true, it:true, expect:true*/
'use strict';

describe('Sources', function() {
    var grimoire = new Grimoire();
    it('should load sources', function() {
        expect(grimoire.SOURCES).toBeTruthy();
    });
    grimoire.SOURCES.forEach(function(source) {
        describe(source.name + ' (' + source.shortName + ')', function() {
            it('should list types', function() {
                expect(source.types).toBeTruthy();
                expect(source.types.length).toBeGreaterThan(0);
            });
            source.types.forEach(function(type) {
                describe(type.name, function() {
                    it('should have a name', function() {
                        expect(type.name).toBeTruthy();
                    });
                    it('should initialize itself', function() {
                        expect(source.data[type.name]).toBeTruthy();
                    });
                    if(type.source) {
                        it('should load data', function() {
                            expect(source.data[type.name].data).toBeTruthy();
                        });
                        //CHECK SPECIFIC DATA NOW
                        if(type.name == 'Armor and Shields' || type.name == 'Weapons') {
                            //could contain uniques or specials
                            for(var key in source.data[type.name].data) {
                                var itemList = source.data[type.name].data[key];
                                describe(key, function() {
                                    it('should have names', function() {
                                        for(var i in itemList) {
                                            expect(itemList[i].name).toBeTruthy();
                                        }
                                    });
                                    it('should have cost or bonus', function() {
                                        for(var i in itemList) {
                                            var costPlusBonus = (itemList[i].cost || 0) + (itemList[i].bonus || 0);
                                            expect(costPlusBonus).toBeGreaterThan(0);
                                        }
                                    });
                                    it('should have weights', function() {
                                        for(var i in itemList) {
                                            var weightSum = _.sum(_.values(itemList[i].weight));
                                            expect(weightSum).toBeGreaterThan(0);
                                        }
                                    });
                                });
                            };
                        }
                        //These follow the same data format
                        else if(type.name == 'Rings' || type.name == 'Rods' || type.name == 'Staves') {
                            var itemList = source.data[type.name].data;
                            it('should have names', function() {
                                for(var i in itemList) {
                                    expect(itemList[i].name).toBeTruthy();
                                }
                            });
                            it('should have costs', function() {
                                for(var i in itemList) {
                                    expect(itemList[i].cost).toBeGreaterThan(0);
                                }
                            });
                            //CURRENTLY MISSING WEIGHTS ON APG ITEMS
                            it('should have weights', function() {
                                for(var i in itemList) {
                                    var weightSum = _.sum(_.values(itemList[i].weight));
                                    expect(weightSum).toBeGreaterThan(0);
                                }
                            });
                        }
                        else if(type.name == 'Potions') {
                            var potionList = source.data.Potions.data;
                            it('should have potion levels 0-3', function() {
                                expect(potionList.length).toEqual(4);
                            })
                        }
                        else if(type.name == 'Scrolls') {
                            ; //nothing really to test
                        }
                        else if(type.name == 'Wands') {
                            ; //nothing really to test
                        }
                        else if(type.name == 'Spells') {
                            for(var key in source.data.Spells.data) {
                                describe(key, function() {
                                    var spellList = source.data.Spells.data[key];
                                    it('should have spell levels 0-9', function() {
                                        expect(spellList.length).toEqual(10);
                                    });
                                    //There MUST be 10 arrays within the spell type array
                                    //These do not have to contain data
                                });
                            }
                        }
                        //Do not have weights
                        else if(type.name == 'Wondrous Items') {
                            var items = source.data['Wondrous Items'].data;
                            ['minor', 'medium', 'major'].forEach(function(quality) {
                                describe(quality, function() {
                                    it('should exist', function() {
                                        expect(items[quality]).toBeTruthy();
                                    });
                                    it('should have names', function() {
                                        for(var i in items[quality]) {
                                            expect(items[quality][i].name).toBeTruthy();
                                        }
                                    });
                                    it('should have costs', function() {
                                        for(var i in items[quality]) {
                                            expect(items[quality][i].cost).toBeGreaterThan(0);
                                        }
                                    });
                                });
                            });
                        }
                    }
                }); //end describe type
            }); //end forEach type 
        }); //end source name
    }); //end forEach source
}); //end sources

describe('Grimoire', function() {
    var grimoire = new Grimoire();

    beforeEach(function() {
        //grimoire = new Grimoire(); //load fresh?
    });

    it('should exist', function() {
        expect(grimoire).toBeTruthy();
    });
    it('should contain sources', function() {
        expect(grimoire.SOURCES.length).toBeGreaterThan(0);
    });

    describe('getBane', function() {
        it('should get a Bane', function() {
            //remove the humanoid or outsider type when getting the banes to avoid mismatching
            var allBanes = _.map(grimoire.Banes, function(b) { return b.name.replace(/\s\(.*\)/, ''); });
            var bane = grimoire.getBane().replace(/\s\(.*\)/, '');
            expect(allBanes).toContain(bane);
        });
    });
    describe('getHumanoid', function() {
        it('should get a Humanoid', function() {
            var allHumanoids = _.map(grimoire.Humanoids, function(h) { return h.name; });
            var humanoid = grimoire.getHumanoid();
            expect(allHumanoids).toContain(humanoid);
        });
    });
    describe('getOutsider', function() {
        it('should get a Outsider', function() {
            var allOutsiders = _.map(grimoire.Outsiders, function(o) { return o.name; });
            var outsider = grimoire.getOutsider();
            expect(allOutsiders).toContain(outsider);
        });
    });
    describe('getEnergyType', function() {
        it('should get an EnergyType', function() {
            var allEnergyTypes = _.values(ENERGY_TYPES);
            var energyType = grimoire.getEnergyType();
            expect(allEnergyTypes).toContain(energyType);
        });
    });

    describe('getSpell', function() {
        it('should get a spell', function() {
            var spell = grimoire.getSpell(1);
            expect(spell.name).toBeDefined();
        });
        it('should get spells of the correct level', function() {
            var spell = grimoire.getSpell(3);
            expect(spell.level).toEqual(3);
            spell = grimoire.getSpell(7);
            expect(spell.level).toEqual(7);
        });
        it('should respect the spellType option', function() {
            var spell = grimoire.getSpell(2, {type: 'Divine'});
            expect(spell.type).toBe('Divine');
            spell = grimoire.getSpell(2, {type: 'Arcane'});
            expect(spell.type).toBe('Arcane');
        });
    });

    describe('getSpells', function() {
        it('should get spells', function() {
            var spells = grimoire.getSpells(1, 3);
            expect(spells.length).toBe(3);
        });
    });

    describe('getScroll', function() {
        it('should get a Scroll', function() {
            var spell = grimoire.getScroll('minor');
            expect(spell.itemType).toBe('Scrolls');
        });
        it('should override with spellLevel option', function() {
            var spell = grimoire.getScroll('minor', {scrollLevel: 5});
            expect(spell.description).toMatch(/spell level 5/);
        });
    });

    describe('getPotion', function() {
        it('should get a Potion', function() {
            var potion = grimoire.getPotion('medium');
            expect(potion.itemType).toBe('Potions');
        });
    });

    describe('getWand', function() {
        it('should get a Wand', function() {
            var wand = grimoire.getWand('medium');
            expect(wand.itemType).toBe('Wands');
        });
    });

    describe('getRing', function() {
        it('should get a Ring', function() {
            var ring = grimoire.getRing('medium');
            expect(ring.itemType).toBe('Rings');
        });
    });

    describe('getRod', function() {
        it('should get a Rod', function() {
            var rod = grimoire.getRod('medium');
            expect(rod.itemType).toBe('Rods');
        });
    });

    describe('getStaff', function() {
        it('should get a Staff', function() {
            var staff = grimoire.getStaff('medium');
            expect(staff.itemType).toBe('Staves');
        });
        it('should not return a minor Staff', function() {
            var staff = grimoire.getStaff('minor');
            expect(staff).toBeUndefined();
        });
    });

    describe('getSpecials', function() {
        describe('melee', function() {
            var specials = grimoire.getSpecials('medium', 'melee');
            it('should get melee specials', function() {
                expect(specials.length).toBeGreaterThan(0);
            });
            it('should not exceed a bonus of 10', function() {
                var totalBonus = _.sum(_.map(specials, function(s) { return s.bonus; }));
                expect(totalBonus).toBeLessThan(11);
            });
        });
        describe('ranged', function() {
            var specials = grimoire.getSpecials('medium', 'ranged');
            it('should get melee specials', function() {
                expect(specials.length).toBeGreaterThan(0);
            });
            it('should not exceed a bonus of 10', function() {
                var totalBonus = _.sum(_.map(specials, function(s) { return s.bonus; }));
                expect(totalBonus).toBeLessThan(11);
            });
        });
        describe('armor', function() {
            var specials = grimoire.getSpecials('medium', 'armor');
            it('should get armor specials', function() {
                expect(specials.length).toBeGreaterThan(0);
            });
            it('should not exceed a bonus of 10', function() {
                var totalBonus = _.sum(_.map(specials, function(s) { return s.bonus; }));
                expect(totalBonus).toBeLessThan(11);
            });
        });
        describe('shield', function() {
            var specials = grimoire.getSpecials('medium', 'shield');
            it('should get shield specials', function() {
                expect(specials.length).toBeGreaterThan(0);
            });
            it('should not exceed a bonus of 10', function() {
                var totalBonus = _.sum(_.map(specials, function(s) { return s.bonus; }));
                expect(totalBonus).toBeLessThan(11);
            });
        });
    });
    
    describe('getUniqueWeapon', function() {
        it('should get a unique weapon', function() {
            var weapon = grimoire.getUniqueWeapon('medium');
            expect(weapon.itemType).toBe('Weapons');
        });
    });

    describe('getWeapon', function() {
        it('should get a weapon', function() {
            var weapon = grimoire.getWeapon('medium');
            expect(weapon.itemType).toBe('Weapons');
        });
    });

    describe('getArmorOrSheild', function() {
        it('should get an armor or shield', function() {
            var item = grimoire.getArmorOrShield('medium');
            expect(item.itemType).toBe('Armor and Shields');
        });
    });

    describe('getAlignment', function() {
        it('should get an Alignment', function() {
            var alignment = grimoire.getAlignment();
            expect(alignment).toBeTruthy();
        });
        it('should respect weighting options', function() {
            var alignment = grimoire.getAlignment({clWeights:[1,0,0], geWeights:[1,0,0]});
            expect(alignment).toEqual('Chaotic Good');
            alignment = grimoire.getAlignment({clWeights:[0,0,1], geWeights:[0,0,1]});
            expect(alignment).toEqual('Lawful Evil');
        });
        it('should know True Neutral', function() {
            var alignment = grimoire.getAlignment({clWeights:[0,1,0], geWeights:[0,1,0]});
            expect(alignment).toEqual('True Neutral');
        });
    });

    describe('getDeity', function() {
        it('should get a Deity', function() {
            var deity = grimoire.getDeity();
            expect(deity.name).toBeTruthy();
        });
        it('should respect alignment options', function() {
            var deity = grimoire.getDeity({cl:'Chaotic', ge:'Evil'});
            expect(deity.alignment).toEqual('Chaotic Evil');
            deity = grimoire.getDeity({cl:'Lawful', ge:'Good'});
            expect(deity.alignment).toEqual('Lawful Good');
        });
    });

    describe('getIntelligence', function() {
        var intelligence = grimoire.getIntelligence(5000, {purposeChance: 100});
        it('should have a cost', function() {
            expect(intelligence.cost).toBeTruthy();
        });
        it('should have an ego', function() {
            expect(intelligence.ego).toBeTruthy();
        });
        it('should have an alignment', function() {
            expect(intelligence.alignment).toBeTruthy();
        });
        it('should have stats', function() {
            expect(intelligence.stats.charisma).toBeGreaterThan(9);
            expect(intelligence.stats.intelligence).toBeGreaterThan(9);
            expect(intelligence.stats.wisdom).toBeGreaterThan(9);
        });
        it('should have languages', function() {
            expect(intelligence.languages.length).toBeGreaterThan(0);
        });
        it('should have senses', function() {
            expect(intelligence.senses).toBeTruthy();
        });
        it('should have powers', function() {
            expect(intelligence.powers).toBeTruthy();
            expect(intelligence.powers.length).toBeLessThan(4); //for a 5000gp item
        });
        it('should have a purpose', function() {
            expect(intelligence.purpose).toBeTruthy();
        });
        it('should have dedicated powers', function() {
            expect(intelligence.dedicatedPowers).toBeTruthy();
        });
        it('should have have a print function', function() {
            expect(intelligence.print).toBeTruthy();
            expect(intelligence.print()).toBeTruthy();
        });

    });

    describe('getItem', function() {
        it('should get a minor item', function() {
            var item = grimoire.getItem('minor');
            expect(item.name).toBeDefined();
        });
        it('should get a medium item', function() {
            var item = grimoire.getItem('medium');
            expect(item.name).toBeDefined();
        });
        it('should get a major item', function() {
            var item = grimoire.getItem('major');
            expect(item.name).toBeDefined();
        });

        it('should get a Scroll', function() {
            var item = grimoire.getItem('medium', {types: ['Scrolls']});
            expect(item.itemType).toBe('Scrolls');
        });
        it('should get a Potion', function() {
            var item = grimoire.getItem('medium', {types: ['Potions']});
            expect(item.itemType).toBe('Potions');
        });
        it('should get a Wand', function() {
            var item = grimoire.getItem('medium', {types: ['Wands']});
            expect(item.itemType).toBe('Wands');
        });
        it('should get a Wondrous Item', function() {
            var item = grimoire.getItem('medium', {types: ['Wondrous Items']});
            expect(item.itemType).toBe('Wondrous Items');
        });
        it('should get a Weapon', function() {
            var item = grimoire.getItem('medium', {types: ['Weapons']});
            expect(item.itemType).toBe('Weapons');
        });
        it('should get a Armor or Shield', function() {
            var item = grimoire.getItem('medium', {types: ['Armor and Shields']});
            expect(item.itemType).toBe('Armor and Shields');
        });
        it('should get a Ring', function() {
            var item = grimoire.getItem('medium', {types: ['Rings']});
            expect(item.itemType).toBe('Rings');
        });
        it('should get a Rods', function() {
            var item = grimoire.getItem('medium', {types: ['Rods']});
            expect(item.itemType).toBe('Rods');
        });
        it('should get a Staff', function() {
            var item = grimoire.getItem('medium', {types: ['Staves']});
            expect(item.itemType).toBe('Staves');
        });
    });

    describe('getItems', function() {
        it('should get minor items', function() {
            var items = grimoire.getItems('minor', 3);
            expect(items.length).toEqual(3);
        });
        it('should get medium items', function() {
            var items = grimoire.getItems('medium', 3);
            expect(items.length).toEqual(3);
        });
        it('should get major items', function() {
            var items = grimoire.getItems('major', 3);
            expect(items.length).toEqual(3);
        });
        it('should respect the source option', function() {
            var source = _.find(grimoire.SOURCES, {shortName: 'CRB'});
            var item = grimoire.getItems('minor', 1, {sources: [source]})[0];
            expect(item.source).toBe(source.shortName);
        });
        it('should respect the types option', function() {
            var item = grimoire.getItems('minor', 1, {types: ['Rings']})[0];
            expect(item.itemType).toBe('Rings');
        });
    });

});