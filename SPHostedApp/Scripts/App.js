'use strict';


(function () {
    $(function () {
        ExecuteOrDelayUntilScriptLoaded(initializePage, 'sp.js');
    });

    // Get App Web Resources using CSOM
    function initializePage() {
        var context = SP.ClientContext.get_current();

        var rootFolder = context.get_web().get_rootFolder();
        var folders = rootFolder.get_folders();

        var myFolders = context.loadQuery(folders, "Include(Name, Files)");
        context.executeQueryAsync(success, fail);

        function success() {
            var message = $('#message');
            message.text("");

            // iterate through the folders collection
            // NB: value rep individual Folder
            $.map(myFolders, function (value, index) {
                showFiles(message, value);
            });
        }

        function fail(sender, args) {
            alert("Call failed in initializePage(). Error: " + args.get_message());
        }

        // ShowFiles Function
        function showFiles(message, folder) {
            var fenum = folder.get_files().getEnumerator();
            var i = 0;
            while (fenum.moveNext()) {
                i++;
                // Ensure Atleast a Folder has a File
                if (i == 1) {
                    message.append(folder.get_name()+ ":");
                }

                // return the current file Object(i.e. fileName)
                var name = fenum.get_current().get_name();
                message.append("<div style='padding-left:10px'>" + name + "</div>");
            } // while loop

            if (i > 0) {
                message.append("<br />");
            }
        } // ShowFiles()

    } // initializePage()
})();
