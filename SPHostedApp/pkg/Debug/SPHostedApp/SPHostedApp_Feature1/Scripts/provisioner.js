
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
            getProductsData();
        }

        function fail(sender, args) {
            dfd.reject(args);
        }
    }

    // Get the Products List data to Populate it
    function getProductsData() {
        if (!dfd) return;
        dfd.notify("Requesting Products data");

        var url = appUrl + "/Content/ProductsData.txt";
        var call = $.get(url);
        call.done(function (data, textStatus, jqXHR) {
            populateProductsList(data); // invoke populateProductsList
        });
        call.fail(function (jqXHR, textStatus, errorThrown) {
            dfd.reject(jqXHR);
        });
    } // getProductsData()

    // Data to Populate the List with data
    function populateProductsList(data) {
        if (!dfd) return;
        dfd.notify("Populating Products list");

        var context = new SP.ClientContext(appUrl);
        var web = context.get_web();
        var list = web.get_lists().getByTitle("Products");

        var products = JSON.parse(data);
        var currentProduct = -1; // counter
        updateNextSet();

        function updateNextSet(){
            var setIndex = 0;
            while (true) {
                setIndex += 1;
                currentProduct += 1;
                if (setIndex == 25 || currentProduct == products.length) {
                    context.executeQueryAsync(success, fail);
                    break;
                }

                // add item to Products list
                var value = products[currentProduct];
                var ici = new SP.ListItemCreationInformation();
                var item = list.addItem(ici);

                // Populate the Field's Values
                item.set_item("Title", value.Title);
                item.set_item("QuantityPerUnit", value.QuantityPerUnit);
                item.set_item("UnitPrice", value.UnitPrice);
                item.set_item("UnitsInStock", value.UnitsInStock);
                item.set_item("UnitsOnOrder", value.UnitsOnOrder);
                item.set_item("ReorderLevel", value.ReorderLevel);
                item.set_item("Discontinued", value.Discontinued);

                // Handle the Lookup
                var lfv = new SP.FieldLookupValue();
                lfv.set_lookupId(value.CategoryId);
                item.set_item("Category", lfv);
                item.update();

            }; // while Loop
        } // updateNextSet()

        function success() {
            dfd.notify(String.format("\t{0} of {1}", currentProduct, products.length));
            if (currentProduct == products.length) {
                updateCurrentVersion(); // invoke updateCurrentVersion
            } else {
                updateNextSet();
            }
        }

        function fail(sender, args) {
            dfd.reject(args);
        }
    } //populateProductsList()


    // Handle the Flag Bag Update to Current Version
    function updateCurrentVersion() {
        if (!dfd) return;
        dfd.notify("Updating current version number");

        // Create a new Instance of the Web Repository
        var repo = new Pluralsight.Repositories.WebRepository();
        var call = repo.setProperty("CurrentVersion", "1.0.0.0", appUrl);
        call.done(function(data, textStatus, jqXHR){
            dfd.notify("Update complete");
            dfd.resolve();
        });
        call.fail(function (jqXHR, textStatus, errorThrown) {
            dfd.reject(jqXHR);
        });
    } // updateCurrentVersion()

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