var Player = require('./Player.js');
const Search = require('./Search.js');

module.exports = function(){

    var app = angular.module("dps", []);

    app
    .controller('ctrl', ['$scope', '$http', '$timeout', function($scope, $http, $timeout){
      $scope.searchList = []
      $scope.player = new Player();
      $scope.monster = {}
      $scope.monsterList = []
      $scope.tabSelected = 0
      $scope.selectItem = function(itemName, search){
        var item
        search.dataObj.resList.forEach((i) => {
          console.log(i, itemName)
          if(i.name === itemName){
            item = i
          }
        })
        $scope.player.equip(item)
      }
      
      $scope.selectMonster = function(monsterName, search){
        $http({
          method: 'GET',
          url: '/api/getMonstersByName',
          params: {name:monsterName}
        }).then((res)=>{
          console.log(res)
          $scope.monsterList = res.data;
          $scope.monster = res.data[0]
        })
      }

      $scope.itemSearch = new Search(
        '/api/searchItems', 
        {elem: 'item-search', selectFn: $scope.selectItem}, 
        (res, search) => {
          search.clear()
          JSON.parse(res).forEach((i) => {
            search.dataObj.showList.push(i.name)
            search.dataObj.resList.push(i)
          })
          $scope.$apply()
        }
      );

      $scope.monsterSearch = new Search(
        '/api/searchMonsterNames',
        {elem:'monster-search', selectFn: $scope.selectMonster},
        (res, search) => {
          search.clear()
          JSON.parse(res).forEach((i) => {
            search.dataObj.showList.push(i)
            search.dataObj.resList.push(i)
          })
          $scope.$apply()
        }
      );



      document.addEventListener('keydown', (e) => {
        if(e.code === "ArrowDown" || e.code === "ArrowUp"){
          $scope.$apply()
        }
      })
    }])

    .directive('loadoutCell', function(){
      return {
        scope: {
          slotname: '@',
          player: '='
        },
          templateUrl: 'html/loadout-cell.html'
      }
    })
    .directive('bonusRow', function(){
      return {
        scope: {
          bonusName: '@',
          value: '@',
          percent: '@'
        },
        template: "<td>{{bonusName}}:<\/td><td ng-class=\"{'color-3':value > 0, 'color-2': value < 0, 'color-grey': value == 0}\"><span ng-hide=\"!(value >= 0)\">+<\/span>{{value}}<span ng-class={'hidden':percent==null}>%<\/span><\/td>"
      }
    })
    .directive('searchBox', function(){
      return {
        scope: {
          search: '=',
          select: '=',
          placeholder: '@',
          id: "@",
        },
        templateUrl: 'html/search-box.html'
      }
    })
    .directive('loadout', function(){
      return {
        scope: {
          player: '=',
          search: '='
        },
        templateUrl: '/html/directives/loadout.html'
      }
    })
  }