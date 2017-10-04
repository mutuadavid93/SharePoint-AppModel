'use strict';


(function () {
    $(function () {
        ExecuteOrDelayUntilScriptLoaded(initializePage, 'sp.js');
    });

    function initializePage() {
        var context = SP.ClientContext.get_current();
        var user = context.get_web().get_currentUser();

        context.load(user);
        context.executeQueryAsync(success, fail);

        function success() {
            var message = $('#message');
            message.text("Hello " + user.get_title());
        }

        function fail(sender, args) {
            alert("Call failed in initializePage(). Error: " + args.get_message());
        }
    } // initializePage()
})();
