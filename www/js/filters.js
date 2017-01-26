function getProbableApiUrl($auth, url) {
  if (url[0] == '/')
    return $auth.apiUrl() + url;
  else
    return url;
};

function trimStartChar(value, charValue) {
  while (value.length > 0 && value[0] == charValue) {
    value = value.substring(1);
  }
  return value;
};

function getImageAsSource($auth, image) {
  if (image.hasOwnProperty('image'))
    image = image.image;

  if (image.hasOwnProperty('file_url'))
    return getProbableApiUrl($auth, image.file_url);
  else if (image.hasOwnProperty('data'))
    return image.data;
  else if (image.hasOwnProperty('url')) {
    if (image.url)
      return getProbableApiUrl($auth, image.url);
    else
      return null;
  }
  else
    return image;
};

function timeToDate(time) {
  return new Date(time.getFullYear(), time.getMonth(), time.getDate(), 0,0,0);
}

angular.module('app.filters', [])
  .filter('distanceToString', function () {
    return function (distance) {
      var rounded = Math.round(distance * 10) / 10;
      if (rounded < 1) {
        if (rounded < 0.5)
          return t('shared.distance.really_close');
        else
          return t('shared.distance.close_to_prefix') + t('shared.distance.less_than_one_km') + t('shared.distance.close_to_sufix');
      }
      else
        return t('shared.distance.close_to_prefix') + rounded + t('shared.distance.close_to_sufix');
    };
  })
  .filter('timeToString', function () {
    return function (time) {
      var timeMoment = moment(time);
      var nowMoment = moment();
      // var nowDate = timeToDate(now);
      // var timeDate = timeToDate(time);
      var days = 24 * 3600 * 1000;
      var diff = nowMoment.diff(timeMoment);
      var diffInDays = diff / days;
      // var diffInHours = diffInDays / 24;
      if (diffInDays > 1) {
        if (diffInDays < 2 && nowMoment.date() == (timeMoment.date() - 1))
          return t('shared.datetime.yesterday');
        else {
          return Math.floor(diffInDays) + ' ' + t('shared.datetime.since_days');
        }
      } else {
        if (nowMoment.date() == timeMoment.date())
          return timeMoment.format('h:mm')
        else
          return t('shared.datetime.yesterday');
      }
    };
  })
  .filter('trimStartChar', function () {
    return trimStartChar;
  })
  .filter('imageSrc', function ($auth) {
    return function (image) {
      return getImageAsSource($auth, image);
    };
  })
  .filter('userImageSrc', function ($auth) {
    return function (user) {
      var result = null
      if (user) {
        if (user.image)
          result =  getImageAsSource($auth, user.image);  
        if (!result && user.social_image)
          result = getProbableApiUrl($auth, user.social_image);
      }
      return result;
    };
  })
  .filter('shortName', function () {
    return function (user) {
      if (user) {
        if (user.hasOwnProperty('nickname') && user.nickname)
          return user.nickname;
        if (user.hasOwnProperty('name') && user.name) {
          var spaceIndex = user.name.indexOf(' ');
          if (spaceIndex > -1) {
            user.nickname = user.name.substring(0, spaceIndex);
            return user.nickname;
          }
          else
            return user.name;
        }
        else
          return t('shared.user.anonymous');
      } else
        return '-';
    };
  })
  .filter('genderName', function ($auth) {
    return function (gender) {
      if (gender == "FEM" || gender == "MASC")
        return gender;
      else
        return null;
    };
  }).filter('ageInfoName', function ($auth) {
    return function (gender) {
      if (gender == "ADU")
        return t('shared.options.age_info.adult');
      else if (gender == "INF")
        return t('shared.options.age_info.child');
      else if (gender != "NO")
        return t('shared.options.age_info.any');
      else
        return null;
    };
  });