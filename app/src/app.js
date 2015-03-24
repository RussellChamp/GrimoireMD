angular
  .module('grimoireApp', ['ngMaterial', 'users', 'grimoire'])
  .config(function($mdThemingProvider, $mdIconProvider){

      $mdIconProvider
          .icon("menu"       , "./assets/svg/menu.svg"        , 24)
          .icon("help"       , "./assets/svg/help.svg"        , 24)
          .icon("launch"     , "./assets/svg/launch.svg"      , 24);

          $mdThemingProvider.theme('default')
              .primaryPalette('blue')
              .accentPalette('orange');

  });