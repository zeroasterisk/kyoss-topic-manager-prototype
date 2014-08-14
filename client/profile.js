Template.profile.helpers({
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


