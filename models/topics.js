Topic = new Meteor.Collection('topics', {
  schema: {
    name: {
      type: String,
      label: "Name",
      regEx: /^[a-z0-9A-z .-_]{3,180}$/,
      index: true,
      unique: true
    },
    short: {
      type: String,
      label: "Short Desc",
      max: 240
    },
    desc: {
      type: String,
      label: "Long Description (include presentation info)",
      //row: 4,
      optional: true
    },
    tags: {
      type: String,
      label: "A list of simple strings to use as tags (space separated)",
      regEx: /^[a-z0-9A-z .-_"']{0,180}$/,
      optional: true
    },
    url: {
      type: String,
      label: "URL (project, github, wikipedia, etc)",
      regEx: SimpleSchema.RegEx.Url,
      optional: true
    },
    private: {
      type: Boolean,
      label: "Private (to only owner)",
      optional: true
    },
    locked: {
      type: Boolean,
      label: "Locked (unchangedable)",
      optional: true
    },
    votes: {
      type: Object,
      label: "Recent History of Votes {meetingId:votes}",
      optional: true,
      autoValue: function() {
        if (!this.isSet) {
          return;
        }
        if (this.isInsert) {
          return {};
        } else if (this.isUpsert) {
          return {};
        } else if (!this.isFromTrustedCode) {
          // not form server, omit
          this.unset();
        }
      }
    },
    votesOld: {
      type: Number,
      label: "Total of all purged History of Votes",
      optional: true,
      autoValue: function() {
        if (this.isInsert) {
          return 0;
        } else if (this.isUpsert) {
          return 0;
        } else if (!this.isFromTrustedCode) {
          // not form server, omit
          this.unset();
        }
      }
    },
    votesCurrent: {
      type: Number,
      label: "Current Meeting Votes",
      optional: true,
      autoValue: function() {
        if (this.isInsert) {
          return 0;
        } else if (this.isUpsert) {
          return 0;
        } else if (!this.isFromTrustedCode) {
          // not form server, omit
          this.unset();
        }
      }
    },
    votesLife: {
      type: Number,
      label: "Lifetime Votes",
      optional: true,
      autoValue: function() {
        if (this.isInsert) {
          return 0;
        } else if (this.isUpsert) {
          return 0;
        } else if (!this.isFromTrustedCode) {
          // not form server, omit
          this.unset();
        }
      }
    },
    owner: {
      type: String,
      label: "Owner",
      optional: true,
      autoValue: function() {
        if (this.isInsert) {
          return this.userId;
        } else if (this.isUpsert) {
          return {$setOnInsert: this.userId};
        } else if (!this.isFromTrustedCode) {
          // not form server, omit
          this.unset();
        } else {
          /*
          // TODO: need to allow admin to change owner
          console.log('Topic.Schema.owner.autoValue', this);
          this.unset();
          */
        }
      }
    },
    created: {
      type: Date,
      label: "Creation",
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
      optional: true
    }
  },
  transform: function(data) {
    if (Meteor.isClient) {
      data.createdNice = moment(data.created).format('MMMM DD, YYYY');
      data.modifiedNice = moment(data.modified).format('MMMM DD, YYYY');
      data.ownerObject = Meteor.users.findOne({ _id: data.owner });
    }
    return data;
  }
});

// -----------------------------------
// -- Security
// -----------------------------------

Topic.canEdit = function(userId, doc) {
  console.log('canEdit', userId, doc);
  return (userId && doc.owner === userId);
};
Topic.allow({
  insert: function (userId, doc) {
    // the user must be logged in, and the document must be owned by the user
    console.log('Insert Topic', userId, doc);
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

Topic.deny({
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


if (Meteor.isClient) {
  AutoForm.addHooks(['insertTopicForm', 'updateTopicForm'], {
    onSubmit: function(insertDoc, updateDoc, currentDoc) {
      console.log('insertTopicForm.onSubmit', insertDoc, updateDoc, currentDoc);
    },

    // Called when any operation succeeds, where operation will be
    // "insert", "update", "remove", or the method name.
    onSuccess: function(operation, result, template) {
      console.log('onSuccess', operation, result, template, this);
      if (operation == 'insert') {
        FlashMessages.sendSuccess('Inserted Topic');
        Router.go('/topic/' + result);
        return;
      }
      FlashMessages.sendSuccess('Updated Topic');
      //don't know the topic _id :(
      //Router.go('/topic/' + result);
    },

    // Called when any operation fails, where operation will be
    // "validation", "insert", "update", "remove", or the method name.
    onError: function(operation, error, template) {
      console.error('onError', operation, error, template, this);
      FlashMessages.sendError('Error: ' + operation + ': ' + error);
    },

    // Called at the beginning and end of submission, respectively.
    // This is the place to disable/enable buttons or the form,
    // show/hide a "Please wait" message, etc. If these hooks are
    // not defined, then by default the submit button is disabled
    // during submission.
    beginSubmit: function(formId, template) {},
    endSubmit: function(formId, template) {}
  });
}

/**
 * get Topic
 * order by Vote-Count for a specific Meeting
 *
 */
Topic.findForMeeting = function(meetingId) {
  var mtg = Meeting.getMtg(meetingId);
  return Topic.find(
    {},
    { sort: {
      votesCurrent: -1,
      votesLife: -1,
      created: -1
    } }
  );
}

/**
 * this topic
 * - for current meeting only
 * - add all votes
 * - add to vote history
 *
 * @param string topicId
 * @return boolean
 */
Meteor.methods({
  topicUpdateLifetimeVotes: function(topicId) {
    var mtg = Meeting.current();
    var topic = Topic.findOne({ _id: topicId });

    // prep votesOld
    if (!_.has(topic, 'votesOld')) {
      topic.votesOld = 0;
    }

    // prep recent history
    if (!_.has(topic, 'votes')) {
      topic.votes = {};
    }
    if (mtg && !_.has(topic.votes, mtg._id)) {
      topic.votes[mtg._id] = 0;
    }

    // get count for current meeting
    if (mtg) {
      var count = Meeting.getTopicVotes(mtg, topicId);
      // store into recent history
      topic.votes[mtg._id] = count;
    }

    // limit to 6 recent history
    while (_.size(topic.votes) > 6) {
      var archiveMeetingId = _.first(_.keys(topic.votes));
      topic.votesOld = topic.votesOld + topic.votes[archiveMeetingId];
      delete(topic.votes[archiveMeetingId]);
    }

    // grand total
    // sum on all topic.votes.mtgIds
    var countRecent = _.reduce(topic.votes, function(memo, num) { return memo + num; }, 0);
    var total = countRecent + topic.votesOld;

    // save
    updated = Topic.update(
      { _id: topicId },
      { $set: {
        votesOld: topic.votesOld,
        votesCurrent: count,
        votesLife: total,
        votes: topic.votes
      } },
      { validate: false }
    );
    console.log('updated topic votes', updated, total, topic.votes);

    return true;
  }
});

/**
 * Because of the way we are storing Topic voting History
 * we want to massage it into a simple array of objects
 * for rendering
 *
 * @param string topicId
 * @return array history [{name:...,start:...,class:...,votes:....}]
 */
Topic.helperVoteHistory  = function(topicId) {
  var topic = Topic.findOne({ _id: topicId });
  if (!topic) {
    console.log('Topic Not Found');
    return [];
  }
  var mtg = Meeting.current();

  if (!_.has(topic, 'votes')) {
    console.log('Topic has no voting history');
    topic.votes = {};
  }

  // add current one to the list, if not there
  if (mtg && !_.has(topic.votes, mtg._id)) {
    topic.votes[mtg._id] = 0;
  }

  // create history
  var history = [];

  _.each(topic.votes, function(value, key, list) {
    var _mtg = Meeting.findOne({ _id: key });
    if (!_mtg) {
      return;
    }
    history.push({
      _id: _mtg._id,
      name: _mtg.name,
      start: moment(_mtg.start).format('MMM Do'),
      class: (mtg && _mtg._id == mtg._id ? "success" : "default"),
      votes: value
    });
  });

  // append lifetime
  history.push({
    name: "lifetime",
    start: null,
    class: "info",
    votes: (_.isNumber(topic.votesLife) ? topic.votesLife : 0)
  });


  return history;
};
