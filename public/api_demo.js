"use strict";

$(function() {
  var host = "http://localhost:3000";

  $("#getTours").click(function(event) {
    event.preventDefault();
    var type = "GET";
    var path = "/tours";
    var data = "";
    makeAPICall(type, path, data);
  });

  $("#getTour").click(function(event) {
    event.preventDefault();
    var type = "GET";
    var path = "/tours/1";
    var data = "";
    makeAPICall(type, path, data);

  });

  $("#postTour").click(function(event) {
    event.preventDefault();
    var type = "POST";
    var path = "/tours";
    var data = { 
                  tour: { 
                    interest_points_attributes:
                      [
                          {location:"POINT (-122.4137007 37.7756913)"}
                      ],
                    path: "LINESTRING(-122.4136841 37.7756653, -122.4136841 37.7756653, -122.4137007 37.7756913)",
                    pathpoints: ["-122.4136841 37.7756653","-122.4136841 37.7756653","-122.4137007 37.7756913"],
                    name:"testName"
                  }
              };
    makeAPICall(type, path, data);
  });

  function makeAPICall(type, path, data) {
    console.log("makeAPICall");
    var url = host + path;
    var request = $.ajax({
      type: type,
      url: url,
      dataType: "json",
      contentType: "application/json; charset=utf-8",
      beforeSend: function(xhr) {
        xhr.setRequestHeader("Accept", "application/json")
      },
      data: JSON.stringify(data)
    }).fail(function(jqXHR, textStatus, errorThrown) {
      $("#results").text("error: " + JSON.stringify(errorThrown));
    }).done(function(response, textStatus, jqXHR) {
      $("#results").text(JSON.stringify(response));
    });
  }
});