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
      // seconds of idle time before logout
      idleSeconds: 20 * 60,
      // countdown length in seconds
      countdownSeconds: 30,
      // message used in countdown popup
      // "{countdown}" will be replaced with, you guessed it, a countdown timer
      countdownMessage: "You will be logged out due to inactivity in {countdown} seconds.",
      // redirect to this url after timeout
      logoutUrl: '/logout',
      // domain where cookie is valid
      cookieDomain: window.location.hostname,
      // update time in milliseconds
      updateMilliseconds: 100,
      // listen to these events
      bindEvents: "mousemove mousedown mouseup keydown keyup focus blur"
    },

    // private variables
    settings,
    lastActivityTime,
    logoutTimeoutPointer,
    logoutTime,
    countdownTime,
    countdownTimeoutPointer,
    countdownIntervalPointer,
    $countdownDialog,

    // private methods

    // trigger idleLogout event
    triggerLogout = function () {
      $(document).trigger('idleLogout.logout');
    },

    // trigger idleCountdownStart event
    triggerCountdownStart = function () {
      $(document).trigger('idleLogout.countdownStart');
    },

    // clear timers
    clearTimers = function () {
      if (logoutTimeoutPointer) {
        window.clearTimeout(logoutTimeoutPointer);
      }
      if (countdownTimeoutPointer) {
        window.clearTimeout(countdownTimeoutPointer);
      }
    },

    // update timers
    updateTimersFromTimestamp = function (timestamp) {
      var
        now = new Date().getTime(),
        logoutDelay,
        countdownDelay;
      clearTimers();
      logoutTime = timestamp + settings.idleSeconds * 1000;
      countdownTime = logoutTime - settings.countdownSeconds * 1000;
      logoutDelay = (logoutTime - now);
      countdownDelay = (countdownTime - now);
      logoutTimeoutPointer = window.setTimeout(triggerLogout, logoutDelay);
      countdownTimeoutPointer = window.setTimeout(triggerCountdownStart, countdownDelay);
    },

    // countdown interval
    countdownUpdate = function ($timer) {
      var
        now = new Date().getTime(),
        secondsRemaining = Math.ceil((logoutTime - now) / 1000.0);
        cookieTime = parseInt($.cookie('lastActivityTime'));
      if (cookieTime > lastActivityTime) {
        lastActivityTime = cookieTime;
        updateTimersFromTimestamp(lastActivityTime);
        $countdownDialog.dialog('close');
      } else {
        $timer.text(secondsRemaining);
      }
    },
    
    // start counting down
    beginCountdown = function ($timer) {
      var
        cookieTime = parseInt($.cookie('lastActivityTime'));
      if (cookieTime > lastActivityTime) {
        updateTimersFromTimestamp(cookieTime);
      } else {
        countdownUpdate($timer);
        countdownIntervalPointer = window.setInterval(function () {
          countdownUpdate($timer);
        }, 1000);
      }
    },

    // stop counting down
    cancelCountdown = function () {
      updateTimersFromTimestamp(new Date().getTime());
    },

    // prepare the countdown dialog
    makeDialog = function () {
        var
          message = settings.countdownMessage.replace('{countdown}', '<span class="countdown-timer"></span>'),
          $timer;
        $countdownDialog = $('<div>'+message+'</div>');
        $timer = $countdownDialog.find('.countdown-timer');
        $countdownDialog.dialog({
          resizable: false,
          autoOpen: false,
          modal: true,
          buttons: {
            "Cancel Logout": function () {
              $countdownDialog.dialog('close');
            }
          },
          open: function () {
            beginCountdown($timer);
          },
          close: function () {
            cancelCountdown();
          }
        });
    },

    // logout event handler
    logoutHandler = function () {
      window.location.href = settings.logoutUrl;
    },

    // udpate the last activity time
    // sets cookie
    activityHandler = function () {
      var
        cookieTime = parseInt($.cookie('lastActivityTime'));
      lastActivityTime = new Date().getTime();
      if (!cookieTime || cookieTime < lastActivityTime) {
        $.cookie('lastActivityTime', lastActivityTime);
      }
      if (!$countdownDialog.dialog('isOpen')) {
        updateTimersFromTimestamp(lastActivityTime);
      }
    },

    // countdown event handler
    countdownHandler = function () {
      var
        cookieTime = parseInt($.cookie('lastActivityTime'));
      if (cookieTime > lastActivityTime) {
        updateTimersFromTimestamp(cookieTime);
      } else {
        $countdownDialog.dialog('open');
      }
    },

    // plugin methods
    methods = {
      // init
      // `$.idleLogout({...});`
      init: function (options) {
        settings = $.extend(defaults, options);
        lastActivityTime = new Date().getTime();
        // make dialog
        makeDialog();
        // begin timers
        updateTimersFromTimestamp(lastActivityTime);
        // bind events
        $(document).
          bind({
            'idleLogout.logout': logoutHandler,
            'idleLogout.countdownStart': countdownHandler
          }).
          bind(settings.bindEvents, activityHandler);
        activityHandler();
        // maintain chainability
        return this;
      },
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
