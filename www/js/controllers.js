angular.module('app.controllers', ['ngCordova', 'ngImgCrop'])
  .controller('loginCtrl', function($scope, $cordovaGeolocation, $cordovaDevice, $ionicHistory, $state, $auth, $q) {
    function successLogged(data) {
      $ionicHistory.nextViewOptions({ disableBack: true });
      $state.go('menu.start');
    };

    function logOrRegisterWithUUID() {
      var uuid, provider;
      try {
        uuid = $cordovaDevice.getUUID();
        console.log(uuid);
        provider = $cordovaDevice.getPlatform();
        console.log(provider);
      } catch(ex) {
        if (!window.cordova) {
          uuid = "IN-APP12341";
          provider = "IN-APP";
        }
      }

      loginWithUUID(uuid, provider).then(successLogged,
        function(loginResp) {
          console.log(loginResp);
          registerWithUUID(uuid, provider).then(successLogged, function(resp) {
            // handle error response
            console.log(resp);
          })
        })
    }

    function loginWithUUID(uuid, provider) {
      var loginData = { email: uuid + '@local.com', password:uuid };

      var deferred = $q.defer();
      $auth.submitLogin(loginData)
        .then(function(data) {
          deferred.resolve(data);
        }, function(resp) {
          console.log(resp);
          deferred.reject(resp);
          // handle error response
        });
      return deferred.promise;
    };

    function registerWithUUID(uuid, provider) {
      var registrationData = { provider:provider, uid:uuid, type: 'KindHeartedUser',
        email: uuid + '@local.com',
        password:uuid, password_confirmation:uuid };

      return $auth.submitRegistration(registrationData);
    };

    function validate() {
      $auth.validateUser().then(successLogged, function(result) {
        setTimeout(logOrRegisterWithUUID, 100);
        return result;
      });
    }

    var isMob = window.cordova !== undefined;
    if (isMob)
      document.addEventListener("deviceready", validate, false);
    else
      validate();
  })

  .controller('logoutCtrl', function($scope, $cordovaGeolocation, $ionicHistory, $state, $auth) {
    $auth.signOut()
      .then(function(resp) {
        // handle success response
      })
      .catch(function(resp) {
        // handle error response
      });
  })

  .controller('startCtrl', function($scope, $cordovaGeolocation, $ionicHistory, $state, $auth, $q, Apparel) {
    function successUpdatedGeo() {
      Apparel.owned().then(function(data) {
        if (data && data != null && data.length > 0) {
          $ionicHistory.nextViewOptions({ disableBack: true });
          $state.go('menu.apparel');
        } else {
          $ionicHistory.nextViewOptions({ disableBack: true });
          $state.go('menu.new');
        }
      }, function() {
        $ionicHistory.nextViewOptions({ disableBack: true });
        $state.go('menu.new');
      });
    };

    updateLatLng($cordovaGeolocation, $auth, $q)
      .then(function(resp) {
        successUpdatedGeo();
      }, function(resp) {
        successUpdatedGeo();
      });
  })

  .controller('apparelCtrl', function($scope, $rootScope, $cordovaGeolocation, $ionicHistory, $state, $auth, $q, $ionicSlideBoxDelegate, Apparel, ApparelRating, Chat, $ionicLoading, $log) {
    $scope.show = function(message) {
      $ionicLoading.show({ template: message });
    };
    $scope.hide = function(){
      $ionicLoading.hide();
    };

    function setCurrentApparel() {
      if ($rootScope.apparels.length > 0) {
        var entry = $rootScope.apparels[0];
        $rootScope.apparels.shift();

        // sets dummy data
        entry.user = {
          id: entry.user_id,
          nickname: 'giovana camargo',
          distance: '3km',
          social_image:null,
          image: null
        }
        $scope.entry = entry;
        $ionicSlideBoxDelegate.update();
      } else {
        $scope.entry = null;
      }
    }

    function loadMore() {
      Apparel.search().then(function(data) {
          $rootScope.apparels = data;
          setCurrentApparel();
          $scope.hide();
        }, function(data) {
          $scope.hide();
        });
    }

    function checkNextApparel(onHasData, onLoadRequired) {
      $scope.show('Carregando roupas ...');
      if ($rootScope.apparels && $rootScope.apparels.length > 0) {
        onHasData();
        $scope.hide();
      } else {
        onLoadRequired();
      }
    }

    function nextAfterRating() {
      $ionicHistory.nextViewOptions({ disableBack: true });
      // $state.go($state.current, {}, {reload: true});
      $state.transitionTo($state.current, { last_id: $scope.entry.id }, {
        reload: true,
        inherit: false,
        notify: true
      });
    };

    function failAfterRating(error) {
      $log.debug(error);
    };

    $scope.like = function() {
      var rating = new ApparelRating({apparel_id: $scope.entry.id, liked: true})
      rating.save().then(function(data) {
        $scope.show('Opa, será que deu match?');
        Chat.active_by_user($scope.entry.user_id).then(function(chatData) { 
          $scope.hide();
          if (chatData) {
            alert('MATCH!');
          } else {  
            nextAfterRating();
          }
        }, failAfterRating);
      });
    };

    $scope.dislike = function() {
      var rating = new ApparelRating({apparel_id: $scope.entry.id, liked: false})
      rating.save().then(nextAfterRating, failAfterRating);
    }

    checkNextApparel(setCurrentApparel, loadMore);
    
    updateLatLng($cordovaGeolocation, $auth, $q)
      .then(function(resp) {
        // $scope.getApparels().then(function(data){
        //   // TODO
        //   $scope.hide();
        // });
      }, function(resp) {
        // $scope.hide();
      });
    // $scope.show();

  });