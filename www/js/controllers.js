angular.module('app.controllers', ['ngCordova', 'ngImgCrop', 'btford.socket-io', 'app.factories'])
  .controller('initialCtrl', function($scope, $rootScope, $cordovaGeolocation, $cordovaDevice, $ionicHistory, $state, $auth, $q, UserCheck) {
    $scope.loadingMessage = t('initial.loading');
    console.log($scope.loadingMessage);

    function validate() {
      $auth.validateUser()
        .then(function(data) {
          UserCheck.redirectLoggedUser();
        }, function(result) {
          $ionicHistory.nextViewOptions({ disableBack: true });
          $state.go('login');

          return result;
        });
    }

    var isMob = window.cordova !== undefined;
    if (isMob)
      document.addEventListener("deviceready", validate, false);
    else
      validate();
  })

  .controller('menuCtrl', function($scope, $cordovaGeolocation, $cordovaDevice, $ionicHistory, $state, $auth, $q) {
    $scope.goApparels = function() {
      $ionicHistory.nextViewOptions({ disableBack: true });
      $state.go('menu.apparel_list');
    };

    $scope.goAbout = function() {
      $ionicHistory.nextViewOptions({ disableBack: true });
      $state.go('menu.about');
    };

    $scope.goSearch = function() {
      $ionicHistory.nextViewOptions({ disableBack: true });
      $state.go('menu.search');
    };

    $scope.goNew = function() {
      $ionicHistory.nextViewOptions({ disableBack: true });
      $state.go('menu.new');
    };
  })

  .controller('loginCtrl', function($scope, $rootScope, $cordovaGeolocation, $cordovaDevice, $ionicHistory, $state, $auth, $q, UserCheck) {
    function successLogged(data) {
      UserCheck.redirectLoggedUser();
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
          uuid = "in-app12341";
          provider = "email";
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

    $scope.loginAuto = function() {
      logOrRegisterWithUUID();
    };

    $scope.loginWithFacebook = function() {
      $auth.authenticate('facebook')
        .then(successLogged)
        .catch(function(resp) {
          console.log(resp);
          //logOrRegisterWithUUID();
        });
    };

    function validate() {
      $auth.validateUser().then(successLogged, function(result) {
        // deixa a pessoa fazer seu próprio login
        // setTimeout(logOrRegisterWithUUID, 100);

        return result;
      });
    }

    var isMob = window.cordova !== undefined;
    if (isMob)
      document.addEventListener("deviceready", validate, false);
    else
      validate();
  })

  .controller('logoutCtrl', function($scope, $cordovaGeolocation, $ionicHistory, $state, $auth, UserCheck) {
    $auth.signOut()
      .then(function(resp) {
        $state.go('login');
      })
      .catch(function(resp) {
        UserCheck.redirectLoggedUser();
      });
  })

  .controller('matchWarningCtrl', function($scope, $rootScope, $cordovaGeolocation, $ionicHistory, $state, $stateParams, $auth, $q, Apparel, Chat) {
    $scope.single_option = false;
    Chat.local_active_by_id($stateParams["chat_id"]).then(function(chat) {
      $scope.chat = chat;
      if (!$scope.chat) {
        Chat.online_active_by_id($stateParams["chat_id"]).then(function(chat) {
          $scope.chat = chat;
        }, function(error) {
          console.log(error);
        });
      }
    });

    function successUpdatedGeo() {

    };

    $scope.cancel = function() {
      $ionicHistory.nextViewOptions({ disableBack: true });
      $state.go('menu.apparel');
    };

    $scope.submit = function() {
      $ionicHistory.nextViewOptions({ disableBack: true });
      $state.go('menu.chat', { id: $scope.chat.id });
    };

    updateLatLng($cordovaGeolocation, $auth, $q)
      .then(function(resp) {
        successUpdatedGeo();
      }, function(resp) {
        successUpdatedGeo();
      });
  })

  .controller('matchNotFoundCtrl', function($scope, $rootScope, $cordovaGeolocation, $ionicHistory, $state, $stateParams, $auth, $q, $cordovaSocialSharing, Apparel) {
    $scope.action1 = function() {
      $rootScope.goMain();
    }

    $scope.action2 = function() {
      $ionicHistory.nextViewOptions({ disableBack: true });
      $state.go('menu.new');
    };

    updateLatLng($cordovaGeolocation, $auth, $q);
  })

  .controller('apparelsNotFoundCtrl', function($scope, $rootScope, $cordovaGeolocation, $ionicHistory, $state, $stateParams, $auth, $q, $cordovaSocialSharing, Apparel) {
    $scope.hasAction = Apparel.hasFilters();

    $scope.shareApp = function() {
      $cordovaSocialSharing.share(t('match_not_found.share.title'), t('global.app.name'), null, 'http://www.roupalivre.com.br/') // Share via native share sheet
        .then(function(result) {
          // Success!
        }, function(err) {
          // An error occured. Show a message to the user
        });
    }

    $scope.advance = function() {
      $ionicHistory.nextViewOptions({ disableBack: true });
      $state.go('menu.search');
    };

    updateLatLng($cordovaGeolocation, $auth, $q);
  })

  .controller('apparelListCtrl', function($scope, $rootScope, $cordovaGeolocation, $cordovaDevice, $ionicHistory, $state, $auth, $q, $stateParams, $ionicPopup, Apparel) {
    var user_id = $stateParams.hasOwnProperty("user_id") && $stateParams.user_id > 0 ? $stateParams.user_id : null;
    $scope.is_mine = user_id == null;
    if ($scope.is_mine) 
      $scope.owner_user = $rootScope.user;

    function refreshApparels() {
      if ($scope.is_mine) {
        Apparel.owned().then(function(apparels) {
          $scope.apparels = apparels;
        });
      } else {
        // TODO Carrega apparels de outro user
      }
    }
    refreshApparels();

    $scope.edit = function(apparel) {
      if ($scope.is_mine) {
        $ionicHistory.nextViewOptions({ disableBack: false });
        $state.go('menu.edit_apparel', { id: apparel.id });
      }
    }

    $scope.delete = function(apparel) {
      if ($scope.is_mine) {
        var confirmPopup = $ionicPopup.confirm({
          title: t('apparels.delete.title'),
          template: t('apparels.delete.body')
        });

        confirmPopup.then(function(res) {
          if(res) {
            console.log('You are sure');
            apparel.delete().then(function() {
              Apparel.clear_owned_cache();
              refreshApparels();
            });
          } else {
            console.log('You are not sure');
          }
        });
      }
    }
  })

  .controller('chatsCtrl', function($scope, $rootScope, $cordovaGeolocation, $ionicHistory, $state, $auth, $q, Chat, $ionicPopup) {

    $scope.onForceRefresh = function() {
      $rootScope.showConfirmPopup(t('chats.messages.reload.title'), null, t('chats.messages.reload.body')).then(function(res) {
        if(res) {
          $rootScope.showReadableLoading();
          Chat.clearCache().then(function() {
            Chat.force_reload_active().then(function(data) {
              $scope.chats = data;
              $scope.$broadcast('scroll.refreshComplete');
              $rootScope.hideReadableLoading();
            }, function() {
              $scope.$broadcast('scroll.refreshComplete');
              $rootScope.hideReadableLoading();
            });
          }, function() {
            $scope.$broadcast('scroll.refreshComplete');
            $rootScope.hideReadableLoading();
          });
        } else
          $scope.$broadcast('scroll.refreshComplete');
      });
    };

    Chat.active().then(function(old_data) {
      $scope.chats = old_data;
      if (!$scope.chats || $scope.chats.length == 0) {
        $rootScope.showReadableLoading();
      }
      Chat.force_reload_active().then(function(data) {
        $scope.chats = data;
        $rootScope.hideReadableLoading();
        if (!data || data.length == 0) {
          $ionicHistory.nextViewOptions({ disableBack: true });
          $state.go('menu.not_found');
        }
      });
    }, function(data) {
      console.log(data);
      $ionicHistory.nextViewOptions({ disableBack: true });
      $state.go('menu.not_found');
    });

    $scope.open = function(chat) {
      $state.go('menu.chat', { id: chat.id });
    };
  })

  .controller('chatDetailsCtrl', function($scope, $rootScope, $cordovaGeolocation, $ionicHistory, $state, $auth, $q, $stateParams, $ionicScrollDelegate, Chat, ChatMessage, ChatSub) {
    Chat.local_active_by_id($stateParams["id"]).then(function(chat) {
      $scope.chat = chat;
      Chat.online_active_by_id($stateParams["id"]).then(function(newChatInfo) {
        if (newChatInfo)
          $scope.chat = newChatInfo;
      });
    });

    $scope.close = function() {
      $ionicHistory.goBack();
    };
  })
  
  .controller('filterCtrl', function($scope, $rootScope, $cordovaGeolocation, $cordovaDevice, $ionicHistory, $state, $auth, $q, Apparel, ApparelMatcher) {
    $scope.filters = angular.extend({}, Apparel.getFilters());

    $scope.filter = function() {
      $rootScope.apparels = [];
      if ($scope.filters.tags && $scope.filters.tags.length > 0) {
        var tags = $scope.filters.tags[0].name;
        if ($scope.filters.tags.length > 1) {
          for (var i = 1; i < $scope.filters.tags.length; i++) {
            tags = tags + ',' + $scope.filters.tags[i].name;
          }
        }
        
        $scope.filters.apparel_tags = tags;
      } else if ($scope.filters.hasOwnProperty('apparel_tags')) {
        delete $scope.filters['apparel_tags'];
      }

      Apparel.applyFilters($scope.filters);
      ApparelMatcher.clearCache();
      $ionicHistory.nextViewOptions({ disableBack: true });
      $state.go('menu.apparel');
    };

    $scope.cancel = function() {
      Apparel.clearFilters();
      $scope.filters = angular.extend({}, Apparel.getFilters());
    };
  })

  .controller('aboutCtrl', function($scope, $cordovaGeolocation, $cordovaDevice, $ionicHistory, $state, $auth, $q) {
    var isMob = window.cordova !== undefined;
    $scope.appVersion = '-';
    if (isMob) {
      cordova.getAppVersion.getVersionNumber().then(function (version) {
        $scope.appVersion = version;
      });
    } else {
      $scope.appVersion = 'web version';
    }
  })


  .controller('blankCtrl', function($scope, $cordovaGeolocation, $cordovaDevice, $ionicHistory, $state, $auth, $q) {
    
  })