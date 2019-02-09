const frameModule = require("ui/frame");
var geolocation = require("nativescript-geolocation");
const Accuracy = require("ui/enums");
const model = require("./search-view-model");
var nativescript_webview_interface_1 = require("nativescript-webview-interface");
var Observable = require("data/observable");
var ObservableArray = require("data/observable-array").ObservableArray;
const connectivityModule = require("tns-core-modules/connectivity");

var oLangWebViewInterface;


function navigatedFrom() 
{
	oLangWebViewInterface.destroy();
}
exports.navigatedFrom = navigatedFrom;

function backEvent(args) 
{
		console.log('Exiting');
		oLangWebViewInterface.destroy();
		geolocation.clearWatch();
}
exports.backEvent=backEvent;

function close(args)
{
	oLangWebViewInterface.destroy();
	geolocation.clearWatch();
	backEvent();
	//alert('Press again to Exit!!','WARNING')
}
exports.close = close;


function setupWebViewInterface(page) 
{
	var webView = page.getViewById('webView');
	oLangWebViewInterface = new nativescript_webview_interface_1.WebViewInterface(webView, '~/www/index.html');
}

function onNavigatingTo(args) 
{	
    const page = args.object;
    setupWebViewInterface(page);

	var home = new Observable.fromObject({});
	home.set("current_position", "collapsed");
	
	const myConnectionType = connectivityModule.getConnectionType();
	console.log(myConnectionType);
	
	geolocation.enableLocationRequest().then(function() 
	{
		geolocation.isEnabled().then(function(isEnabled)
		{
			home.set("current_position", "visible");
			
			var location = geolocation.getCurrentLocation({desiredAccuracy: 3, updateDistance: 10, maximumAge: 20000, timeout: 20000}).
			then(function(loc) {
				if (loc) {
					var latitudine = loc.latitude;
					var longitudine = loc.longitude;
					var place, id;
					
					console.log("Latitude: " + latitudine);
					console.log("Longitude: " + longitudine);
					
					fetch("http://193.205.230.6/places/search/bycoords/" + latitudine +"/" + longitudine + "?filter=com").then((response) => response.json()).then((data) => 
					{
						place = data[0].name.it;
						id = data[0].id;
						home.set("position", place);
						fetch("http://193.205.230.6/products/wrf5/forecast/" + id).then((response) => response.json()).then((data1) => 
						{
							//console.log(data1);
							if (data1.result == "ok") 
							{
								home.set("temp", data1.forecast.t2c + " °C");
								home.set("wind", data1.forecast.ws10n + " kt");
								home.set("icon", '~/meteo_icon/' + data1.forecast.icon);
							}
							else if (data1.result == "error") 
							{
								home.set("current_position", "collapsed");
								dialog.alert({ title: "Errore", message: data1.details, okButtonText: "OK" });
							}
						})
						.catch(error => console.error("[SEARCH] ERROR DATA ", error));
					});
					
					setTimeout(function()
					{
						oLangWebViewInterface.emit('location', {latt:loc.latitude,lang:loc.longitude});
					}, 800);
				}
			}, function(e){
				console.log("Error: " + e.message);
			});	
		});
	}, function(e)
		{
			home.set("current_position", "collapsed");
			console.log("Error: " + (e.message || e));
	});

    if (args.isBackNavigation) {
        return;
    }

    page.bindingContext = home;
}

exports.onNavigatingTo = onNavigatingTo;
