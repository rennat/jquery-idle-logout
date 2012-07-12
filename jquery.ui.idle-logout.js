// jQuery idleLogout plugin v-0.0
// ==============================
// 
// Idle logout maintianing one session across multiple tabs/windows.
//
// authored by
// -----------
// - Tanner Netterville
//   - http://github.com/rennat

(function ($) {
  var 

    // plugin defaults
    // any of these can be overridden in initialization
    defaults = {
      // milliseconds of idle time before logout
      idleMilliseconds: 20 * 60 * 1000,
      // countdown length in seconds
      countdownSeconds: 30,
      // message used in countdown popup
      // "{countdown}" will be replaced with, you guessed it, a countdown timer
      countdownMessage: "You will be logged out due to inactivity in {countdown} seconds.",
      // redirect to this url after timeout
      logoutUrl: '/logout',
      // load this url in the background to keep server session alive
      // if this is false then it will not be loaded
      //keepAliveUrl: false,
      // domain where cookie is valid
      cookieDomain: window.location.hostname,
      // update time in milliseconds
      updateMilliseconds: 100,
      // listen to these events
      bindEvents: "mousemove mousedown mouseup keydown keyup focus blur",
      // start after init
      autostart: true
    },

    // private variables
    data,

    // static methods
    doHandleActivity = function (e) {
      console.debug('doHandleActivity', arguments);
      $.idleLogout('handleActivity', e);
    },
    doUpdate = function () {
      $.idleLogout('update');
    },
    setCookie = function (t) {
      $.cookie('idleLogout-lastActivityTime', t);
    },
    getCookie = function (t) {
      return $.cookie('idleLogout-lastActivityTime');
    },
    doLogout = function () {
      $.idleLogout('logout');
    },
    doStartCountdown = function () {
      $.idleLogout('startCountdown');
    },
    doCancelCountdown = function () {
      $.idleLogout('cancelCountdown');
    },

    // plugin methods
    methods = {

      // init
      // `$.idleLogout({...});`
      init: function (options) {
        var
          settings = $.extend(defaults, options),
          message = settings.countdownMessage.replace('{countdown}', '<span class="countdown-timer"></span>'),
          $dialog,
          $timer;
        $dialog = $('<div>'+message+'</div>');
        $timer = $dialog.find('.countdown-timer');
        $dialog.dialog({
          resizable: false,
          autoOpen: false,
          modal: true,
          buttons: {
            "Cancel Logout": function () {
              $.idleLogout('cancelCountdown');
            }
          },
          close: function () {
            $.idleLogout('cancelCountdown');
          }
        });
        data = {
          settings: settings,
          updateTimeoutPointer: null,
          logoutTimeoutPointer: null,
          logoutTime: null,
          countdownTimeoutPointer: null,
          countdownIntervalPointer: null,
          $countdownDialog: $dialog,
          $countdownTimer: $timer,
          lastActivityTime: new Date().getTime(),
        };
        if (data.settings.autostart) {
          $.idleLogout('enable');
        }
        // maintain chainability
        return this;
      },

      // enable
      // `$.idleLogout('enable');`
      enable: function () {
        var
          settings = data.settings,
          countdownMilliseconds = settings.idleMilliseconds - settings.countdownSeconds * 1000;
        // bind events
        $(document).bind(settings.bindEvents, doHandleActivity);
        // schedule update timeout
        data.updateTimeoutPointer = window.setTimeout(doUpdate, settings.updateMilliseconds);
        // schedule countdown timeout
        data.logoutCountdownPointer = window.setTimeout(doStartCountdown, countdownMilliseconds);
        // set logout time
        data.logoutTime = data.lastActivityTime + settings.idleMilliseconds / 1000;
        // schedule logout timeout
        data.logoutTimeoutPointer = window.setTimeout(doLogout, settings.idleMilliseconds);
        // maintain chainability
        return this;
      },

      // disable
      // `$.idleLogout('disable');`
      disable: function () {
        var
          settings = data.settings;
        // unbind events
        $(document).unbind(settings.bindEvents, doHandleActivity);
        // cancel update timeout
        window.clearTimeout(data.updateTimeoutPointer);
        // cancel countdown timeout
        window.clearTimeout(data.logoutCountdownPointer);
        // clear logout time
        data.logoutTime = null;
        // cancel logout timeout
        window.clearTimeout(data.logoutTimeoutPointer);
        // maintain chainability
        return this;
      },

      // handleActivity
      // usage: `$.idleLogout('handleActivity');`
      // usage: `$.idleLogout('handleActivity', e);`
      // updates last activity time to the given event's timestamp or the current time
      handleActivity: function (e) {
        var
          settings = data.settings,
          timestamp = e && e.timestamp || new Date().getTime();
        data.lastActivityTime = timestamp;
        $.idleLogout('resetFromTime', data.lastActivityTime);
        // maintain chainability
        return this;
      },

      // update
      // usage: `$.idleLogout('update');`
      // syncs local data with cookie
      update: function () {
        var
          settings = data.settings,
          cookieTime = getCookie(),
          idleTime;
        // sync with cookie
        if (data.lastActivityTime > cookieTime) {
          // update cookie from local
          setCookie(data.lastActivityTime);
        } else if (data.lastActivityTime < cookieTime) {
          // update local from cookie
          data.lastActivityTime = getCookie();
          $.idleLogout('resetFromTime', data.lastActivityTime);
        }
        // check for logout
        idleTime = new Date().getTime() - data.lastActivityTime * 1000;
        if (idleTime > settings.idleMilliseconds) {
          console.log('logout');
        }
        // schedule update timeout
        data.updateTimeoutPointer = window.setTimeout(doUpdate, settings.updateMilliseconds);
        // maintain chainability
        return this;
      },

      // resetFromTime
      // usage: `$.idleLogout('resetFromTime', timestamp);`
      resetFromTime: function (timestamp) {
        var
          settings = data.settings,
          delay = settings.idleMilliseconds - (new Date().getTime() - timestamp) * 1000;
        // cancel logout timeout
        window.clearTimeout(data.logoutTimeoutPointer);
        // set logout time
        data.logoutTime = new Date().getTime() * 1000 + delay;
        // schedule logout timeout
        data.logoutTimeoutPointer = window.setTimeout(doLogout, delay);
      },

      // logout
      // usage: `$.idleLogout('logout');`
      logout: function () {
        window.location.href = data.settings.logoutUrl;
      },

      // startCountdown
      // usage: `$.idleLogout('startCountdown');`
      startCountdown: function () {
        var
          $timer;
        data.$countdownDialog.dialog('open');
        $timer = data.$countdownDialog.dialog('widget').find('.countdown-timer');
        if ($timer.length) {
          data.countdownIntervalPointer = window.setInterval(function () {
            if (data.logoutTime) {
              $timer.text(Math.max(0, data.logoutTime - new Date().getTime()));
            }
          }, 1000);
        }
      },

      // cancelCountdown
      cancelCountdown: function () {
        data.$countdownDialog.dialog('close');
        window.clearInterval(data.countdownIntervalPointer);
      }
    };

  // register jQuery plugin
  $.idleLogout = function (method) {
    if (methods[method]) {
      return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
    } else if (typeof method === 'object' || !method) {
      return methods.init.apply(this, arguments);
    } else {
      $.error('Method ' +  method + ' does not exist on jQuery.idleLogout');
    }
  };
}(jQuery));
