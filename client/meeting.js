Template.meeting.helpers({
  isVoteable: function() {
    return Meeting.isVoteable(this._id);
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
