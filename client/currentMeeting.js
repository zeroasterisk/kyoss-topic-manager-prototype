Template.currentMeetingDL.helpers({
  isVoteable: function() {
    var mtg = Meeting.current();
    return Meeting.isVoteable(mtg);
  },
  votesSpent: function() {
    var mtg = Meeting.current();
    var userId = Meteor.userId();
    return Meeting.getUserVotes(mtg, userId);
  },
  votesLeft: function() {
    var mtg = Meeting.current();
    var userId = Meteor.userId();
    return Meeting.getUserVotesAllowed(mtg, userId);
  }
});

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
