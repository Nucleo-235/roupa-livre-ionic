angular.module('app.controllers', ['ngCordova', 'ngImgCrop', 'btford.socket-io', 'app.factories'])
  .controller('initialCtrl', function($scope, $rootScope, $cordovaGeolocation, $cordovaDevice, $ionicHistory, $state, $auth, $q, UserCheck, $timeout) {
    $scope.loadingMessage = t('initial.loading');
    console.log($scope.loadingMessage);

    function validate() {
      $auth.validateUser()
        .then(function(data) {
          $timeout(function() {
            UserCheck.redirectLoggedUser();
          });
        }, function(result) {
          $timeout(function() {
            $ionicHistory.nextViewOptions({ disableBack: true });
            $state.go('login');
          });

          return result;
        });
    }

    var isMob = window.cordova !== undefined;
    if (isMob)
      document.addEventListener("deviceready", validate, false);
    else {
      $timeout(function() {
        validate();
      });
    }
  })

  .controller('termsCtrl', function($scope, $rootScope, $cordovaGeolocation, $cordovaDevice, $ionicHistory, $state, $auth, $q, UserCheck, $http, config, $timeout, Rollbar) {
    function validate() {
      $auth.validateUser()
        .then(function(data) {
          $timeout(function() {
            UserCheck.redirectLoggedUser();
          });
        }, function(result) {
          $timeout(function() {
            $ionicHistory.nextViewOptions({ disableBack: true });
            $state.go('login');
          });

          return result;
        });
    }

    $scope.agree = function() {
      $http({
        method: 'POST',
        data: { },
        headers: $auth.retrieveData('auth_headers'),
        url: config.API_URL + '/users/agreed_to_terms'
      }).then(function(data) {
        validate();
      }, function(response) {
        try {
          Rollbar.info(response);
        } catch (ex) { }
        validate();
      })
    };

    $scope.cancel = function() {
      $auth.signOut()
        .then(function(res) {
          // handle success response
          console.log(res);
          $ionicHistory.nextViewOptions({ disableBack: true });
          $state.go('login');
        })
        .catch(function(res) {
          // handle error response
          console.log(res);
          $ionicHistory.nextViewOptions({ disableBack: true });
          $state.go('login');
        });
    };
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

  .controller('loginCtrl', function($scope, $rootScope, $cordovaGeolocation, $cordovaDevice, $ionicHistory, $state, $auth, $q, UserCheck, $timeout) {
    function successLogged(data) {
      $timeout(function() {
        UserCheck.redirectLoggedUser(true);
      });
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

    var validating = false;
    $scope.loginWithFacebook = function() {
      if (!validating) {
        $rootScope.showReadableLoading(getLocalizedMessage('login.loading'));
        $auth.authenticate('facebook')
          .then(function(data) {
            successLogged(data);
          })
          .catch(function(resp) {
            console.log(resp);
            //logOrRegisterWithUUID();
          });
      }
    };

    function validate() {
      validating = true;
      $auth.validateUser().then(function(data) {
        $rootScope.showReadableLoading(getLocalizedMessage('login.loading'));
        validating = false;
        successLogged(data);
      }, function(result) {
        validating = false;
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

  .controller('logoutCtrl', function($scope, $cordovaGeolocation, $ionicHistory, $state, $auth, UserCheck, $timeout) {
    $auth.signOut()
      .then(function(resp) {
        $timeout(function() {
          $state.go('login');
        });
      })
      .catch(function(resp) {
        $timeout(function() {
          UserCheck.redirectLoggedUser();
        });
      });
  })

  .controller('matchWarningCtrl', function($scope, $rootScope, $cordovaGeolocation, $ionicHistory, $state, $stateParams, $auth, $q, Apparel, Chat, $timeout) {
    $scope.single_option = false;
    Chat.local_active_by_id($stateParams["chat_id"]).then(function(chat) {
      $timeout(function() {
        $scope.chat = chat;
        if (!$scope.chat) {
          Chat.online_active_by_id($stateParams["chat_id"]).then(function(chat) {
            $timeout(function() {
              $scope.chat = chat;
            });
          }, function(error) {
            console.log(error);
          });
        }
      });
    });

    $scope.cancel = function() {
      $ionicHistory.nextViewOptions({ disableBack: true });
      $state.go('menu.apparel');
    };

    $scope.submit = function() {
      $ionicHistory.nextViewOptions({ disableBack: true });
      $state.go('menu.chat', { id: $scope.chat.id });
    };

    updateLatLng($cordovaGeolocation, $auth, $q);
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

  .controller('apparelListCtrl', function($scope, $rootScope, $cordovaGeolocation, $cordovaDevice, $ionicHistory, $state, $auth, $q, $stateParams, $ionicPopup, Apparel, $timeout) {
    var user_id = $stateParams.hasOwnProperty("user_id") && $stateParams.user_id > 0 ? $stateParams.user_id : null;
    $scope.is_mine = user_id == null;
    if ($scope.is_mine)
      $scope.owner_user = $rootScope.user;

    function refreshApparels() {
      if ($scope.is_mine) {
        Apparel.owned().then(function(apparels) {
          $timeout(function() {
            $scope.apparels = apparels;
          });
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
              $timeout(function() {
                Apparel.clear_owned_cache();
                refreshApparels();
              });
            });
          } else {
            console.log('You are not sure');
          }
        });
      }
    }
  })

  .controller('chatsCtrl', function($scope, $rootScope, $cordovaGeolocation, $ionicHistory, $state, $auth, $q, Chat, $ionicPopup, $timeout) {

    $scope.onForceRefresh = function() {
      $timeout(function() {
        $scope.doForceRefresh();
      });
    };

    $scope.doForceRefresh = function() {
      $rootScope.showConfirmPopup(t('chats.messages.reload.title'), null, t('chats.messages.reload.body')).then(function(res) {
        if(res) {
          $rootScope.showReadableLoading();
          Chat.clearCache().then(function() {
            Chat.force_reload_active().then(function(data) {
              $timeout(function() {
                $scope.chats = data;
                $scope.$broadcast('scroll.refreshComplete');
                $rootScope.hideReadableLoading();
              });
            }, function() {
              $timeout(function() {
                $scope.$broadcast('scroll.refreshComplete');
                $rootScope.hideReadableLoading();
              });
            });
          }, function() {
            $timeout(function() {
              $scope.$broadcast('scroll.refreshComplete');
              $rootScope.hideReadableLoading();
            });
          });
        } else
          $scope.$broadcast('scroll.refreshComplete');
      });
    };

    Chat.active().then(function(old_data) {
      $timeout(function() {
        $scope.chats = old_data;
        if (!$scope.chats || $scope.chats.length == 0) {
          $rootScope.showReadableLoading();
        }
        Chat.force_reload_active().then(function(data) {
          $timeout(function() {
            $scope.chats = data;
            $rootScope.hideReadableLoading();
            if (!data || data.length == 0) {
              $ionicHistory.nextViewOptions({ disableBack: true });
              $state.go('menu.not_found');
            }
          });
        });
      });
    }, function(data) {
      console.log(data);
      $timeout(function() {
        $ionicHistory.nextViewOptions({ disableBack: true });
        $state.go('menu.not_found');
      });
    });

    $scope.open = function(chat) {
      $timeout(function() {
        $state.go('menu.chat', { id: chat.id });
      });
    };
  })

  .controller('chatDetailsCtrl', function($scope, $rootScope, $cordovaGeolocation, $ionicHistory, $state, $auth, $q, $stateParams, $ionicScrollDelegate, Chat, ChatMessage, ChatSub, $timeout) {
    Chat.local_active_by_id($stateParams["id"]).then(function(chat) {
      $timeout(function() {
        $scope.chat = chat;
        Chat.online_active_by_id($stateParams["id"]).then(function(newChatInfo) {
          if (newChatInfo) {
            $timeout(function() {
              $scope.chat = newChatInfo;
            });
          }
        });
      });
    });

    $scope.close = function() {
      $ionicHistory.goBack();
    };
  })

  .controller('aboutCtrl', function($scope, $cordovaGeolocation, $cordovaDevice, $ionicHistory, $state, $auth, $q, $cordovaAppVersion, $timeout) {
    var isMob = window.cordova !== undefined;
    $scope.appVersion = '-';

    if (isMob) {
      if ($cordovaAppVersion) {
        $cordovaAppVersion.getVersionNumber().then(function (version) {
          $timeout(function() {
            $scope.appVersion = version;
            console.log(version);
          });
        }, function(error) {
          $timeout(function() {
            console.log(error);
            $scope.appVersion = 'cordova ver';
          });
        });
      } else {
        $scope.appVersion = 'cordova version';
      }
    } else {
      $scope.appVersion = 'web version';
    }
  })


  .controller('blankCtrl', function($scope, $cordovaGeolocation, $cordovaDevice, $ionicHistory, $state, $auth, $q) {

  })
