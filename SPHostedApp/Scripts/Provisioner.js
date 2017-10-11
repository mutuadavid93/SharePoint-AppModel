
// Create an Object that represents the Pluralsight Namespace
window.Pluralsight = window.Pluralsight || {};

// Create a Function Representing a class Called Provisioner
/// in the Pluralsight Namespace
Pluralsight.Provisioner = function (appUrl, hostUrl) {
    var dfd;

    function categoryListID() {
        if (!dfd) return;
        dfd.notify("Getting Category list id");

        var context = new SP.ClientContext(appUrl);
        var web = context.get_web();

        var list = web.get_lists().getByTitle("Categories");

        context.load(list, "Id");
        context.executeQueryAsync(success, fail);

        function success() {
            createProductsList(list.get_id()); // invoke passing the ListID
        }

        function fail(sender, args) {
            dfd.reject(args);
        }
    } // categoryListID()

    function createProductsList(categoryListID) {
        // make sure the instance of the Deferred Object it's being Created.
        if (!dfd) return;
        dfd.notify("Creating Products list"); // Send a progress message back to App.js

        var context = new SP.ClientContext(appUrl);
        var web = context.get_web();

        // Now Create the List
        var lci = new SP.ListCreationInformation();
        lci.set_title("Products");
        lci.set_templateType(SP.ListTemplateType.genericList);
        var list = web.get_lists().add(lci);

        // Now Add Custom Columns/Fields
        list.get_fields().addFieldAsXml('<Field DisplayName="Category" Type="Lookup" Required="FALSE" List="{' + categoryListID + '}" Name="Category" ShowField="Title" Version="1" />', true, SP.AddFieldOptions.defaultValue);
        list.get_fields().addFieldAsXml('<Field DisplayName="QuantityPerUnit" Type="Text" Required="FALSE" Name="QuantityPerUnit" />', true, SP.AddFieldOptions.defaultValue);
        list.get_fields().addFieldAsXml('<Field DisplayName="UnitPrice" Type="Currency" Required="FALSE" Name="UnitPrice" />', true, SP.AddFieldOptions.defaultValue);
        list.get_fields().addFieldAsXml('<Field DisplayName="UnitsInStock" Type="Integer" Required="FALSE" Name="UnitsInStock" />', true, SP.AddFieldOptions.defaultValue);
        list.get_fields().addFieldAsXml('<Field DisplayName="UnitsOnOrder" Type="Integer" Required="FALSE" Name="UnitsOnOrder" />', true, SP.AddFieldOptions.defaultValue);
        list.get_fields().addFieldAsXml('<Field DisplayName="ReorderLevel" Type="Integer" Required="FALSE" Name="ReorderLevel" />', true, SP.AddFieldOptions.defaultValue);
        list.get_fields().addFieldAsXml('<Field DisplayName="Discontinued" Type="Boolean" Required="FALSE" Name="Discontinued" />', true, SP.AddFieldOptions.defaultValue);

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
        categoryListID();

        // Return a promise
        return dfd.promise();
    }

    return {
        execute: execute
    }
}