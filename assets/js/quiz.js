/*!
* quiz.js
* This file contains the code for the quiz logic
*
* @project   QUIZ WARS
* @date      2014-11-15
* @author    JOAN MIRA, SapientNitro <JMIRA@sapient.com>
* @licensor  SAPIENTNITRO LONDON INTERNAL PROJECT
*
*/

var QW_MODULES = (function (modules, $) {

    "use strict";

    var self;

    var quiz = {

    	jsonData: null,
		questions: [],
		current: 0,
		interval: 0,
		secondsToStart: 10,
		secondsToAnswer: 20,
		secondsToWait: 5,

		init: function() {

			self = this;

			// Request the available quizzes
			$.getJSON('/user/quizzes', function (data) {

				for( var i = 0; i < data.length; i++) {

					var filename = data[i];
					filename = filename.substring(filename.lastIndexOf("/")+1);

					$('#quiz-dropdown').append('<option value="' + filename + '">' + filename.slice(0, -5) + '</option>');
				}
			});
		},

		generateSequence: function() {

			// Get the quiz questions from the selected JSON file
			$.getJSON('/data/' + $('#quiz-dropdown :selected').val(), function (obj) {

				self.jsonData = obj;
				var size = obj.questions.length;
				var requestedSize = parseInt($('#amount').val());
				var sequence, dummyArray = [];

				// Limit the quiz size to the amount of available questions
				if (requestedSize > size) requestedSize = size;

				// Get an array with numbers as big as the json file
				for (var i = 0; i < size; i++) {
					dummyArray[i] = i;
				}

				// Shuffle the array and get a slice of it
				dummyArray = self.shuffle(dummyArray);
				sequence = dummyArray.slice(0, requestedSize);

				// Get the selected quiz
				var selectedQuiz = $('#quiz-dropdown :selected').val();
				
				io.socket.post('/user/start', {user: me.name, sequence: sequence, amount: requestedSize, quiz: selectedQuiz});
			});
		},

		loadQuiz: function(data) {

			$('#quiz').show();
			$('#changeStatus').hide();

			// Check if we still don't have the generated sequence of questions
			if (self.questions.length === 0) {
				self.questions = data.sequence;
			}

			// Set the selected quiz and amount of questions
			$('#quiz-dropdown option[value="'+data.quiz+'"]').attr("selected", "selected");
			$('#amount').val(data.amount);

			if (self.jsonData === null) {
				$.getJSON('/data/' + $('#quiz-dropdown :selected').val(), function (obj) {
					self.jsonData = obj;
					self.setupQuiz();
				});
			}
			else {
				self.setupQuiz();
			}
		},

		setupQuiz: function() {

			$('#questions tr').remove();
			$('#title').html(self.jsonData.title);
			$('#author').html('by ' + self.jsonData.author);
			$('#progress').attr('max', parseInt($('#amount').val()));
			$('#quiz-settings').hide();

			self.countDown($('#countdown'), self.secondsToStart, 'startQuiz');
		},

		countDown: function($el, secs, stage) {

			clearInterval(self.interval);
			self.interval = setInterval(function () {
		 		
		 		if (secs > 0) {
		 			$el.html(secs);
		 			secs--;
		 		}
		 		else {
		 			$el.html('');
		 			clearInterval(self.interval);
		 			self.countDownCallback(stage);
		 		}
			}, 1000);
		},

		countDownCallback: function(stage) {

			switch(stage) {

				case 'startQuiz': 		$('#countdown').removeClass('start');
										self.loadQuestion();
										break;

				case 'waitTime': 		$('#question-winner').html('Nobody answered correctly');
										self.resolveQuestion();
										break;

				case 'nextQuestion': 	self.loadQuestion();
										break;

				case 'winner': 			self.winner();
										break;
			}
		},

		loadQuestion: function() {

			$('#question').html('<strong>Question: </strong>' + self.jsonData.questions[self.questions[self.current]].question);
			$('#questions tr').remove();

		    $.each(self.jsonData.questions[self.questions[self.current]].answers, function (key, value) {
				$('#questions').append('<tr><td class="button"><input type="radio" name="answer" value="' + key + '"></td><td>' + value + '</td></tr>');
		    });

		    // Update status and countdown
		    $('#quiz-message').html('Seconds remaining to answer: ');
		    $('#question-winner').html('');
		    self.countDown($('#countdown'), self.secondsToAnswer, 'waitTime');
		},

		checkAnswer: function() {

			//This user cannot answer this question anymore
			$('#questions .button input').attr('disabled', 'disabled');

			var radioButtons = $("#questions input:radio[name='answer']");
			var selectedAnswer = radioButtons.index(radioButtons.filter(':checked'));
			
			var correctAnswer = self.jsonData.questions[self.questions[self.current]].correct_answer;

			if (selectedAnswer >= 0 && selectedAnswer === parseInt(correctAnswer)) {
				//We've got a winner. Broadcast it!
				io.socket.post('/user/score', {id: me.id});
			}
		},

		resolveQuestion: function() {

			$('#quiz-message').html('Next question in... ');
			$('#questions .button input').attr('disabled', 'disabled');

			var radioButtons = $("#questions input:radio[name='answer']");
			var selectedAnswer = radioButtons.index(radioButtons.filter(':checked'));
			
			var correctAnswer = self.jsonData.questions[self.questions[self.current]].correct_answer;
			$('#questions tr').eq(correctAnswer).addClass('success');

			if (selectedAnswer >= 0 && selectedAnswer !== parseInt(correctAnswer)) {
				$('#questions tr').eq(selectedAnswer).addClass('danger');
			}

			// Update questions index and gameplay
			var quizQuestions = parseInt($('#amount').val());

		    if (self.current < quizQuestions) {
		    	self.current++;
		    	$('#progress').val(self.current);

		    	if (self.current === quizQuestions) { //We reached the end of the quiz
		    		self.countDown($('#countdown'), self.secondsToWait, 'winner');
		    	}
		    	else {
		    		self.countDown($('#countdown'), self.secondsToWait, 'nextQuestion');
		    	}
		    }
		},

		winner: function() {

			$('#quiz').hide();
			$('#winner').show();

			var scores = [];
			var players = [];

			$('#status-table tbody tr').each(function() {
				scores.push(parseInt($(this).find('.score').html()));
				players.push($(this).find('.name').html());
			});

			var highScore = Math.max.apply(Math, scores);
			var scoreIndex = scores.indexOf(highScore);
			var isDraw = false;

			$('#status-table tbody tr').each(function(index) {
				if (parseInt($(this).find('.score').html()) === highScore && scoreIndex !== index) isDraw = true;
			});

			$('#winner-image').removeClass('no-one-wins');
			$('#winner-image').css('background-image', '');

			if (highScore > 0) {
				if (isDraw) {
					$('#winner-message').html('We have a draw. Well done!');
					$('#winner-image').addClass('no-one-wins');
				}
				else {
					$('#winner-message').html('And the winner is... <strong>' + players[scoreIndex] + '</strong>!');
					$('#winner-image').css('background-image', 'url("' + $('#status-table tbody tr').eq(scoreIndex).find('.name').attr('data-avatar') + '")');
				}
			}
			else {
				$('#winner-message').html('And the winner is... <strong>no one</strong> :-(');
				$('#winner-image').addClass('no-one-wins');
			}
		},

		shuffle: function(o) {
			//+ Jonas Raoni Soares Silva
			//@ http://jsfromhell.com/array/shuffle [v1.0]
		    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
		    return o;
		}
    };

	// return as QuizWars Module
    modules.quiz = quiz;
    return  modules;


})(QW_MODULES || {}, jQuery);