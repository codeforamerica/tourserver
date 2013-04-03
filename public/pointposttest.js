"use strict";

$(function() {
  //uncomment the following for PhoneGap (and the closing punct at the bottom)
  //$(document).bind('deviceready', function (){ 
  var minAccuracy = 30;
  var request;
  var timeout;
  var tour = {
    interest_points_attributes: [],
    path: []
  };
  var points;

  $("#postpoint").click(function(event) {
    event.preventDefault();
    var point;
    var $button = $(this);
    if (request) {
      request.abort();
    }
    navigator.geolocation.getCurrentPosition(geoClickSuccess, geoClickError, {
      enableHighAccuracy: true
    });

    function geoClickError() {
      console.log(error);
    }

    function geoClickSuccess(position) {
      if (position.coords.accuracy <= minAccuracy) {
        $button.prop("disabled", true);
        savePoint(position, $button);
      } else {
        alert(position.coords.accuracy + " Go outside!");
      }
    }
  });

  $("#markpoint").click(function(event) {
    event.preventDefault();
    var point;
    navigator.geolocation.getCurrentPosition(geoSuccess, geoError, {
      enableHighAccuracy: true
    });

    function geoError() {
      console.log(error);
    }

    function geoSuccess(position) {
      if (position.coords.accuracy <= minAccuracy) {
        notePoint(position);
      } else {
        alert(position.coords.accuracy + " Go outside!");
      }
    }
  });

  function notePoint(position) {
    var newInterestPoint = {};
    newInterestPoint.location = positionToWKT(position);
    tour.interest_points_attributes.push(newInterestPoint);
    console.log(tour);
  }

  $("#createtour").click(function(event) {
    event.preventDefault();
    tour.name = "testName";
    tour.path = "LINESTRING" + "(" + tour.pathpoints.join(", ") + ")";
    var myData = { tour: tour};
    console.log(myData);
    console.log("createtour clicked");
    var $button = $(this);
    if (request) {
      request.abort()
    }
    var request = $.ajax({
      type: "post",
      url: "http://localhost:3000/tours",
      dataType: "json",
      contentType: "application/json; charset=utf-8",
      beforeSend: function(xhr) {
        xhr.setRequestHeader("Accept", "application/json")
      },
      data: JSON.stringify(myData)
    }).fail(function(jqXHR, textStatus, errorThrown) {
      alert("error: " + errorThrown);
    }).done(function(response, textStatus, jqXHR) {
      alert(response);
    });
  });

  function savePoint(position, $elements) {
    //shouldn't have $elements here, should prob be called async with a callback that deals with $elements
    var pointWKT = positionToWKT(position);
    var data = {
      interest_point: 
      {
        location: pointWKT,
        interp_items_attributes: 
        [{ 
          name: "test name",
          media_items_attributes: 
          [{
            name: "test text"
          }]
        }]
      }
    };
    var request = $.ajax({
      type: "post",
      url: "http://localhost:3000/interest_points",
      dataType: "json",
      contentType: "application/json; charset=utf-8",
      beforeSend: function(xhr) {
        xhr.setRequestHeader("Accept", "application/json")
      },
      data: JSON.stringify(data)
    }).fail(function(jqXHR, textStatus, errorThrown) {
      alert(errorThrown);
    }).done(function(response, textStatus, jqXHR) {
      alert(response);
    }).always(function() {
      if (typeof $elements != 'undefined') {
        $elements.prop("disabled", false)
      }
    });
  }

  function currentPosition() {
    console.log("currentPosition");
    navigator.geolocation.getCurrentPosition(geoSuccess, geoError, {
      enableHighAccuracy: true, timeout: 1000
    });

    timeout = setTimeout(currentPosition, 2000);
    
    function geoSuccess(position) {
      console.log("geoSuccess");
      $('#location').text(position.coords.longitude.toFixed(5) + " " + position.coords.latitude.toFixed(5) + " " + position.coords.accuracy + "m");
      var newPathLocation = position.coords.longitude + " " + position.coords.latitude;
      tour.pathpoints = tour.pathpoints || [];
      tour.pathpoints.push(newPathLocation);
      console.log(tour.pathpoints.length);
    }

    function geoError(data) {
      console.log(data);
    }

  }

  
  $("#togglelocation").submit(function(event) {
    //console.log(timeout);
    event.preventDefault();
    if ($("#togglelocationbtn").prop('value') == 'Pause Tour') {
      clearTimeout(timeout);
      $("#togglelocationbtn").prop('value', 'Start Tour');
    } else {
      $("#togglelocationbtn").prop('value', 'Pause Tour');
      currentPosition();
    }
  });

  function positionToWKT(position) {
    var pointWKT = "SRID=4326;POINT (" + position.coords.longitude + " " + position.coords.latitude + ")";
    return pointWKT;
  }
  //uncomment this for PhoneGap
  //});
});