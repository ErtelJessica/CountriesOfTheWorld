/**
 * 
 */

	var app = angular.module('countriesOfTheWorldApp', ['720kb.socialshare','ngMap']);
	var mapWidthInPx;
	var height = 300; // default value by google maps
    var mapAreaInPx;
    var metersPerPixel = (6378137 / 256) * 2; // constants by google for zoom
												// 0
    var kilomentersPerPixel = metersPerPixel / 1000;
    var kilometersPerPixelSquared = kilomentersPerPixel * kilomentersPerPixel
    var zoomlevelToAreaInKmMap;
    var maxZoomLevel = 19; // default value by google maps
	var countrySortClickCount = 0;
	var populationSortClickCount = 0;
    
     
    function calculateMapAreaInKmForZoom0(){
    	return mapAreaInPx * kilometersPerPixelSquared;
    }
    
    /*
	 * google standard: zoom + 1 -> metersPerPixel * 0,5
	 */
    function calculateMapAreaInKmForAnyZoom(zoom){
    	return calculateMapAreaInKmForZoom0() * Math.pow(0.5, zoom * 2); 
    }
    
   function calculateZoomMapAreaListFrom0ToMaxZoomLevel(maxZoomLevel) { 
   		areas = []; 
   		for (var index = 0; index <= maxZoomLevel; index++) {
   			areas[index] = calculateMapAreaInKmForAnyZoom(index); 
   			} 
   		return areas; 
   	}
    
    function adjustViewForNewDimesion(){
    	mapWidthInPx = document.getElementById('mapDiv').clientWidth;
    	mapAreaInPx = height * mapWidthInPx;
    	zoomlevelToAreaInKmMap = calculateZoomMapAreaListFrom0ToMaxZoomLevel(maxZoomLevel);
    	console.log(zoomlevelToAreaInKmMap);
	   // console.log("change: " + mapWidthInPx);
    }
    	
    
    function calculateClicks(clickedElementName){
		switch (clickedElementName) {
		case 'name':
			countrySortClickCount += 1;
			populationSortClickCount = 0;
			break;
		case 'population':
			populationSortClickCount += 1;
			countrySortClickCount = 0;
			break;
		default:
			break;
		}
	}
	
	function isSecondClickOnSortElement(sortElementName){
		calculateClicks(sortElementName);
		return (countrySortClickCount > 0 && countrySortClickCount % 2 == 0) || (populationSortClickCount > 0 && populationSortClickCount % 2 == 0);
	}
	
	function formatTextForPrint(key,data){
		var value = data;
		
		switch (key) {
		case "population":
			value = data.toLocaleString('en-US');
			break;
		case "currencies":
			var tempValue = data.map( function(currency, index, data) {return currency.name});
			value = tempValue.reduce( function(result, name, index, data) { return result + ", " + name; });
			break;
		case "timezones":
			value = data.reduce( function(result, timezone, index, data) { return result + ", " + timezone; });
		default:
			break;
		}
		
		return value;
	}
	
	
	
	function changeTextToIdFormat(text){
	    	if(text !== undefined){
	    		return text.replace(/[^a-zA-Z ]|\s+/g, "");
	    	}
	    }
	
	function formatJsonDataValuesAndAddId(json){
		json.map(function(country, i) {
			country.population = formatTextForPrint('population', country.population);
			country.currencies = formatTextForPrint('currencies', country.currencies);
			country.timezones = formatTextForPrint('timezones', country.timezones);
			country.id =  changeTextToIdFormat(country.name);
		});
		return json;
	}
	
	function calculateZoomByCountryAreaInKm(area){
		var zoom;
		if(area == undefined){
			var mod = zoomlevelToAreaInKmMap.length % 2;
			zoom = (zoomlevelToAreaInKmMap.length - mod) /2;
		}else{
			for(var i = 0; i< zoomlevelToAreaInKmMap.length; i++){
				if( zoomlevelToAreaInKmMap[i] > area){
					zoom = i;
				}
			}
		}
		console.log("area: " +area);
		console.log("zoom " + zoom);
		return zoom;
	}
	
	function calculateCenter(country){
		if(country.latlng.length !== 2){
			if(country.capital == ""){
				return country.name;
			} else {
				return country.capital;
			}
		} else{
			return country.latlng
		}
	}
	
    
	
	app.controller('countriesOfTheWorldCtrl', function($scope, $http, $location, $anchorScroll, $timeout, $window, NgMap) {
		
		adjustViewForNewDimesion();
		
		$scope.showListView = "true";
		$scope.showForm = "false";
		$scope.isSecond = false;
		$scope.countrySelected = {name: "", population:"", region: "", currencies:[""], timezones : [""], area: 10, latlng: [1, 1]}; // default
																																		// data
		/**
		 * Window resize event handling
		 */
		angular.element($window).on('resize', adjustViewForNewDimesion);
		
		/**
		 * Get JSON data
		 */
		$http.get("https://restcountries.eu/rest/v2/all?fields=name;population;flag;capital;region;currencies;timezones;latlng;area").then(
				function(response) {
					$scope.data = formatJsonDataValuesAndAddId(response.data);
				});
		
		
		/**
		 * Show map when loaded and center
		 */
		NgMap.getMap().then((map) => {
			google.maps.event.addListenerOnce(map, 'idle', function () {
			    google.maps.event.trigger(map, 'resize');
			    var latlng = $scope.countrySelected.latlng
			    var lat =latlng.length == 2 ? $scope.countrySelected.latlng[0] : 0;
			    var lng = latlng.length == 2 ? $scope.countrySelected.latlng[1] : 0;
			    console.log(lat + "  " + lng);
			    map.setCenter(new google.maps.LatLng(lat,lng));
			});
		});
		
		
		/**
		 * Format text for Detail view
		 */
		
		$scope.orderByContent = function(sortElementName) {
			$scope.sortDown = isSecondClickOnSortElement(sortElementName);			
			$scope.contentToOrder = sortElementName;
		};
		
		
		$scope.showDetailsView = function(country) {
			$scope.showListView = !$scope.showListView;
			initializeDetailView(country);
		}
		
		function initializeDetailView(country){ 
			setValuesOfCurrentCountry(country);			
			setFocusToTheTop();
			setValuesForSocialMedia();
			setValuesForMap(country);			
		}
		
		function setValuesOfCurrentCountry(country){
			$scope.countrySelected = country;
			$scope.currentName = country.name;
		}
		
		function setFocusToTheTop(){
			$anchorScroll();
			$location.hash($scope.currentName);
		}
		
		function setValuesForSocialMedia(){
			$scope.currentUrl = $location.absUrl();
		}	
		
		function setValuesForMap(country){
			$scope.currentCenter = calculateCenter(country);
			$scope.currentZoom = calculateZoomByCountryAreaInKm(country.area);
		}
		
		$scope.getDataToShow = function(){
			return (({region,capital,population,currencies,timezones}) => ({ region,capital,population,currencies,timezones}))($scope.countrySelected);
		}
		
		$scope.hideDetailsView = function() {
			$scope.showListView = !$scope.showListView;
			// setFocus
			setFocus($scope.countrySelected.id);

		};
		
		function setFocus(country){
			$anchorScroll();
			$location.hash("");
		}
		
		$scope.showFormular = function(){
			
			$scope.showForm = !$scope.showForm;
			console.log("showFormular: " + $scope.showForm);
		}	
		
		
		$scope.reset = function() {
	        $scope.searchString = "";
	    };
	    
	   
	    
	    $scope.printFlag = function(id,url,height){    	
	    	d3.select("#"+id)
			.attr("src",url)
			.attr("height", height)
	    
	    }	  
	    
	});	
	