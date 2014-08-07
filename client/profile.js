Template.profile.helpers({
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
