Template.currentMeeting.helpers({
  get: function() {
    return Meeting.current();
  },
  start: function() {
    var mgt = Meeting.current();
    return moment(mgt.start).format('MMM DD');
  },
  name: function() {
    var mgt = Meeting.current();
    return mgt.name;
  }
});
