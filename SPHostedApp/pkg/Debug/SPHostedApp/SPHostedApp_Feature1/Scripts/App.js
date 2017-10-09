'use strict';


(function () {
    $(function () {
        ExecuteOrDelayUntilScriptLoaded(initializePage, 'sp.js');
    });

    // Get App Web Resources using CSOM
    function initializePage() {
        var hostUrl = GetUrlKeyValue("SPHostUrl");

        var context = SP.ClientContext.get_current();
        var hostContext = new SP.AppContextSite(context, hostUrl);
        var web = hostContext.get_web();

        var rootFolder = hostContext.get_web().get_rootFolder();
        var folders = rootFolder.get_folders();
        var myFolders = context.loadQuery(folders, "Include(Name, Files)");
        context.executeQueryAsync(success, fail);

        function success() {
            var message = jQuery("#message");
            /*message.text("");
            jQuery.each(myFolders, function (index, value) {
                showFiles(message, value);
            });*/
        }

        function fail(sender, args) {
            alert("Call failed. Error: " +
                args.get_message());
        }

        /*function showFiles(message, folder) {
            var fenum = folder.get_files().getEnumerator();
            var i = 0;
            while (fenum.moveNext()) {
                i += 1;
                if (i == 1) {
                    message.append(folder.get_name() + ":");
                }

                var name = fenum.get_current().get_name();
                message.append("<div style='padding-left:10px'>" + name + "</div>");
            }
            if (i > 0) {
                message.append("<br/>");
            }
        }*/
    }// initializePage

})();
