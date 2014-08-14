// NOTE: using Meeting.currentGet() because this is called before subscriptions exist
Template.currentMeetingDL.helpers({
  isVoteable: function() {
    var mtg = Meeting.currentGet();
    return Meeting.isVoteable(mtg);
  },
  votesSpent: function() {
    var mtg = Meeting.currentGet();
    var userId = Meteor.userId();
    return Meeting.getUserVotes(mtg, userId);
  },
  votesLeft: function() {
    var mtg = Meeting.currentGet();
    var userId = Meteor.userId();
    return Meeting.getUserVotesAllowed(mtg, userId);
  }
});

Template.currentMeeting.helpers({
  get: function() {
    return Meeting.currentGet();
  },
  start: function() {
    var mgt = Meeting.currentGet();
    return moment(mgt.start).format('MMM DD');
  },
  name: function() {
    var mgt = Meeting.currentGet();
    return mgt.name;
  }
});
