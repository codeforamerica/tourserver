$(function() {
  $(document).bind('deviceready', function (){ 



    var request;
    $("#pointpostform").submit(function(event){
      event.preventDefault();
      var point;
      var $form = $(this);
      var $inputs = $form.find("input, select, button, textarea");

      if (request) {
        request.abort();
      }

      navigator.geolocation.getCurrentPosition(geoClickSuccess, geoClickError, {enableHighAccuracy: true});

      function geoClickError() {
        console.log(error);
      }

      function geoClickSuccess(position) {
        if (position.coords.accuracy < 10) {
          $inputs.prop("disabled", true);
          pointWKT = "POINT (" + position.coords.longitude + " " + position.coords.latitude + ")";
          point = {"interest_point":{"location": pointWKT}};

          var request = $.ajax({
            type: "post",
            url: "http://127.0.0.1:3000/interest_points",
            dataType: "json",
            beforeSend: function(xhr) { xhr.setRequestHeader("Accept", "application/json")},
            data: point
          }).fail(function(jqXHR, textStatus, errorThrown) {
            alert(errorThrown);
          }).done(function(response, textStatus, jqXHR) {
            alert(response);
          }).always(function() {
            $inputs.prop("disabled", false)
          });
        }
        else {
          alert(position.coords.accuracy + " Go outside!");
        }
      }
    });
function currentPosition() {
  navigator.geolocation.getCurrentPosition(geoSuccess, geoError, {enableHighAccuracy: true});

  function geoSuccess(position) {
    $('#location').text(position.coords.longitude + " " + position.coords.latitude + " " + position.coords.accuracy);
    console.log(position);
  }

  function geoError(data) {
    console.log(data);
  }
}


setInterval(currentPosition, 5000);
});
});