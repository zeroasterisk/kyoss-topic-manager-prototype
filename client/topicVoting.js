Template.topicVoting.events({
  'click a.votingStart': function() {
    Session.set('votingOnTopic', this._id);
  },
  'click a.votingEnd': function() {
    Session.set('votingOnTopic', null);
  },
  'click a.votingCast': function() {
    Session.set('votingOnTopic', null);
    var mtg = Meeting.current();
    var userId = Meteor.userId();
    Meeting.clearUserVotesOnTopic(mtg, userId, this.topicId);
    Meeting.setUserVotesOnTopic(mtg, userId, this.topicId, this.count);
  }
});
Template.topicVoting.helpers({
  myVotes: function() {
    var mtg = Meeting.current();
    var userId = Meteor.userId();
    var topicId = this._id;
    return Meeting.getUserVotesOnTopic(mtg, userId, topicId);
  },
  votes: function() {
    var mtg = Meeting.current();
    var userId = Meteor.userId();
    var topicId = this._id;
    var votesCast = Meeting.getUserVotesOnTopic(mtg, userId, topicId);
    var votesAllowed = Meeting.getUserVotesAllowed(mtg, userId);
    // if we have already cast votes on this topic, add them to votesAllowed
    votesAllowed = votesAllowed + votesCast;
    var votes = [];
    for (i = 0; i <= votesAllowed; i++) {
      votes.push({
        topicId: topicId,
        count: i,
        class: (i == votesCast ? 'primary' : 'default')
      });
    }
    return votes;
  },
  isVoting: function() {
    return (Session.get('votingOnTopic') == this._id);
  },
  canVoteOnTopic: function() {
    var mtg = Meeting.current();
    if (!Meeting.isVoteable(mtg)) {
      return false;
    }
    var userId = Meteor.userId();
    var topicId = this._id;
    var votesCast = Meeting.getUserVotesOnTopic(mtg, userId, topicId);
    var votesAllowed = Meeting.getUserVotesAllowed(mtg, userId);
    return (votesCast > 0 || votesAllowed > 0);
  }
});
