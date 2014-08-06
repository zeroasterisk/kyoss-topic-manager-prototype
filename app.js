// IronRouter
// https://github.com/EventedMind/iron-router/
Router.configure({
  layoutTemplate: 'masterLayout',
  notFoundTemplate: 'notFound'
});
Router.map(function() {
  this.route('home', {path: '/'});
  this.route('about');
  this.route('setup');
  this.route('meteor');
  this.route('accelerometer');
  this.route('gps');
  this.route('maps');
});

// Cordova mockup / need to "fake"  cordova in your browser?
//   Check out the "Ripple Emulator"
//   http://emulate.phonegap.com/


// Cordova access for Templates
if (Meteor.isClient) {
  UI.registerHelper('exists', function (objectname) {
    return _.isObject(eval(objectname));
  });
  UI.registerHelper('get', function (objectname, objectpath) {
    console.log('get: ', objectname, objectpath);
    return _.isObject(cordova);
  });
  UI.registerHelper('hasCordova', function () {
    return _.isObject(device) || _.isObject(cordova);
  });
  UI.registerHelper('cordova', function () {
    if (!_.isObject(cordova)) {
      return null;
    }
    return cordova;
  });

  UI.registerHelper('propertiesAsTable', function (objectname) {
    if (!_.isObject(eval(objectname))) {
      return null;
    }
    this.output = '<table class="table">';
    _.each(eval(objectname), function(value, key, list) {
      console.log('propertiesAsTable, in each', key, value, list, this);
      this.output = this.output +
        '<tr>' +
        '<td>' + key + '</td>' +
        '<td><strong>' + value + '</strong></td>' +
        '</tr>';
    }, this);
    this.output = this.output + '</table>';

    return Spacebars.SafeString(this.output);
  });

  UI.body.helpers({
    device: function() {
      if (!_.isObject(device)) {
        console.error('device object is not available... did you install this plugin?',
                      'https://github.com/apache/cordova-plugin-device/blob/master/doc/index.md');
        return {};
      }
      console.log('device helper:',device);
      return device;
    }
  });
}

