Template.topics.helpers({
  canEdit: function() {
    return Topic.canEdit(Meteor.userId(), this);
  },
  topicVoteHistory: function() {
    return Topic.helperVoteHistory(this._id);
  }
});


