angular.module('app.controllers')
  .controller('apparelCtrl', function($scope, $rootScope, $cordovaGeolocation, $ionicHistory, $state, $auth, $q, $ionicSlideBoxDelegate, Apparel, ApparelRating, Chat, ApparelMatcher, $ionicLoading, $log, config, NotificationManager, $ionicPopup) {
    $scope.showLoading = function(message) {
      $rootScope.showReadableLoading(message);
    };
    $scope.hideLoading = function(){
      $rootScope.hideReadableLoading();
    };

    function setCurrentApparel(apparel) {
      if (apparel != null) {
        var entry = apparel;

        // sets dummy data
        if (!entry.hasOwnProperty('user') || !entry.user) {
          entry.user = {
            id: entry.user_id,
            nickname: 'giovana camargo',
            distance: '3km',
            social_image:null,
            image: null
          }
        }

        $scope.entry = entry;
        $ionicSlideBoxDelegate.update();
      } else {
        $ionicHistory.nextViewOptions({ disableBack: true });
        $state.go('menu.apparels_not_found');
      }
    }

    function loadNextApparel() {
      if (!ApparelMatcher.isNextAlreadyLoaded()) {
        $scope.showLoading(t('apparel.loading.message'));
      }

      ApparelMatcher.getNextAvailableApparel().then(function(apparel) {
        setCurrentApparel(apparel);
        setTimeout(function() {
          ApparelMatcher.loadApparelsIfNeededAsync();
        }, 500);
        $scope.hideLoading();
      }, function(error) {
        $log.debug(error);
        $scope.hideLoading();
        $rootScope.showToastMessage(t('apparel.messages.error.loading'), 1000);
      });
    }

    function nextAfterMatch(chat_data) {
      $ionicHistory.nextViewOptions({ disableBack: true });
      $state.go('menu.match_warning', { chat_id: chat_data.id });
    };

    function goToNextApparel() {
      $ionicHistory.nextViewOptions({ disableBack: true });
      $state.go($state.current, { last_id: $scope.entry.id }, {
        reload: false,
        inherit: false,
        notify: true
      });
    };

    function failAfterRating(error) {
      $log.debug(error);
      // não será necessario por enquanto ja que vamos fazer isso asincronamente
      // $rootScope.showToastMessage('Erro carregando salvando rating');
    };

    $scope.like = function() {
      var rating = new ApparelRating({apparel_id: $scope.entry.id, liked: true})

      rating.save().then(function(data) {
        ApparelMatcher.markAsRated(data.id);

        if (data.hasOwnProperty('chat') && data.chat != null)
          nextAfterMatch(data.chat);

      }, failAfterRating);

      goToNextApparel();
    };

    $scope.dislike = function() {
      var rating = new ApparelRating({apparel_id: $scope.entry.id, liked: false})
      rating.save().then(function(data) {
        ApparelMatcher.markAsRated(data.id);
      }, failAfterRating);

      goToNextApparel();
    }

    $scope.report = function() {
      $scope.report_entry = { reason: null };
      var confirmPopup = $ionicPopup.show({
        title: t('apparel.report.title'),
        templateUrl: '/templates/match/_report.html',
        scope: $scope,
        buttons: [{ // Array[Object] (optional). Buttons to place in the popup footer.
          text: t('shared.buttons.cancel'),
          type: 'button-default'
        }, {
          text: t('shared.buttons.confirm'),
          type: 'button-positive',
          onTap: function(e) {
            if ($scope.report_entry.reason) {
              return $scope.report_entry.reason;
            } else {
              e.preventDefault();
            }
          }
        }]
      });

      confirmPopup.then(function(res, e) {
        if(res) {
          $scope.entry.report(res).then(function(data) {
            goToNextApparel();
          });
        } else {
          console.log('You are not sure');
        }
      });
    }

    loadNextApparel();

    updateLatLng($cordovaGeolocation, $auth, $q)
      .then(function(resp) {
        // $scope.getApparels().then(function(data){
        //   // TODO
        //   $scope.hide();
        // });
      }, function(resp) {
        // $scope.hide();
      });

    NotificationManager.showApparelsNotificationIfNeeded();
  });