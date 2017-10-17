window.Pluralsight = window.Pluralsight || {};
window.Pluralsight.Repositories = window.Pluralsight.Repositories || {};

// For the CSOM:
// One codeBase to work whether we are targeting the hostWeb or AppWeb
Pluralsight.Repositories.getWeb = function (context, hostUrl) {
    var web = null;

    if (hostUrl) {
        var hostContext = new SP.AppContextSite(context, hostUrl);
        web = hostContext.get_web();
    } else {

        // if there is no hostUrl, get the Web Object( i.e. get_web() )
        // using the context that was passed in.
        web = context.get_web(); 
    }

    return web;
}

// For the REST API:
// Implementation of the targetUrl
// One codeBase to work whether we are targeting the hostWeb or AppWeb
Pluralsight.Repositories.targetUrl = function (url, hostUrl) {
    if (hostUrl) {
        var api = "_api/";
        var index = url.indexOf(api);
        url = url.slice(0, index + api.length) +
            "SP.AppContextSite(@target)" +
            url.slice(index + api.length - 1);

        var connector = "?";
        if (url.indexOf("?") > -1 && url.indexOf("$") > -1) {
            connector = "&";
        }

        url = url + connector + "@target='" + hostUrl + "'";
    }

    // if the host url is null or undefined, return the 
    // original url we were passed to the function
    return url;
}

Pluralsight.Repositories.WebRepository = function () {
    function getProperties(appUrl, hostUrl) {
        var url = appUrl + "/_api/Web/AllProperties";
        url = Pluralsight.Repositories.targetUrl(url, hostUrl);

        var call = jQuery.ajax({
            url: url,
            type: "GET",
            dataType: "json",
            headers: {
                Accept: "application/json;odata=verbose"
            }
        });

        return call;
    }

    function setProperty(name, value, appUrl, hostUrl) {
        var dfd = new jQuery.Deferred();

        var context = SP.ClientContext.get_current();
        var web = Pluralsight.Repositories.getWeb(context, hostUrl);
        var props = web.get_allProperties();

        props.set_item(name, value);
        web.update();
        context.executeQueryAsync(success, fail);

        function success() {
            dfd.resolve();
        }

        function fail(sender, args) {
            dfd.reject(args);
        }

        return dfd.promise();
    }

    function getPermissions(appUrl, hostUrl) {
        var url = appUrl + "/_api/Web/effectiveBasePermissions";
        url = Pluralsight.Repositories.targetUrl(url, hostUrl);

        var call = jQuery.ajax({
            url: url,
            type: "GET",
            dataType: "json",
            headers: {
                Accept: "application/json;odata=verbose"
            }
        });

        return call;
    }

    return {
        getProperties: getProperties,
        setProperty: setProperty,
        getPermissions: getPermissions
    }
}

Pluralsight.Repositories.CategoryRepository = function (appUrl) {
    var listUrl = "/_api/Web/Lists/getByTitle('Categories')";

    function getCategories() {
        var url = appUrl + listUrl + "/Items?$select=Id,Title";
        url = Pluralsight.Repositories.targetUrl(url, hostUrl);

        var call = jQuery.ajax({
            url: url,
            type: "GET",
            dataType: "json",
            headers: {
                Accept: "application/json;odata=verbose"
            }
        });

        return call;
    }

    return {
        getCategories: getCategories
    }
}

// This the ProductsRepository
Pluralsight.Repositories.ProductRepository = function (appUrl, hostUrl) {
    var listUrl = "/_api/Web/Lists/getByTitle('Products')";

    function getProducts(orderby, top) {
        if (!orderby) orderby = "Id";
        if (!top) top = 15;

        var url = appUrl + listUrl + "/Items?$select=*,Category/Title&$orderby=" + orderby + "&$top=" + top + "&$expand=Category/Title";
        url = Pluralsight.Repositories.targetUrl(url, hostUrl);

        var call = jQuery.ajax({
            url: url,
            type: "GET",
            dataType: "json",
            headers: {
                Accept: "application/json;odata=verbose"
            }
        });

        return call;
    }

    function getProductsByCategory(category) {
        if (!category) category = "Beverages";

        var url = appUrl + listUrl + "/Items?$select=*,Category/Title&$filter=(Category/Title eq '" + category + "')&$expand=Category/Title";
        url = Pluralsight.Repositories.targetUrl(url, hostUrl);

        var call = jQuery.ajax({
            url: url,
            type: "GET",
            dataType: "json",
            headers: {
                Accept: "application/json;odata=verbose"
            }
        });

        return call;
    }

    function getProduct(id) {
        if (!id) id = "1";

        var url = appUrl + listUrl + "/Items(" + id + ")?$select=*,Category/Title&$expand=Category/Title";
        url = Pluralsight.Repositories.targetUrl(url, hostUrl);

        var call = jQuery.ajax({
            url: url,
            type: "GET",
            dataType: "json",
            headers: {
                Accept: "application/json;odata=verbose"
            }
        });

        return call;
    }

    function saveProduct(id, data, formDigest) {
        var url = appUrl + listUrl + "/Items(" + id + ")";
        url = Pluralsight.Repositories.targetUrl(url, hostUrl);

        var call = jQuery.ajax({
            url: url,
            type: "POST",
            data: data,
            headers: {
                Accept: "application/json;odata=verbose",
                "Content-Type": "application/json;odata=verbose",
                "X-RequestDigest": formDigest,
                "IF-MATCH": "*",
                "X-Http-Method": "PATCH"
            }
        });

        return call;
    }

    function addProduct(data, formDigest) {
        var url = appUrl + listUrl + "/Items";
        url = Pluralsight.Repositories.targetUrl(url, hostUrl);

        var call = jQuery.ajax({
            url: url,
            type: "POST",
            data: data,
            headers: {
                Accept: "application/json;odata=verbose",
                "Content-Type": "application/json;odata=verbose",
                "X-RequestDigest": formDigest
            }
        });

        return call;
    }

    function getPermissions() {
        var url = appUrl + listUrl + "/effectiveBasePermissions";
        url = Pluralsight.Repositories.targetUrl(url, hostUrl);

        var call = jQuery.ajax({
            url: url,
            type: "GET",
            dataType: "json",
            headers: {
                Accept: "application/json;odata=verbose"
            }
        });

        return call;
    }

    function getNextProductId() {
        var dfd = new jQuery.Deferred();

        var url = appUrl + listUrl + "/Items?$top=1&$select=ProductID&$orderby=ProductID desc";
        url = Pluralsight.Repositories.targetUrl(url, hostUrl);

        var call = jQuery.ajax({
            url: url,
            type: "GET",
            dataType: "json",
            headers: {
                Accept: "application/json;odata=verbose"
            }
        });

        call.done(function (data, textStatus, jqXHR) {
            var productId = 1;

            if (data.d.results.length == 1) {
                productId = data.d.results[0].ProductID + 1;
            }

            dfd.resolve(productId);
        });
        call.fail(function (jqXHR, textStatus, errorThrown) {
            dfd.resolve(0);
        });

        return dfd.promise();
    }

    return {
        getProducts: getProducts,
        getProductsByCategory: getProductsByCategory,
        getProduct: getProduct,
        saveProduct: saveProduct,
        addProduct: addProduct,
        getPermissions: getPermissions,
        getNextProductId: getNextProductId
    }
}