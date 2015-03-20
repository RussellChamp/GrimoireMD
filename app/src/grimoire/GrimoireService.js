/*global Grimoire:false*/
(function(){
  'use strict';

  angular.module('grimoire')
         .service('grimoireService', ['$q', GrimoireService]);

  /**
   * Users DataService
   * Uses embedded, hard-coded data model; acts asynchronously to simulate
   * remote data service call(s).
   *
   * @returns {{loadAll: Function}}
   * @constructor
   */
  function GrimoireService($q){

    // Promise-based API
    return {
      createInstance : function(options) {
        // Simulate async nature of real remote calls
        return $q.when(new Grimoire(options));
      }
    };
  }

})();
