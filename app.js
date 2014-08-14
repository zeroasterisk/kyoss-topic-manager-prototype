// IronRouter
// https://github.com/EventedMind/iron-router/
Router.configure({
  layoutTemplate: 'masterLayout',
  notFoundTemplate: 'notFound'
});
Router.map(function() {
  this.route('home', {
    path: '/',
    waitOn: function() {
      return Meteor.subscribe('public');
    },
    data: function() {
      return {
        topics: Topic.find(
          {},
          { sort: {
            votesCurrent: -1,
            votesLife: -1,
            created: -1,
          } }
        )
      };
    }
  });

  this.route('topics', {
    waitOn: function() {
      return Meteor.subscribe('public');
    },
    data: function() {
      return {
        topics: Topic.find(
          {},
          { sort: {
            votesCurrent: -1,
            votesLife: -1,
            created: -1,
          } }
        )
      };
    }
  }),
  this.route('topic', {
    path: '/topic/:_id',
    waitOn: function() {
      return Meteor.subscribe('topic', this.params._id);
    },
    data: function() {
      return Topic.findOne(this.params._id);
    }
  });
  this.route('topicNew', {
  });
  this.route('topicEdit', {
    path: '/topicEdit/:_id',
    waiton: function() {
      return Meteor.subscribe('topic', this.params._id);
    },
    data: function() {
      return {
        topic: Topic.findOne(this.params._id)
      };
    }
  });

  this.route('meetings', {
    waitOn: function() {
      return Meteor.subscribe('public');
    },
    data: function() {
      return {
        meetings: Meeting.find(
          {},
          { sort: { start: -1 } }
        )
      };
    }
  }),
  this.route('meeting', {
    path: '/meeting/:_id',
    waitOn: function() {
      return Meteor.subscribe('meeting', this.params._id);
    },
    data: function() {
      return {
        meeting: Meeting.findOne(this.params._id),
        topics: Topic.findForMeeting(this.params._id)
      }
    }
  });
  this.route('meetingEdit', {
    path: '/meetingEdit/:_id',
    waiton: function() {
      return Meteor.subscribe('meeting', this.params._id);
    },
    data: function() {
      return {
        topic: Meeting.findOne(this.params._id)
      };
    }
  });

  this.route('profile');
  this.route('about');
});

if (Meteor.isClient) {
  SubscriptionPublicHandle = Meteor.subscribe('public');
  Deps.autorun(function () {
    Meteor.subscribe('loggedin', Meteor.userId());
  });
}
