Meeting = new Meteor.Collection('meetings', {
  schema: {
    name: {
      type: String,
      label: "Meeting Name",
      index: true,
      min: 2,
      max: 180
    },
    start: {
      type: Date,
      label: "Timestamp",
      index: true,
      unique: true
    },
    duration: {
      type: Number,
      label: "Duration in Minutes (60 = 1 hour)"
      /*
         options: {
         15: '15 min',
         30: '30 min',
         45,
         60,
         75,
         90,
         105,
         120,
         150,
         180
         }
         */
    },
    location: {
      type: String,
      label: "Location Name",
      index: true,
      min: 2,
      max: 180
    },
    locationAddress: {
      type: String,
      label: "Location Address (mappable)",
      optional: true,
      max: 180
    },
    votes: {
      type: Object,
      label: "Full History of Votes {topicId:{userId:votes}}",
      optional: true,
      autoValue: function() {
        console.log('autoValue:Meeting:votes', this);
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
    }
  },
  transform: function(data) {
    if (Meteor.isClient) {
      data.createdNice = moment(data.created).format('MMMM DD, YYYY');
      data.startNice = moment(data.start).format('MMMM DD, YYYY @ HH:mm');
      data.stopNice = moment(data.start).add('minutes', data.duration).format('HH:mm');
    }
    return data;
  }
});

// -----------------------------------
// -- Security
// -----------------------------------

Meeting.canEdit = function(userId, doc) {
  console.log('canEdit', userId, doc);
  return (userId && doc.owner === userId);
};
Meeting.allow({
  insert: function (userId, doc) {
    // the user must be logged in, and the document must be owned by the user
    console.log('Insert Meeting', userId, doc);
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

Meeting.deny({
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

// get current Meeting,
// if one doesn't exist, create it according to rules
Meeting.current = function() {
  var mtg = Meeting.currentGet();
  if (!mtg) {
    // no current meeting found...
    //   attempt to create it on the server (maybe)
    //   (might not be on client subscribtion yet)

    /* blocking, since no callback */
    Meteor.call('meetingCurrentCreate');

    // we either just created a new meeting or confirmed it exists...
    //   (we should get it from the subscribtion now)
    mtg = Meeting.currentGet();
  }
  if (!mtg) {
    console.log('current: mtg=', mtg);
    throw new Meteor.Error(403, "current: unable to get/create a current Meeting");
  }
  return mtg;
};

// get the "next" meeting in the future from yesterday
Meeting.currentGet = function() {
  var yesterday = moment().subtract('days', 1).endOf('day').toDate();
  return Meeting.findOne(
    { start: { $gt: yesterday } },
    { sort: { start: 1 } }
  );
};


/**
 * get a mtg record (findOne helper)
 *  - uses input if not empty
 *  - if not found or not valid, gets or makes current
 *
 * @param mixed mtg (null, _id, mtg)
 * @return object mtg
 */
Meeting.getMtg = function(mtg) {
  if (_.isEmpty(mtg)) {
    return Meeting.current();
  }
  if (_.isString(mtg)) {
    mtg = Meeting.findOne({_id: mtg});
  }
  if (_.isObject(mtg) && _.has(mtg, 'start')) {
    return mtg;
  }
  return Meeting.current();
}

/**
 * is a meeting votable?
 *
 * @param mixed mtg (null, _id, mtg)
 * @return object mtg
 */
Meeting.isVoteable = function(mtg) {
  var mtg = Meeting.current();
  return moment(mtg.start).isAfter(moment().endOf('day'));
}

/**
 * this meeting's total amount of votes cast on this topicId
 *
 * @param mixed mtg (null, _id, mtg)
 * @param string topicId
 * @return int
 */
Meeting.getTopicVotes = function(mtg, topicId) {
  var mtg = Meeting.current();
  if (!mtg) {
    throw new Meteor.Error(404, 'Unable to Find Current Meeting');
    return false;
  }
  if (!_.has(mtg, 'votes')) {
    return 0;
  }
  if (!_.has(mtg.votes, topicId)) {
    return 0;
  }
  // sum on all userIds in: mtg.votes[topicId][userId]
  return _.reduce(mtg.votes[topicId], function(memo, num) { return memo + num; }, 0);
};


/**
 * this meeting's total amount of votes cast by this userId (on all topics)
 *
 * @param mixed mtg (null, _id, mtg)
 * @param string userId
 * @return int
 */
Meeting.getUserVotes = function(mtg, userId) {
  var mtg = Meeting.current();
  if (!mtg) {
    throw new Meteor.Error(404, 'Unable to Find Current Meeting');
    return false;
  }
  if (!_.has(mtg, 'votes')) {
    return 0;
  }
  var votes = 0;

  // mtg.votes[topicId][userId] = votesCast
  _.each(mtg.votes, function(userVotes, topicId, list) {
    if (!_.has(userVotes, userId)) {
      return;
    }
    // sanity checking, missing topic
    if (Topic.find({_id: topicId}).count() == 0) {
      if (Meteor.isServer) {
        Meeting.clearUserVotesOnTopic(mtg, userId, topicId);
      }
      return;
    }
    // sanity checking, bad values
    if (!_.isNumber(userVotes[userId]) || userVotes[userId] < 1) {
      Meeting.clearUserVotesOnTopic(mtg, userId, topicId);
      return;
    }
    votes = votes + parseInt(userVotes[userId]);
  });

  return votes;
};

/**
 * this meeting's subtract:
 *  - total amount of votes allowed for userId
 *  - by
 *  - total amount of votes cast by this userId (on all topics)
 *
 * @param mixed mtg (null, _id, mtg)
 * @param string userId
 * @return int
 */
Meeting.getUserVotesAllowed = function(mtg, userId) {
  // TODO: can make dynamic or something
  var votesAllowedTotal = 10;
  var votesCast = Meeting.getUserVotes(mtg, userId);
  var votesAllowed = (votesAllowedTotal - votesCast);
  if (votesAllowed < 1) {
    return 0;
  }
  return votesAllowed;
};

/**
 * this meeting's total amount of votes by this userId on this topicId
 *
 * @param mixed mtg (null, _id, mtg)
 * @param string userId
 * @param string topicId
 * @return int
 */
Meeting.getUserVotesOnTopic = function(mtg, userId, topicId) {
  var mtg = Meeting.getMtg(mtg);
  if (!mtg) {
    throw new Meteor.Error(404, 'Unable to Find Current Meeting');
    return 0;
  }
  if (!_.has(mtg, 'votes')) {
    return 0;
  }
  if (!_.has(mtg.votes, topicId)) {
    return 0;
  }
  if (!_.has(mtg.votes[topicId], userId)) {
    return 0;
  }
  return mtg.votes[topicId][userId];
};

/**
 * this meeting
 * - for a userId
 * - remove user's votes on a topicId
 *
 * @param mixed mtg (null, _id, mtg)
 * @param string userId
 * @param string topicId
 * @return boolean
 */
Meeting.clearUserVotesOnTopic = function(mtg, userId, topicId) {
  Meteor.call('meetingClearUserVotesOnTopic', mtg, userId, topicId);
};

/**
 * this meeting
 * - for a userId
 * - vote on a topicId
 *
 * @param mixed mtg (null, _id, mtg)
 * @param string userId
 * @param string topicId
 * @param int votesCast amount of votes to cast
 * @return boolean
 */
Meeting.setUserVotesOnTopic = function(mtg, userId, topicId, votesCast) {
  Meteor.call('meetingSetUserVotesOnTopic', mtg, userId, topicId, votesCast);
};


// -----------------------------------
// -- Secure Meteor Methods Here
// -----------------------------------

Meteor.methods({
  /**
   * create the "next" meeting according to rules
   * NOTE: if we need to customize how often Meetings are created, we will need
   * to change these rules
   */
  meetingCurrentCreate: function() {
    // get the MeetingGroup Template for the Meeting
    // TODO: make a MeetingGroup Collection w/ Rules and Defaults
    var meetingGroup = {
      /* defaults for meeting */
      name: "KYOSS Meeting",
      short: "Come and join us! We usually have between 15 and 30 Linux users, admins, and programmers show up. Good conversation and networking and, often, a great presentation or two.",
      location: "LVL1 Hackerspace",
      locationAddress: "The Pointe in Butchertown, 1205 E Washington Street; Louisville, KY 40206",
      start: moment(start).toDate(),
      duration: 120,
      /* scheudling rules */
      /* rules: "second Wednesday of the Month" */
      wom: 2,      /* week of month: 1-5 */
      dow: 3,      /* day of week: 0=Sun, 6=Sat */
      todHour: 19, /* time of day: hour in 24hr format */
      todMin: 00   /* time of day: minutes */
    };

    // get the last "start"
    var last = Meeting.findOne(
      {},
      { sort: { start: 1 } }
    );
    if (!last || !last.start) {
      var start = moment().startOf('month');
    } else {
      var start = moment(last.start).add(25, 'days');
    }

    // double-check to ensure we are not starting too far in the future
    //   start should be either in last month, or in this month
    if (parseFloat(moment.version) >= 2.7) {
      start = moment.min(moment(start), moment().endOf('month'));
    } else {
      start = moment(start).max(moment().endOf('month'));
    }

    // incriment days until it matches rules
    for (var i=0; i<35; i++) {
      // current:
      wom = Math.ceil(moment(start).date() / 7);
      dow = moment(start).weekday();

      // check
      if (wom == meetingGroup.wom && dow == meetingGroup.dow) {
        break;
      }

      // incriment
      start = moment(start).add('day', 1);
      console.log('currentCreate+1day:', moment(start).format());
    }

    console.log('currentCreate:result:', moment(start).format());

    // double-check to ensure we are not starting too far in the future
    //   start should be less than 2 months in the future
    if (!moment(start).isBefore(moment().add('months', 2).endOf('month'))) {
      console.log('currentCreate: bad start, too far in future', moment(start).format());
      throw new Meteor.Error(403, "Unable to create a new current Meeting: invalid start date");
    }

    // setup data for insertion
    var data = _.omit(meetingGroup, '_id', 'created', 'modified', 'dow', 'wom');
    //data.name = data.name + ' (' + moment(start).format('dddd, MMMM Do YYYY, h:mm:ss a') + ')';
    // assign start time of day
    start = moment(start).hour(meetingGroup.todHour).minute(meetingGroup.todMin);
    // assign start
    data.start = moment(start).toDate();

    // does this meeting already exist?
    var exists = Meeting.findOne(
      { start: {
        $gte: moment(data.start).subtract(1, 'day').toDate(),
        $lte: moment(data.start).add(1, 'day').toDate()
      } },
      { sort: { start: 1 } }
    );
    if (!exists || !exists.start) {

      // save new Meeting (current)
      Meeting.insert(data);
    }

    return true;
  },

  /**
   * this meeting
   * - for a userId
   * - remove user's votes on a topicId
   *
   * @param mixed mtg (null, _id, mtg)
   * @param string userId
   * @param string topicId
   * @return boolean
   */
  meetingClearUserVotesOnTopic: function(mtg, userId, topicId) {
    var mtg = Meeting.getMtg(mtg);
    if (!mtg) {
      throw new Meteor.Error(404, 'Unable to Find Current Meeting');
    }

    // allowed to vote?
    if (Meteor.userId() != userId && !isAdmin(Meteor.userId())) {
      throw new Meteor.Error(403, 'Unable to vote for someone else');
    }

    // force votesCast == 0
    var votesCast = 0;

    // add votes to this meeting
    if (!_.has(mtg, 'votes')) {
      return true;
    }
    if (!_.has(mtg.votes, topicId)) {
      return true;
    }

    // remove this userId from votes for this topic
    mtg.votes[topicId] = _.omit(mtg.votes[topicId], userId);

    // save
    updated = Meeting.update(
      { _id: mtg._id },
      { $set: { votes: mtg.votes } },
      { validate: false }
    );
    console.log('updated', updated);

    // update topic's votesLife
    updated = Meteor.call('topicUpdateLifetimeVotes', topicId);
    console.log('updated', updated);
  },

  /**
   * this meeting
   * - for a userId
   * - vote on a topicId
   *
   * @param mixed mtg (null, _id, mtg)
   * @param string userId
   * @param string topicId
   * @param int votesCast amount of votes to cast
   * @return boolean
   */
  meetingSetUserVotesOnTopic: function(mtg, userId, topicId, votesCast) {
    var mtg = Meeting.getMtg(mtg);
    if (!mtg) {
      throw new Meteor.Error(404, 'Unable to Find Current Meeting');
    }

    // allowed to vote?
    if (Meteor.userId() != userId && !isAdmin(Meteor.userId())) {
      throw new Meteor.Error(403, 'Unable to vote for someone else');
    }

    console.log('meetingSetUserVotesOnTopic: starting for ' +
                'meetingId[' + mtg._id + '] ' +
                'userId[' + userId + '] ' +
                'topicId[' + topicId + '] ' +
                'votesCast[' + votesCast + ']')

    // limit user's votesCast to allowed
    var votesCastAllowed = Meeting.getUserVotesAllowed(userId);
    if (votesCast > votesCastAllowed) {
      console.log('meetingSetUserVotesOnTopic: limiting votes for user[' + userId + '] ' +
                  'from [' + votesCast + '] ' +
                  'to [' + votesCastAllowed + ']');
      votesCast = votesCastAllowed;
    }

    // add votes to this meeting
    if (!_.has(mtg, 'votes')) {
      mtg.votes = {}
    }
    if (!_.has(mtg.votes, topicId)) {
      mtg.votes[topicId] = {}
    }
    mtg.votes[topicId][userId] = votesCast
    console.log('updating meeting votes', mtg._id, mtg.votes);

    var fieldKey = 'votes.' + topicId + '.' + userId + '';
    var setData = {};
    setData[fieldKey] = votesCast;
    console.log('updating meeting votes ' +
                'meetingId[' + mtg._id + '] ' +
                '{ $set: ' + JSON.stringify(setData) + ' }');

    // save on meeting
    updated = Meeting.update(
      { _id: mtg._id },
      { $set: setData },
      { validate: false }
    );
    console.log('updated meeting votes', updated, mtg.votes);
    after = Meeting.findOne(
      { _id: mtg._id }
    );
    console.log('updated after', after);

    // update topic's lifetimevotes
    updated = Meteor.call('topicUpdateLifetimeVotes', topicId);
    console.log('updated topics (callback)', updated);

    return true;
  }
});

