/*global angular:false, _:false*/
(function(){
  'use strict';

  angular
       .module('grimoire')
       .controller('GrimoireController', [
          'grimoireService', '$mdSidenav', '$mdBottomSheet', '$mdDialog', '$log', '$q',
          GrimoireController
       ])
       .controller('SourcesController', ['$mdDialog', 'source', SourceEditor])
       .controller('ConfigController', ['$mdDialog', 'sources', 'options', RollConfig]);

  /**
   * Main Controller for the Angular Material Starter App
   * @param $scope
   * @param $mdSidenav
   * @param avatarsService
   * @constructor
   */
  function GrimoireController( grimoireService, $mdSidenav, $mdBottomSheet, $mdDialog, $log, $q, $event) {
    var self = this;

    // self.selected     = null;
    // self.users        = [ ];
    // self.selectUser   = selectUser;
    // self.toggleList   = toggleUsersList;
    // self.share        = share;

    self.grimoire = {};

    self.itemLists = [];

    self.options = {
      disableGlowing: false,
      glowingChance: 30,
      disableClue: false,
      clueChance: 20,
      disableRecursiveSpecials: false,
      disableIntelligent: false,
      intelligenceChance: 1,
    };

    self.getSpell = function(type, spellLevel) {
      console.log('type', type, 'level', spellLevel);
    };

    self.doneLoading = false;
    self.selected = null;

    grimoireService.createInstance().then(function(g) {
      self.grimoire = g;
      self.doneLoading = true;
    });

    self.toggleSidebar = function() {
        $mdSidenav('sourceList').toggle();
    };

    self.showGrimoire = function() {
      console.log('grimoire', self.grimoire);
    };

    self.editSource = function(s) {
      self.selected = s;
      var sourceDialog = {
        targetEvent: $event,
        templateUrl: 'partials/sourceTemplate.html',
        controller: 'SourcesController',
        controllerAs: 'sc',
        locals: {source: s}
      };
      $mdDialog
        .show(sourceDialog)
        .finally(function() {
          self.selected = null;
        });
    };

    self.openConfig = function() {
      var config = {
        targetEvent: $event,
        templateUrl: 'partials/rollConfigTemplate.html',
        controller: 'ConfigController',
        controllerAs: 'config',
        locals: {
          sources: self.grimoire.SOURCES,
          options: self.options
        }
      };
      $mdDialog
        .show(config)
        .then(function(action) {
          if(action == 'roll') {
            self.getItems();
          }
        });
    };

    self.getItem = function(quality, itemType) {
      console.log(quality, itemType);
      self.options.types = [itemType];
      var item = self.grimoire.getItems(quality, 1, self.options);
      var itemList = {
        items: [item],
        date: new Date()
      };
      self.itemLists.unshift(itemList);
    };

    self.getItems = function() {
      //get all displayTypes that are 'true'
      self.options.types = _.invert(self.options.displayTypes, /*multiValue*/true).true;
      //console.log('Roll for items using config', self.options);

      var minorItems = [], mediumItems = [], majorItems = [];

      if(self.options.numMinor > 0) {
        minorItems = self.grimoire.getItems('minor', self.options.numMinor, self.options);
      }
      if(self.options.numMedium > 0) {
        mediumItems = self.grimoire.getItems('medium', self.options.numMedium, self.options);
      }
      if(self.options.numMajor > 0) {
        majorItems = self.grimoire.getItems('major', self.options.numMajor, self.options);
      }

      var itemList = {
        items: [].concat(minorItems, mediumItems, majorItems),
        date: new Date()
      };

      console.log('items', itemList.items);

      self.itemLists.unshift(itemList);
    };

  }//end of GrimoireController

  function SourceEditor($mdDialog, source) {
    var self = this;
    self.source = source;

    self.closeDialog = function() {
      $mdDialog.hide();
    };
  }

  function RollConfig($mdDialog, sources, options) {
    var self = this;
    //console.log('sources are', sources, 'and options', options);
    self.sources = sources;
    self.options = options;
    self.options.displayTypes = self.options.displayTypes || {};

    var sourceTypes = {};
    sources.forEach(function(source) {
      _.merge(sourceTypes, 
        _.mapValues(source.data, 'enabled'),
        function(a,b) {
          return a || b;
        }
      );
    });

    self.options.displayTypes = 
      _.merge(self.options.displayTypes, sourceTypes,
        function(option, source) {
          //if source is false, it means that ALL sources of that type were disabled
          return (source === false) ? 'disabled' : option; //otherwise option trumps
        }
      );

    self.showConfig = function() {
      console.log(options.displayTypes);
    };

    self.closeDialog = function(action) {
      $mdDialog.hide(action);
    };
  }

})();
