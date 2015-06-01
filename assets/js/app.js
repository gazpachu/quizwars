/*!
* app.js
* This file is the entry point of the app logic
*
* @project   QUIZ WARS
* @date      2014-11-15
* @author    JOAN MIRA, SapientNitro <JMIRA@sapient.com>
* @licensor  SAPIENTNITRO LONDON INTERNAL PROJECT
*
*/

io.socket.on('connect', function socketConnected() {

    QW_MODULES.chat.init();
    QW_MODULES.quiz.init();
    QW_MODULES.user.init();
    QW_MODULES.events.init();

    io.socket.on('hello', function(data) {

        if (data) {
            window.me = data;

            io.socket.get('/user', QW_MODULES.user.updateUserList);
            io.socket.post('/user/chat', {sender: 'System', msg: data.name + ' joined'});
        }
    });

    io.socket.on('user', function messageReceived(message) {

        switch (message.verb) {
            case 'created': QW_MODULES.user.addUser(message.data); break;
            case 'destroyed': QW_MODULES.user.removeUser(message.id); break;
            default: break;
        }
    });

    io.socket.on('chat', function messageReceived(message) {

        switch (message.verb) {
            case 'messaged': QW_MODULES.chat.receiveMessage(message.data); break;
            case 'changedStatus': QW_MODULES.chat.updateStatus(message.data); break;
            case 'score': QW_MODULES.chat.updateScore(message.data); break;
            default: break;
        }
    });

    io.socket.on('quiz', function messageReceived(message) {

        switch (message.verb) {
            case 'startQuiz': QW_MODULES.quiz.loadQuiz(message.data); break;
            default: break;
        }
    });
});

io.socket.on('disconnect', function() {
    io.socket.post('/user/chat', {sender: 'System', msg: me.name + ' left'});
});