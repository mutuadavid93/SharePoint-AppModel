'use strict';


(function () {
    
    // ###############################################
    // ## BEGIN PROVISIONING WEB PART FILES SECTION ##
    // ###############################################

    var myAppUrl = GetUrlKeyValue("SPAppWebUrl");
    var myHostUrl = GetUrlKeyValue("SPHostUrl");

    jQuery(document).ready(function(){
        jQuery('#addWebPartFilesButton').click(addWebPartFiles);
        jQuery('#removeWebPartFilesButton').click(removeWebPartFiles);
    }); // document ready

    function addWebPartFiles() {
        // Ensure we have a Valid FormDigest
        UpdateFormDigest(_spPageContextInfo.webServerRelativeUrl, _spFormDigestRefreshInterval);

        // NB: You can as well check if current_user has Perms to add Files to HostWeb here
        // then Disabling the Button if they Don't

        // Call1: Read the File databinding.txt out of the WebPartContent in the AppWeb 
        // and copy it to SiteAssets in the HostWeb.
        var call1 = copyFile("WebPartContent", "Site Assets", "databinding.txt");

        // After the file has been uploaded, invoke updateWebPartGroup()
        var webPartFileName = "databinding.dwp";
        var call2 = getFile("WebPartContent", webPartFileName) // get the File Contents
            .then(updateContentLink) // invoke updateContentLink() which returns updated fileContents
            .then(function (fileContents) { return uploadFile(fileContents, "Web Part Gallery", webPartFileName) }) // fileContents get passed to anonymous function
            .then(updateWebPartGroup); // then update updateWebPartGroup()

        var calls = jQuery.when(call1, call2);
        calls.done(function (response1, response2) {
            var message = jQuery('#webpart_message');
            message.text("Web Part files copied");
        });
        calls.fail(failHandlerTwo);
    } // addWebPartFiles()


    // DELETING THE WEBPART FILES
    function removeWebPartFiles(event) {
        event.preventDefault();
        // Ensure we have a Valid FormDigest
        UpdateFormDigest(_spPageContextInfo.webServerRelativeUrl, _spFormDigestRefreshInterval);

        // Delete databinding.txt and databinding.dwp Files from HostWeb.
        var call1 = deleteFile("Site Assets", "databinding.txt");
        var call2 = deleteFile("Web Part Gallery", "databinding.dwp");
        var calls = jQuery.when(call1, call2);
        calls.done(function (response1, response2) {
            var message = $('#webpart_message');
            message.text("Web Part files Removed");
        });
        calls.fail(failHandlerTwo);
    } // removeWebPartFiles()


    // Step 1: Read the files' Content out of the AppWeb
    // Step 2: Add a new file with the Contents Read from Step 1

    function getFile(sourceFolder, fileName) {
        // Get the Relative Path to the File in the AppWeb
        var fileUrl = String.format("{0}/{1}/{2}",
            _spPageContextInfo.webServerRelativeUrl, sourceFolder, fileName);

        // Now Ask for the Content of the File i.e. $value Parameter.
        var call = jQuery.ajax({
            url: myAppUrl + "/_api/Web/GetFileByServerRelativeUrl('" + fileUrl + "')/$value",
            type: "GET",
            headers: {
                Accept: "text/plain"
            }
        });

        return call;
    } // getFile()

    function uploadFile(fileContents, targetLibrary, fileName) {
        // Add a new File to the Document Library in HostWeb,
        // And if it Exists Overwrite it.
        var url = String.format("{0}/_api/SP.AppContextSite(@target)" + 
            "/Web/Lists/getByTitle('{1}')/RootFolder/Files/Add(url='{2}', overwrite=true)?@target='{3}'",
            myAppUrl, targetLibrary, fileName, myHostUrl);

        var call = jQuery.ajax({
            url: url,
            type: "POST",
            data: fileContents,
            processData: false,
            headers: {
                "accept": "application/json;odata=verbose",
                "X-RequestDigest": $("#__REQUESTDIGEST").val(),
                "content-length": fileContents.length
            }
        });

        return call;
    } // uploadFile()

    // A helper Function
    function copyFile(sourceFolder, targetLibrary, fileName) {
        // Read the contents of the File.
        // Then create the new File in the HostWeb i.e. using uploadFile()
        var call = getFile(sourceFolder, fileName)
            .then(function (fileContents) { return uploadFile(fileContents, targetLibrary, fileName) })

        return call;
    } // copyFile()


    // NB: data Param represents the response comming back from the call to 
    // upload the File.
    function updateWebPartGroup(data) {
        var file = data.d;
        // Build up the request to get the ListItem i.e. ListItemAllFields,
        // Associated with the File that just got created.
        var url = String.format("{0}/_api/SP.AppContextSite(@target)"+
            "/Site/RootWeb/GetFileByServerRelativeUrl('{1}')/ListItemAllFields?"+
            "@target='{2}'",
            myAppUrl, file.ServerRelativeUrl, myHostUrl);

        var call = jQuery.ajax({
            url: url,
            type: "POST",
            data: JSON.stringify({
                "__metadata": { type: "SP.Data.OData__x005f_catalogs_x002f_wpItem" },
                Group: "App Script Part"
            }),
            headers: {
                "accept": "application/json;odata=verbose",
                "Content-Type": "application/json;odata=verbose",
                "X-RequestDigest": $("#__REQUESTDIGEST").val(),
                "IF-MATCH": "*",
                "X-Http-Method": "PATCH"
            }
        });
    } // updateWebPartGroup()


    // Generate the token to Replace it the with the right URL
    function updateContentLink(fileContents) {
        var def = new jQuery.Deferred();

        var fileUrl = myHostUrl + "/SiteAssets/databinding.txt";
        fileContents = fileContents.replace("{ContentLink}", fileUrl);
        def.resolve(fileContents);

        return def.promise();
    } // updateContentLink() 


    function deleteFile(targetLibrary, fileName) {
        var url = String.format("{0}/_api/SP.AppContextSite(@target)"+
            "/Site/RootWeb/Lists/getByTitle('{1}')/RootFolder/Files('{2}')?@target='{3}'",
            myAppUrl, targetLibrary, fileName, myHostUrl);

        var call = jQuery.ajax({
            url: url,
            type: "POST",
            headers: {
                "accept": "application/json;odata=verbose",
                "X-RequestDigest": $("#__REQUESTDIGEST").val(),
                "IF-MATCH": "*",
                "X-Http-Method": "DELETE"
            }
        });

        return call; // return the call implementation
    } // deleteFile()

    function failHandlerTwo(jqXHR, textStatus, errorThrown) {
        var response = "";
        try{
            var parsed = JSON.parse(jqXHR.responseText);
            response = parsed.error.message.value;
        } catch (Ex) {
            response = jqXHR.responseText;
        }
        alert("Call failed. Error: " + response);
    }

    // ###############################################
    // ## END PROVISIONING WEB PART FILES SECTION ##
    // ###############################################

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
    var hostUrl = GetUrlKeyValue("SPHostUrl");

    // Functions in Below Class in repository.js Enable us to Perform
    // Certain Actions Against SharePoint Sites
    var webRepo = new Pluralsight.Repositories.WebRepository();

    jQuery(function () {
        var message = $('#message');

        // Step 1: Check Whether Provisioning it's required
        var call = webRepo.getProperties(appUrl); // Get the Properties from the "Property Bag" in the AppWeb
        call.done(function (data, textStatus, errorThrown) {
            var currentVersion = data.d['CurrentVersion']; // flag

            // Should return undefined or a Version
            // message.text("Current Version: "+currentVersion);

            // Get Ready to Provision
            if(SP.ScriptUtility.isNullOrEmptyString(currentVersion) == false){
                populateInterface(); // invoke if there is no need to Provision
            } else {
                var call1 = webRepo.getPermissions(appUrl);// Get User perms for AppWeb
                var call2 = webRepo.getPermissions(appUrl, hostUrl); // Get User perms for HostWeb

                var calls = jQuery.when(call1, call2); // Kick off the two calls
                calls.done(function (appResponse, hostResponse) {

                    // Step 2: Check Permissions for the Current User
                    // i.e. manageLists Perms, To create our Lists in the hostWeb Context
                    // and  manageWeb Perms, To update the "Property Bag" for the AppWeb
                    var appPerms = new SP.BasePermissions();
                    appPerms.initPropertiesFromJson(appResponse[0].d.EffectiveBasePermissions);
                    var hostPerms = new SP.BasePermissions();
                    hostPerms.initPropertiesFromJson(hostResponse[0].d.EffectiveBasePermissions);
                    var manageWeb = appPerms.has(SP.PermissionKind.manageWeb);
                    var manageLists = hostPerms.has(SP.PermissionKind.manageLists);

                    if ((manageWeb && manageLists) === false) {
                        message.text("A site Owner needs to Visit this site to enable Provisioning");
                    } else {
                        message.text("Provisioning content to App Web");

                        // Create an Instance of Our Provisioner Class.
                        // NB: in the Context of the hostWeb.
                        var prov = new Pluralsight.Provisioner(appUrl, hostUrl);

                        // Start the Provisioning Process
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
        // Show Data from the Products List
        // Get the ProductRepository. NB: in the hostWeb Context
        var prodRepo = new Pluralsight.Repositories.ProductRepository(appUrl, hostUrl);
        var call = prodRepo.getProductsByCategory("Beverages"); // returns a jQuery Promise
        call.done(function (data, textStatus, jqXHR) {
            var message = $('#message');
            message.text("Products:");
            $.map(data.d.results, function (value, index) {
                message.append("<br />");
                message.append(value.Title);
            }); // end map loop
        });
        call.fail(failHandler);
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
