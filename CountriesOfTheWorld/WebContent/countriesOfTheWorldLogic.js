/**
 * 
 */

var app = angular.module('countriesOfTheWorldApp', ['720kb.socialshare','ngMap']);

var mapWidthInPx;
var mapHeightInPx = 300; // default value by google maps
var mapAreaInPx;
var metersPerPixel = (6378137 / 256) * 2; // constants by google for zoom 0
var kilomentersPerPixel = metersPerPixel / 1000;
var kilometersPerPixelSquared = kilomentersPerPixel * kilomentersPerPixel
var maxZoomLevel = 19; // default value by google maps
var zoomlevelToAreaInKmMap;

var defaultCountry = {name: "", population:"", region: "", currencies:[""], timezones : [""], area: 10, latlng: [1, 1]};
var countryNameSortClickCount = 0;
var countryUnformattedPopulationSortClickCount = 0; 

app.filter('highlight', function($sce) {
    return function(text, phrase){
        if (phrase){
        	text = text.replace(new RegExp('('+phrase+')', 'gi'), '<span class="highlighted">$1</span>');
        }
        return $sce.trustAsHtml(text);
      }
    });

app.controller('countriesOfTheWorldCtrl', function($scope, $http, $location, $anchorScroll, $window, NgMap) {
	
	$scope.showListView = true;
	$scope.showComplaintForm = false;
	$scope.countrySelected =  defaultCountry;
	adjustViewForNewDimesion();
	
	angular.element($window).on('resize', adjustViewForNewDimesion());
	
	 $http.get("https://restcountries.eu/rest/v2/all?fields=name;population;flag;capital;region;currencies;timezones;latlng;area").then(
		 function(response) { 
		     $scope.data = formatJsonDataValuesAndAddId(response.data); 
		 });
	
	/**
	 * Load and Center Map at the Beginning
	 */
	NgMap.getMap().then((map) => {
		google.maps.event.addListenerOnce(map, 'idle', function () {
		    google.maps.event.trigger(map, 'resize');	    
		    map.setCenter(getGoogleMapsLatLngOfCountry($scope.countrySelected));
		});
	});
	
	$scope.resetSearchString = function() {
	    	$scope.searchString = "";
	};
	
	$scope.orderTableByContent = function(sortElementName) {
		$scope.sortDown = isSecondClickOnSortElement(sortElementName);			
		$scope.contentToOrder = sortElementName;
	};
	
	$scope.insertFlagByUrl = function(id,url,height){    	
		d3.select("#"+id)
			.attr("src",url)
			.attr("height", height);
	}	
	
	$scope.getDataToShowInDetailView = function(){
		return (({region,capital,population,currencies,timezones}) => ({ region,capital,population,currencies,timezones}))($scope.countrySelected);
	}
	
	$scope.showDetailsView = function(country) {
		$scope.showListView = !$scope.showListView;
		initializeDetailsView(country);
	}
	
	$scope.hideDetailsView = function() {
		$scope.showListView = !$scope.showListView;
		$scope.showComplaintForm = false;
		resetCompliantForm();
		setFocusToSelectedCountry($scope.countrySelected.id);
	};
	
	$scope.showComplaintFormular = function(){
		$scope.showComplaintForm = !$scope.showComplaintForm;
	}
	
	function initializeDetailsView(country){ 
	        setSelectedCountry(country);			
	        setFocusToTheTop();
	        setValuesForSocialMedia();
	        setValuesForMap(country);
	}
	
	function resetCompliantForm(){
		var textarea = document.getElementById('compliant');
		textarea.value = '';
		$scope.complaintForm.$setPristine();
	}
			
	function setSelectedCountry(country){
		$scope.countrySelected = country;
	}
	
	function setFocusToSelectedCountry(country){
		$anchorScroll();
		$location.hash("");
	}
		
	function setFocusToTheTop(){
		$anchorScroll();
	}
		
	function setValuesForSocialMedia(){
		$location.hash($scope.countrySelected.id);
		$scope.currentUrl = $location.absUrl();
	}	
		
	function setValuesForMap(country){
		$scope.currentCenter = calculateCenterForMap(country);
		$scope.currentZoom = calculateZoomByCountryAreaInKm(country.area);
	}

});
    
     
    function calculateMapAreaInKmForZoom0(){
        return mapAreaInPx * kilometersPerPixelSquared;
    }
    
    
    function calculateMapAreaInKmForAnyZoom(zoom){
    	/*
		 * google standard: zoom + 1 -> metersPerPixel * 0,5
		 */
        return calculateMapAreaInKmForZoom0() * Math.pow(0.5, zoom * 2); 
    }
    
    function calculateZoomMapAreaListFrom0ToMaxZoomLevel(maxZoomLevel) { 
        areas = []; 
        for (var index = 0; index <= maxZoomLevel; index++) {
    		areas[index] = calculateMapAreaInKmForAnyZoom(index); 
        } 
        return areas; 
    }
    
	function calculateZoomByCountryAreaInKm(area){
		if(area){
			return getZoomLevelOfLeastSiutableZoomArea(area);
		}else{
			return getAverageZoom();
		}
	}
	
	function getAverageZoom(){
		var moduloValue = zoomlevelToAreaInKmMap.length % 2;
		return (zoomlevelToAreaInKmMap.length - moduloValue) /2;
	}
	
	function getZoomLevelOfLeastSiutableZoomArea(area){
		var zoom;
		for(var i = 0; i< zoomlevelToAreaInKmMap.length; i++){
			if( zoomlevelToAreaInKmMap[i] > area){
				zoom = i;
			}
		}
		return zoom;
	}
        
    function adjustViewForNewDimesion(){
        mapWidthInPx = document.getElementById('mapDiv').clientWidth;
        mapAreaInPx = mapHeightInPx * mapWidthInPx;
        zoomlevelToAreaInKmMap = calculateZoomMapAreaListFrom0ToMaxZoomLevel(maxZoomLevel);
    }
    	
    function isSecondClickOnSortElement(sortElementName){
    	calculateClicks(sortElementName);
    	return countryNameIsSecondClick() || countryUnformattedPopulationIsSecondClick();
    }
    
    function calculateClicks(clickedElementName){
        switch (clickedElementName) {
        case 'name':
        	raiseCountryNameSortClickCount();
            break;
        case 'unformattedPopulation':
        	raiseCountryUnformattedPopulationSortClickCount();
            break;
        default:
            break;
        }
    }
	
    function countryNameIsSecondClick(){
    	return (countryNameSortClickCount > 0 && countryNameSortClickCount % 2 == 0);
    }
    
    function countryUnformattedPopulationIsSecondClick(){
    	return (countryUnformattedPopulationSortClickCount > 0 && countryUnformattedPopulationSortClickCount % 2 == 0);
    }
    
    function raiseCountryNameSortClickCount(){
        countryNameSortClickCount += 1;
        countryUnformattedPopulationSortClickCount = 0;
    }
    
    function raiseCountryUnformattedPopulationSortClickCount(){
        countryUnformattedPopulationSortClickCount += 1;
        countryNameSortClickCount = 0;
    }
	
    
	function changeTextToIdFormat(text){
    	if(text){
    		return text.replace(/[^a-zA-Z ]|\s+/g, "");
    	}
    }
	
	function formatJsonDataValuesAndAddId(json){
		json.map(function(country, i) {
			country.unformattedPopulation = country.population;
			country.id =  changeTextToIdFormat(country.name);
			country.population = formatTextForPrint('population', country.population);
			country.currencies = formatTextForPrint('currencies', country.currencies);
			country.timezones = formatTextForPrint('timezones', country.timezones);
		});
		return json;
	}
	
	function formatTextForPrint(key,data){
        var value = data;
        if(data){
	        switch (key) {
	        case "population":
	            value = fomatNumber(data);
	            break;
	        case "currencies":
	        	value = formatCurrencies(data);
	        	break;
	        case "timezones":
	        	value = formatTimezones(data);
	        	break;
	        default:
	        	break;
	        }
        }
		return value;
	}
	
    
    function fomatNumber(number){
    	return number.toLocaleString('en-US');
    }
    
    function formatCurrencies(currencies){
    	var tempValue = currencies.map( function(currency, index, data) { return currency.name});
    	return tempValue.reduce( function(result, name, index, data) { return result + ", " + name; });
    }
    
    function formatTimezones(timezones){
    	return timezones.reduce( function(result, timezone, index, data) { return result + ", " + timezone; });
    }

	
	function calculateCenterForMap(country){
		if(country.latlng.length !== 2){
			if(country.capital == "") {
				return country.name;
			} else {
				return country.capital;
			}
		} else {
			return country.latlng
		}
	}
	
	function getGoogleMapsLatLngOfCountry(country){
		return new google.maps.LatLng(getLatOfCountryOrZero(country),getLngOfCountryOrZero(country));
	}
	
	function getLatOfCountryOrZero(country){
		return country.latlng.length == 2 ? country.latlng[0] : 0;
	}
	
	function getLngOfCountryOrZero(country){
		return country.latlng.length == 2 ? country.latlng[1] : 0;
	}
	
	
		
	