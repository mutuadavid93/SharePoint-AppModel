
// Create an Object that represents the Pluralsight Namespace
window.Pluralsight = window.Pluralsight || {};

// Create a Function Representing a class Called Provisioner
/// in the Pluralsight Namespace
Pluralsight.Provisioner = function (appUrl, hostUrl) {
    var dfd;

    function createProductsList() {
        // make sure the instance of the Deferred Object it's being Created.
        if (!dfd) return;
        dfd.notify("Creating Products list"); // Send a progress message back to App.js

        var context = new SP.ClientContext(appUrl);
        var web = context.get_web();

        var lci = new SP.ListCreationInformation();
        lci.set_title("Products");
        lci.set_templateType(SP.ListTemplateType.genericList);
        var list = web.get_lists().add(lci);

        context.executeQueryAsync(success, fail);

        function success() {
            dfd.notify("Products list created");
            dfd.resolve();
        }

        function fail(sender, args) {
            dfd.reject(args);
        }
    }

    // Create a Public Function i.e. Execute
    function execute() {
        dfd = new $.Deferred();

        // Start Provisioning Process From Here
        createProductsList();

        // Return a promise
        return dfd.promise();
    }

    return {
        execute: execute
    }
}