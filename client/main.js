import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';
import { Router } from '../client/lib/router';
import { ReactiveDict } from 'meteor/reactive-dict';

import { Questions } from '../imports/api/questions.js';
import '../imports/templates/templates.html';

Meteor.startup(function(){
    Router.addRoute('', 'play');
    Router.addRoute('/edit', 'edit');
    // Router.run();
});

function resetGame(){
	$("#summary:visible").fadeOut().promise()
		.done(()=> {
			Session.set('qNum', 0);
			Session.set('score', 0);
			resetButtons().promise().done(()=> {
				$('#question, #answers').fadeIn();
			});
		}).fail(()=>{
			Session.set('qNum', 0);
			Session.set('score', 0);
			resetButtons();
		});
}

function resetButtons(){
	return $('.btn-answer')
		.removeClass('active disabled btn-primary btn-danger btn-warning btn-info btn-success btn-default btn-secondary btn-primary')
		.addClass('btn-primary')
}

Template.mainNav.onRendered(function(){
	Router.run();
	resetGame();
});

const LOADING = '<i class="fa fa-spinner fa-pulse fa-fw margin-bottom"></i>'


var answerButtonCount = 0;

function subscribeToQuestions(...templates){
	templates.forEach((template)=>{
		template.onCreated(function(){
			// this.state = new ReactiveDict();
			// Meteor.subscribe('questions');
			this.autorun(() => {
				this.subscribe('questions');
			});
		})
	});
}

subscribeToQuestions(Template.answerButton, Template.question, Template.question, Template.edit);

function fetchQuestion(qNum) {
	qNum = qNum || Session.get('qNum');
    return Questions.find().fetch()[qNum];
}

function fetchAnswer(qNum, ansNum = 0) {
    return fetchQuestion(qNum || undefined).answers[ansNum];
}

function updateScore(delta){
	Session.set('score', Session.get('score')+delta);
	return Session.get('score');
}


Template.answerButton.onCreated(function() {
  this.ansText = function(){
  	if(Template.instance().subscriptionsReady()){
  		return fetchAnswer(null, this.data.ansNum-1).text;
  	} else {
  		return LOADING;
  	}
  	
  }
  this.isCorrect = function() {
  	if(Template.instance().subscriptionsReady()){
  		return fetchAnswer(null, this.data.ansNum-1).correct;
  	} else {
  		return LOADING;
  	}
    
  }

  answerButtonCount++;
});

Template.answerButton.helpers({
  counter() {
    return answerButtonCount;
  },
  ansText(ansNum) {
  	if(Template.instance().subscriptionsReady()){
  		return fetchAnswer(Session.get('qNum'), ansNum-1).text;
  	} else {
  		return LOADING;
  	}
  },});

Template.answerButton.events({
  'click button'(event, instance) {
  	var selectedBtn = $(event.target);

    $('.btn-answer').each(function(i, element){
    	var button = Blaze.getView(this).templateInstance();
    	var jqButton = $(this)
    		.removeClass('btn-primary btn-danger btn-warning btn-info btn-success btn-default btn-secondary btn-primary')
    		.addClass('disabled');

    	jqButton.addClass(button.isCorrect() ? 'btn-success' : '');
    	console.log(button.isCorrect());
    });
    selectedBtn.addClass('active').addClass(instance.isCorrect() ? 'btn-success' : 'btn-danger');

    // show feedback
    var feedback = $(`#${instance.isCorrect() ? 'positive' : 'negative'}-feedback`);
    // update score
    updateScore(instance.isCorrect());

    feedback.slideDown().alert().addClass('fade in').find('#next-question').one('click', function(event){
    	if(Session.get('qNum')+1 >= Questions.find().fetch().length) {
    		finishGame();
    	} else {
    		Session.set('qNum', Session.get('qNum')+1);
    		resetButtons();
    	}
    	feedback.fadeOut();
    });
  },
});

function finishGame(){
	$('#question, #answers').fadeOut().promise().done(function() {
	    Blaze.render(Template['gameOver'], $("#summary").empty()[0]);
	    $("#summary").fadeIn();
	});
}

Template.question.helpers({
  qNum() {
    return Session.get('qNum')+1;
  },
  qText(qNum = Session.get('qNum')) {
  	if(Template.instance().subscriptionsReady()){
  		return fetchQuestion(qNum).text;
  	} else {
  		return LOADING;
  	}
  },
});

Template.feedback.onRendered(function() {
	var feedback = this.$('.alert-feedback');
	feedback.hide(0);
});

Template.mainNav.helpers({
	isActiveLink(href){
		return window.location.pathname == href.hash.href ? 'active' : '';
	},
});

Template.gameOver.helpers({
	score(){
		return Session.get('score');
	},
	total(){
		return Questions.find().count();
	},
});

Template.gameOver.events({
  'click #restart'(event, instance) {
  	resetGame();
  }
});

Template.edit.helpers({
	noQuestions(){
		return Template.instance().subscriptionsReady() && Questions.find().fetch().length === 0;
	},
	loading(){
		return LOADING;
	},
	questions(){
		return Template.instance().subscriptionsReady() ? Questions.find().fetch() : false;
	},
});


Template.edit.events({
  'click .remove-question'(event, instance) {
  	var button = $(event.currentTarget);

  	console.log(button.attr('data-qid'));

  	if(Template.instance().subscriptionsReady()){
  		Meteor.call('questions.remove', button.attr('data-qid'));
  	}
  },
  'click #add-question'(event, instance) {
  	var button = $(event.target);
  	console.log(`Adding question #`, button.data())
  	if(Template.instance().subscriptionsReady()){
  		Meteor.call('questions.insert', "New question text", [
	  		{
	  			text: "Answer 1",
	  			correct: true,
	  		},
	  		{
	  			text: "Answer 2",
	  			correct: false,
	  		},
	  		{
	  			text: "Answer 3",
	  			correct: false,
	  		},
	  		{
	  			text: "Answer 4",
	  			correct: false,
	  		},
  		]);
  	}
  }
});

Template.answerField.helpers({
	ansNum(){
		return this.question.answers.indexOf(this.answer);
	}
});

Template.answerField.onRendered(function(){
	var _this = this;
	var answerTextInput = this.$('input[type="text"]');
	var answerCorrectInput = this.$('input[type="radio"]');
	var feedback = this.$('.form-control-feedback');

	answerTextInput.change(function(event){
		Meteor.call('questions.setAnswerText', _this.data.question._id, _this.data.question.answers.indexOf(_this.data.answer), $(this).val());
	});

	answerCorrectInput.change(function(event){
	  	Meteor.call('questions.setCorrectAnswer', _this.data.question._id, parseInt(answerCorrectInput.val()));
	});
});

Template.questionField.onRendered(function(){
	var _this = this;
	var questionTextInput = this.$('input[type="text"]');

	questionTextInput.change(function(event){
		Meteor.call('questions.setQuestionText', _this.data.question._id, $(this).val());
	});
});
