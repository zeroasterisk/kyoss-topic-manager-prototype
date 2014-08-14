/**
 * publications
 *
 */

// Public
//   - All Topics Limited
//   - Top Topics This Meeting
Meteor.publish('public', function () {
  var yesterday = moment().subtract('days', 1).toDate();
  return [
    // 2 meetings in the near future
    Meeting.find(
      { start: { $gt: yesterday } },
      { sort: { start: 1 }, limit: 2 }
    ),
    // all public topics (could get heavy...)
    Topic.find(
      // TODO: remove private
      { },
      { fields: {
        name: 1,
        short: 1,
        url: 1,
        tags: 1,
        locked: 1,
        votesLife: 1,
        votesCurrent: 1
        /* not including:
         *   - votes: too large
         */
      } }
    )
  ];
});

Meteor.publish('loggedin', function (userId) {
  if (!this.userId) {
    return [];
  }
  return [
    Topic.find(
      // TODO: remove private
      { },
      { fields: {
      }}
    )
  ];
});

Meteor.publish('topic', function (id) {
  var end = moment().endOf('month').toDate();
  return [
    Topic.find(
      { _id : id },
      { }
    ),
    // 4 meetings in the near past
    Meeting.find(
      { start: { $lt: end } },
      { sort: { start: -1 }, limit: 4 }
    ),
  ];
});

Meteor.publish('meeting', function (id) {
  return [
    Meeting.find(
      { _id: id },
      {}
    ),
  ];
});


