Vote = new Meteor.Collection('votes', {
  schema: {
    meetingId: {
      type: String,
      label: "Meeting ID",
      index: true
    },
    topicId: {
      type: String,
      label: "Topic ID",
      index: true
    },
    userId: {
      type: String,
      label: "User ID",
      index: true,
      autoValue: function() {
        if (this.isInsert) {
          return this.userId;
        } else if (this.isUpsert) {
          return {$setOnInsert: this.userId};
        } else {
        }
      }
    },
    votes: {
      type: Number,
      label: "Votes allocated",
      optional: true,
    },
    created: {
      type: Date,
      label: "Timestamp",
      optional: true,
      autoValue: function() {
        if (this.isInsert) {
          return new Date;
        } else if (this.isUpsert) {
          return {$setOnInsert: new Date};
        } else {
          this.unset();
        }
      }
    },
    modified: {
      type: Date,
      label: "Creation",
      optional: true,
      autoValue: function() {
        return new Date;
      }
    }
  },
  transform: function(data) {
    if (Meteor.isClient) {
      data.createdNice = moment(data.created).format('MMMM DD, YYYY');
      data.modifiedNice = moment(data.modified).format('MMMM DD, YYYY');
      data.Meeting = Meeting.findOne({ _id: data.meetingId });
      data.User = Meteor.users.findOne({ _id: data.userId });
    }
    return data;
  }
});

// -----------------------------------
// -- Security
// -----------------------------------

Vote.canEdit = function(userId, doc) {
  console.log('canEdit', userId, doc);
  return (userId && doc.owner === userId);
};

Vote.allow({
  insert: function (userId, doc) {
    // the user must be logged in, and the document must be owned by the user
    console.log('Insert Vote', userId, doc);
    return (userId && doc.owner === userId);
  },
  update: function (userId, doc, fields, modifier) {
    // can only change your own documents
    return (
      doc.owner === userId ||
      isAdmin(userId)
    );
  },
  remove: function (userId, doc) {
    // can only remove your own documents
    return (
      doc.owner === userId ||
      isAdmin(userId)
    );
  },
  fetch: ['owner']
});

Vote.deny({
  update: function (userId, docs, fields, modifier) {
    if (isAdmin(userId)) {
      return true;
    }
    // can't change owners
    return _.contains(fields, 'owner');
  },
  remove: function (userId, doc) {
    // can't remove locked documents
    return doc.locked;
  },
  fetch: ['locked'] // no need to fetch 'owner'
});

// -----------------------------------
// -- Logic / Helpers
// -----------------------------------
