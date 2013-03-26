"use strict";
$(function() {
  //$(document).bind('deviceready', function (){ 
  var request;
  var tour = {
    path: []
  };


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
      if (position.coords.accuracy < 10) {
        $button.prop("disabled", true);
        pointWKT = "POINT (" + position.coords.longitude + " " + position.coords.latitude + ")";
        point = {
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
          $button.prop("disabled", false)
        });
      } else {
        alert(position.coords.accuracy + " Go outside!");
      }
    }
  });

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
      data: { tour: tour }
    }).fail(function(jqXHR, textStatus, errorThrown) {
      alert(errorThrown);
    }).done(function(response, textStatus, jqXHR) {
      alert(response);
    });
  });


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

  var interval = setInterval(currentPosition, 1000);
  $("#togglelocation").submit(function(event) {
    event.preventDefault();
    if (interval) {
      clearInterval(interval);
      interval = null;
    } else {
      interval = setInterval(currentPosition, 1000);
    }
  });

  //});
});