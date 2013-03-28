"use strict";

$(function() {
  //uncomment the following for PhoneGap (and the closing punct at the bottom)
  //$(document).bind('deviceready', function (){ 
  var request;
  var tour = {
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
      if (position.coords.accuracy < 30) {
        $button.prop("disabled", true);
        savePoint(position);
      } else {
        alert(position.coords.accuracy + " Go outside!");
      }
    }
  });


  $("#markpoint").click(function(event) {
    event.preventDefault();
    var point;
    navigator.geolocation.getCurrentPosition(geoClickSuccess, geoClickError, {
      enableHighAccuracy: true
    });

    function geoClickError() {
      console.log(error);
    }

    function geoClickSuccess(position) {
      if (position.coords.accuracy < 30) {
        notePoint(position);
      } else {
        alert(position.coords.accuracy + " Go outside!");
      }
    }
  });

  function notePoint(position) {
    tour.interest_points
  }

  $("#createtour").click(function(event) {
    event.preventDefault();
    tour.name = "testName";
    tour.path = "LINESTRING" + "(" + tour.pathpoints.join(", ") + ")";
    console.log("createtour clicked");
    var $button = $(this);
    if (request) {
      request.abort()
    }
    var request = $.ajax({
      type: "post",
      url: "http://127.0.0.1:3000/tours",
      dataType: "json",
      beforeSend: function(xhr) {
        xhr.setRequestHeader("Accept", "application/json")
      },
      data: {
        tour: tour
      }
    }).fail(function(jqXHR, textStatus, errorThrown) {
      alert(errorThrown);
    }).done(function(response, textStatus, jqXHR) {
      alert(response);
    });
  });

  function savePoint(position, $elements) {
    //shouldn't have $elements here, should prob be called async with a callback that deals with $elements
    var pointWKT = "POINT (" + position.coords.longitude + " " + position.coords.latitude + ")";
    var point = {
      "interest_point": {
        "location": pointWKT
      }
    };
    var request = $.ajax({
      type: "post",
      url: "http://127.0.0.1:3000/interest_points",
      dataType: "json",
      beforeSend: function(xhr) {
        xhr.setRequestHeader("Accept", "application/json")
      },
      data: point
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
    navigator.geolocation.getCurrentPosition(geoSuccess, geoError, {
      enableHighAccuracy: true
    });

    function geoSuccess(position) {
      $('#location').text(position.coords.longitude + " " + position.coords.latitude + " " + position.coords.accuracy);
      var newPathLocation = position.coords.longitude + " " + position.coords.latitude;
      tour.pathpoints = tour.pathpoints || [];
      tour.pathpoints.push(newPathLocation);
      console.log(tour.pathpoints);
    }

    function geoError(data) {
      alert("geoerror: " + data);
    }
  }

  var interval;
  $("#togglelocation").submit(function(event) {
    event.preventDefault();
    if (interval) {
      clearInterval(interval);
      interval = null;
    } else {
      interval = setInterval(currentPosition, 1000);
    }
  });
  //uncomment this for PhoneGap
  //});
});