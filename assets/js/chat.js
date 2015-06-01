/*!
* chat.js
* This file contains the code for the chat logic
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

    var chat = {

		systemMsg: ['I don\'t mean to be rude, but you are talking to yourself...',
					'Are you sure you want to continue doing this?',
					'I have all the time in the world...',
					'OK, this is getting weird.',
					'Stop it now',
					'Please, go and tell somebody to join',
					'http://www.itsgoodtotalk.org.uk/therapists'],
		currentMsg: 0,

		init: function() {

			self = this;
		},

		triggerSendButton: function() {

			if ($('#message').val() !== '') {
				self.sendMessage(me.name, $('#message').val());

				$('#message').val('');
			}
		},

		writeMessage: function(senderName, message) {

			var textarea = $('#messages');
			var currentdate = new Date(); 
			var message = currentdate.getHours() + ":" + ('0' + currentdate.getMinutes()).slice(-2) + " " + senderName+': '+message+'\n';
			textarea.append(message);

			// Scroll to the bottom
		    if(textarea.length) {
				textarea.scrollTop(textarea[0].scrollHeight - textarea.height());
		   }
		},

		sendMessage: function(senderName, message) {

			if( $('#status-table tr').length > 2 ) {
				io.socket.post('/user/chat', {sender: senderName, msg: message});
			}
			else {
				self.writeMessage('System', self.systemMsg[self.currentMsg]);

				if (self.currentMsg < self.systemMsg.length -1) self.currentMsg++;
				else self.currentMsg = 0;
			}
		},

		receiveMessage: function(data) {
			self.writeMessage(data.from, data.msg);
		},

		updateStatus: function(data) {

			var $el = null;

			if (typeof data.id === 'string') {
				$el = $('#status-table').find('[data-status="'+data.id+'"]');
			}
			else {
				$el = $('#status-table').find('#user-'+data.id+' .status');
			}

			$el.attr('data-status', data.status).html(data.status);
			me.status = data.status;
			self.updateUI();
		},

		updateUI: function() {

			var readyPlayers = 0;

			$('#status-table tr').each(function() {
				
				if ($(this).find('.status').attr('data-status') === 'ready') {
					readyPlayers++;
				}
			});

		    if( readyPlayers > 1 ) {
		        $('#startQuiz').removeAttr('disabled');
		    }
		    else {
		    	$('#startQuiz').attr('disabled', 'disabled');
		    }
		},

		updateScore: function(data) {

			$('#question-winner').html(data.name + ' was the quickest to answer correctly');
			QW_MODULES.quiz.resolveQuestion();

			$('#status-table tr').each(function() {
		        var hasUser = $(this).attr('id');

		        if (hasUser !== undefined && ('user-' + data.id == hasUser)) {
		            var newScore = parseInt($(this).find('.score').html()) + 1;
		            $(this).find('.score').html(newScore);
		        }
		    });
		}
    };

	// return as QuizWars Module
    modules.chat = chat;
    return  modules;


})(QW_MODULES || {}, jQuery);