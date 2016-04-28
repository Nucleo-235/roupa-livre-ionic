angular.module('app.controllers')
  .controller('newApparelCtrl', function($scope, $rootScope, $cordovaGeolocation, $cordovaActionSheet, $ionicHistory, $ionicModal, $ionicPopup, $ionicLoading, $ionicSlideBoxDelegate, $timeout, $state, $auth, $q, Apparel, ApparelRating, Upload, CurrentCamera, FileManager) {
    var currentController = this;

    $scope.show = function() {
      $ionicLoading.show({
        template: 'Carregando roupas ...'
      });
    };
    $scope.hide = function(){
      $ionicLoading.hide();
    };

    $scope.getNewPhoto = function() {
      var deferred = $q.defer();

      var options = {
        title: 'Onde estão suas fotos?',
        buttonLabels: ['Nova Foto', 'Foto da Galeria'],
        addCancelButtonWithLabel: 'Cancelar',
        androidEnableCancelButton : true,
        winphoneEnableCancelButton : true
        // , addDestructiveButtonWithLabel : 'Delete it'
      };

      $cordovaActionSheet.show(options)
        .then(function(btnIndex) {
          console.log(btnIndex);
          var getPicture = false;
          if (btnIndex == 1)
            getPicture = CurrentCamera.getPictureFromCamera;
          else if (btnIndex == 2)
            getPicture = CurrentCamera.getPictureFromLibrary;

          if (getPicture)
            getPicture().then(
              function(res) {
                deferred.resolve(res);
              }, function(err) {
                deferred.reject(err);
              });
          else {
            deferred.reject('Cancelled');
          }
        }, function(err) {
          deferred.reject(err);
        });

      return deferred.promise;
    };

    $scope.editImage = function(url) {
      currentController.cropImage(url, 1);
    };

    $scope.newImage = function() {
      $scope.getNewPhoto()
        .then(function(result) {
          return currentController.cropImage(result, 1);
        })
        .then(function(result) {
          $scope.entry.apparel_images.push({file: result});
          console.log(result);
          $ionicSlideBoxDelegate.update();
        }, function(error) {
          console.log(error);
        });
    };

    // Upload.fileTo($auth.apiUrl() + '/apparels').then(
    //   function(res) {
    //     // Success
    //   }, function(err) {
    //     // Error
    //   });

    function setCurrentApparel() {
      $scope.entry = new Apparel({apparel_images: []});
      
      $ionicSlideBoxDelegate.update();
    }

    setCurrentApparel();
    
    updateLatLng($cordovaGeolocation, $auth, $q)
      .then(function(resp) { }, function(resp) { });

    addCroppingModal(currentController, $scope, $ionicModal, $q, $timeout);
  });