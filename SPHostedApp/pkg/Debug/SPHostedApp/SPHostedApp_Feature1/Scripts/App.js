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



// Provision With JavaScript on the App Web
(function () {
    var appUrl = GetUrlKeyValue("SPAppWebUrl");

    // Functions in Below Class in repository.js Enable us to Perform
    // Certain Actions Against SharePoint Sites
    var webRepo = new Pluralsight.Repositories.WebRepository();

    jQuery(function () {
        var message = $('#message');

        // Step 1: Check Whether Provisioning it's required
        var call = webRepo.getProperties(appUrl);
        call.done(function (data, textStatus, errorThrown) {
            var currentVersion = data.d['CurrentVersion']; // flag

            // Should return undefined or a Version
            // message.text("Current Version: "+currentVersion);

            // Get Ready to Provision
            if(SP.ScriptUtility.isNullOrEmptyString(currentVersion) == false){
                populateInterface();
            } else {
                var call = webRepo.getPermissions(appUrl);
                call.done(function (data, textStatus, jqXHR) {
                    var perms = new SP.BasePermissions();
                    perms.initPropertiesFromJson(data.d.EffectiveBasePermissions);
                    var manageWeb = perms.has(SP.PermissionKind.manageWeb);
                    var manageLists = perms.has(SP.PermissionKind.manageLists);

                    if ((manageWeb && manageLists) === false) {
                        message.text("A site Owner needs to Visit this site to enable Provisioning");
                    } else {
                        message.text("Provisioning content to App Web");

                        var prov = new Pluralsight.Provisioner(appUrl);
                        var call = prov.execute();
                        call.progress(function (msg) {
                            message.append("<br/>");
                            message.append(msg);
                        });
                        call.done(function () {
                            setTimeout(function () {
                                populateInterface();
                            }, 4000);
                        });
                        call.fail(failHandler);
                    }
                });
            }
        });
        call.fail(failHandler);
    }); // Document Ready

    function populateInterface() {
        var message = $('#message');
        message.text("Hello Alternate Dev");
    } // populateInterface()


    // Write any Errors We get When Working with REST
    // Handle Errors from REST API made by jQuery and CSOM
    function failHandler(errObj) {
        var response = "";
        if (errObj.get_message) {
            response = errObj.get_message();
        } else {
            try{
                var parsed = JSON.parse(errObj.responseText);
                response = parsed.error.message.value;
            } catch (Ex) {
                response = errObj.responseText;
            }
        }
        alert("Call failed. Error: " + response);
    } // failHandler
})();
