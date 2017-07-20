import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';

export const Questions = new Mongo.Collection('questions');

if (Meteor.isServer) {
  Meteor.publish('questions', function questionsPublication() {
    return Questions.find();
  });
}

Meteor.methods({
  'questions.insert'(text, answers) {
    check(text, String);

    Questions.insert({
      _id: new Mongo.ObjectID(),
      text,
      answers
    });
  },
  'questions.remove'(questionId) {
    check(questionId, String);
    const question = Questions.findOne(new Mongo.ObjectID(questionId));
    Questions.remove(new Mongo.ObjectID(questionId));
  },
  'questions.setAnswerText'(questionId, answerNum, text) {
    questionId = (typeof questionId === 'string') ? new Mongo.ObjectID(questionId) : questionId;
    check(text, String);
    check(answerNum, Number);

    console.log( Questions.update(questionId, { $set: { [`answers.${answerNum}.text`]: text } }) );
  },
  'questions.setCorrectAnswer'(questionId, answerNum) {
    questionId = (typeof questionId === 'string') ? new Mongo.ObjectID(questionId) : questionId;
    check(answerNum, Number);

    const question = Questions.findOne(questionId);
    const currentCorrectAnswer = question.answers.reduce((correctAnswer, answer)=>{
      if(answer.correct){
        correctAnswer = answer;
      }
      return correctAnswer;
    }, null);

    Questions.update(questionId, { $set: {
      [`answers.${question.answers.indexOf(currentCorrectAnswer)}.correct`]: false,
      [`answers.${answerNum}.correct`]: true
    } });
  },
  'questions.setQuestionText'(questionId, text) {
    questionId = (typeof questionId === 'string') ? new Mongo.ObjectID(questionId) : questionId;
    check(text, String);

    console.log( Questions.update(questionId, { $set: { text } }) );
  },
});