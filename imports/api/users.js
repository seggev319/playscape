import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';

export const Users = new Mongo.Collection('users');

if (Meteor.isServer) {
  // This code only runs on the server
  // Only publish users that are public or belong to the current user
  Meteor.publish('users', function usersPublication() {
    return Users.find({
      $or: [
        { private: { $ne: true } },
        { owner: this.userId },
      ],
    });
  });
}

Meteor.methods({
  'users.insert'(text) {
    check(text, String);

    // Make sure the user is logged in before inserting a user
    if (! this.userId) {
      throw new Meteor.Error('not-authorized');
    }

    Users.insert({
      text,
      createdAt: new Date(),
      owner: this.userId,
      username: Meteor.users.findOne(this.userId).username,
    });
  },
  'users.remove'(userId) {
    check(userId, String);

    const user = Users.findOne(userId);
    if (user.private && user.owner !== this.userId) {
      // If the user is private, make sure only the owner can delete it
      throw new Meteor.Error('not-authorized');
    }

    Users.remove(userId);
  },
  /*
  'users.setChecked'(userId, setChecked) {
    check(userId, String);
    check(setChecked, Boolean);

    const user = Users.findOne(userId);
    if (user.private && user.owner !== this.userId) {
      // If the user is private, make sure only the owner can check it off
      throw new Meteor.Error('not-authorized');
    }

    Users.update(userId, { $set: { checked: setChecked } });
  },
  'users.setPrivate'(userId, setToPrivate) {
    check(userId, String);
    check(setToPrivate, Boolean);

    const user = Users.findOne(userId);

    // Make sure only the user owner can make a user private
    if (user.owner !== this.userId) {
      throw new Meteor.Error('not-authorized');
    }

    Users.update(userId, { $set: { private: setToPrivate } });
  },
  //*/
});