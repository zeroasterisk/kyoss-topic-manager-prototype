// Running on the server, daily

dailyInterval = Meteor.setInterval(function() {

    // create the current meeting, according to rules
    console.log('calling meetingCurrentCreate');
    Meteor.call('meetingCurrentCreate');

}, 86400000);

