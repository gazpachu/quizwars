/*!
* events.js
* This file contains all the UI events logic
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

    var events = {

    	init: function() {

    		// Login / Signup events
			$('#login-cta').on('click', function() {
				$('#login').show();
				$('#signup').hide();
			});

			$('#signup-cta').on('click', function() {
				$('#login').hide();
				$('#signup').show();
			});

			// Chat and User events
			$('#message').keyup(function (event) {
			    if (event.keyCode == 13) {
			        QW_MODULES.chat.triggerSendButton();
			    }
			});

			$('#status-table').on('click', '#changeStatus', function() {
				var status = 'ready';

				if ($(this).parent().children('.status').attr('data-status') === 'ready') {
					status = 'online';
				}

				io.socket.post('/user/status', {id: me.id, status: status});
			});

			// Quiz events
			$('#rules-cta').on('click', function() {
				$('#rules').toggle();
			});

			$('#startQuiz').on('click', function() {

				QW_MODULES.chat.writeMessage('System', me.name + " started a quiz!");

				$('#quiz-settings').hide();
				$('#questions tr').remove();

				io.socket.post('/user/status', {id: 'ready', status: 'playing'});	
				
				QW_MODULES.quiz.generateSequence();
			});

			$('#questions').on('click', 'input[name="answer"]', function() {
				if ($(this).attr('disabled') !== 'disabled') {
					QW_MODULES.quiz.checkAnswer();
				}
			});
		}
	};

	// return as QuizWars Module
    modules.events = events;
    return  modules;


})(QW_MODULES || {}, jQuery);