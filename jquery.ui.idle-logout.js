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
    defaults = {
      // milliseconds of idle time before logout
      idleMilliseconds: 20 * 60 * 1000,
      // countdown length in seconds
      countdownSeconds: 30,
      // redirect to this url after timeout
      logoutUrl: '/logout',
      // load this url in the background to keep server session alive
      keepAliveUrl: '/',
      // domain where cookie is valid
      cookieDomain: window.location.hostname,
      // update time in milliseconds
      updateMilliseconds: 100,
      // listen to these events
      bindEvents: {
        'document': "mousemove mouseenter mouseleave mousedown mouseup keydown keyup focus blur",
        'window': "mousemove mouseenter mouseleave mousedown mouseup keydown keyup focus blur"
      }
    },
    // static methods
    doHandleActivity = function (e) {
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
    // plugin methods
    methods = {
      // init
      // `$.idleLogout({...});`
      init: function (options) {
        var
          data = {
            settings: $.extend(defaults, options),
            updateTimeoutPointer: null,
            logoutTimeoutPointer: null,
            lastActivityTime: null
          }
        // register plugin data
        $.data('idleLogout', data);
        // maintain chainability
        return this;
      },
      // enable
      // `$.idleLogout('enable');`
      enable: function () {
        var
          data = $.data('idleLogout'),
          settings = data.settings;
        // bind events
        $(document).bind(settings.bindEvents.document, doHandleActivity);
        $(window).bind(settings.bindEvents.window, doHandleActivity);
        // schedule update timeout
        data.updateTimeoutPointer = window.setTimeout(doUpdate, settings.updateMilliseconds);
        // maintain chainability
        return this;
      },
      // disable
      // `$.idleLogout('disable');`
      disable: function () {
        var
          data = $.data('idleLogout'),
          settings = data.settings;
        // unbind events
        $(document).unbind(settings.bindEvents.document, doHandleActivity);
        $(window).unbind(settings.bindEvents.window, doHandleActivity);
        // cancel update timeout
        window.clearTimeout(data.updateTimeoutPointer);
        // maintain chainability
        return this;
      },
      // handleActivity
      // `$.idleLogout('handleActivity', e);`
      handleActivity: function (e) {
        var
          data = $.data('idleLogout'),
          settings = data.settings;
        data.lastActivityTime = new Date().getTime();
        $.idleLogout('resetFromTime', data.lastActivityTime);
        // maintain chainability
        return this;
      },
      // update
      // `$.idleLogout('update');`
      update: function () {
        var
          data = $.data('idleLogout'),
          settings = data.settings,
          cookieTime = getCookie();
        // sync with cookie
        if (data.lastActivityTime > cookieTime) {
          // update cookie from local
          setCookie(data.lastActivityTime);
        } else if (data.lastActivityTime < cookieTime) {
          // update local from cookie
          data.lastActivityTime = getCookie();
          $.idleLogout('resetFromTime', data.lastActivityTime);
        }
        // maintain chainability
        return this;
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
