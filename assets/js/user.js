/*!
* user.js
* This file contains the code for the user logic
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

    var user = {

        init: function() {

            self = this;
        },

        // Add a user to the list of available users to play with
        addUser: function(user) {

            var found = false;

            // Check if the user is already in the table
            $('#status-table tr').each(function() {
                var hasUser = $(this).attr('id');

                if (hasUser !== undefined && ('user-' + user.id == hasUser)) {
                    found = true;
                }
            });

            if (!found) {
                var $table = $('#status-table');
                var ready = (user.id == me.id) ? '<button type="button" id="changeStatus" class="btn btn-default btn-xs">change</button>' : '';
                var row = '<tr id="user-'+user.id+'"><td class="name" data-avatar="'+user.avatar+'">'+user.name+'</td><td><img class="flag" src="http://api.hostip.info/flag.php?ip='+user.ip+'" width="20" height="14" alt=""><span class="status" data-status="'+user.status+'">'+user.status+'</span>'+ready+'</td><td class="score">'+user.score+'</td></tr>';
                $table.append(row);
                
                QW_MODULES.chat.updateUI();
            }
        },

        // Remove a user from the table of available users to play with, by sending
        // either a user object or a user ID.
        removeUser: function(user) {

            // Get the user's ID.
            var id = user.id || user;
            var userName = $('#user-'+id).text();

            // Remove the corresponding element from the users table
            var userEl = $('#user-'+id).remove();

            QW_MODULES.chat.updateUI();
        },

        // Add multiple users to the users list.
        updateUserList: function(users) {

            $('#status-table tbody tr').remove();

            users.forEach(function(user) {
                
                if ((typeof user.id === 'undefined') || (user.status === 'offline') || (typeof me === 'undefined')) {
                    return;
                }

                self.addUser(user);
            });
        }
    };

    // return as QuizWars Module
    modules.user = user;
    return  modules;


})(QW_MODULES || {}, jQuery);