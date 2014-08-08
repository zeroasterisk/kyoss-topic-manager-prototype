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

// hedaer login button taking people to the Profile
// https://github.com/mangasocial/meteor-accounts-ui-bootstrap-3/
Template._loginButtonsLoggedInDropdown.events({
  'click #login-buttons-edit-profile': function(event) {
    event.stopPropagation();
    Template._loginButtons.toggleDropdown();
    Router.go('profile');
  }
});


