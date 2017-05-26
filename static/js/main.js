var refreshRate = 1500 // every 3
var playing = true;
// Elements for taking the snapshot
var canvas = document.getElementById('canvas');
var resultsCanvas = document.getElementById('results')
var context = canvas.getContext('2d');
var resultsContext = resultsCanvas.getContext('2d');
var video = document.getElementById('video');
var currentFace = [];
var averageAge = [];
var genderArr = [];
var pauseCapture = null;

var faceCoordinates = [];

// face drawing points
var pointSize = 3;
var manualCoords = [];

$(document).ready(function() {
    // Grab elements, create settings, etc.
    var video = document.getElementById('video');

    // Get access to the camera!
    if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // Not adding `{ audio: true }` since we only want video now
        navigator.mediaDevices.getUserMedia({ video: true }).then(function(stream) {
            video.src = window.URL.createObjectURL(stream);
            video.play();
        });
    }

    $('#capture').on('click', function() {
        capture();
        manualCoords.length = 0;
    });

});



function capture() {
  resultsContext.clearRect(0,0,resultsCanvas.width, resultsCanvas.height);
  var vidWidth = $('#video').width();
  var vidHeight = $('#video').height();

  context.canvas.width = vidWidth;
  context.canvas.height = vidHeight;
  resultsContext.canvas.width = vidWidth;
  resultsContext.canvas.height = vidHeight;
  resultsContext.strokeStyle="yellow";
  resultsContext.lineWidth = "7";

  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  var imgByte = canvas.toDataURL('image/JPEG');
  sendToFaceApi(imgByte);

  $.ajax({
      url: "/save-image",
      type: "POST",
      data: imgByte.replace('data:image/jpeg;base64,', ''),
      processData: false
  });

  // show captured image.
  $('#canvas').css('visibility', 'visible');
}

function sendToFaceApi(imgByte) {

    var params = {
        // Request parameters
        "returnFaceId": "true",
        "returnFaceLandmarks": "true",
        "returnFaceAttributes": "age,gender,smile,glasses",
    };

    $.ajax({
        url: "https://westus.api.cognitive.microsoft.com/face/v1.0/detect?" + $.param(params),
        beforeSend: function(xhrObj){
            // Request headers
            // xhrObj.setRequestHeader("Content-Type","application/json");
            xhrObj.setRequestHeader("Content-Type","application/octet-stream");
            xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key","0f7dacb02cb946df8da0241615c13e36");
        },
        type: "POST",
        // Request body
        data: makeblob(imgByte),
        processData: false
    })
    .done(function(data) {
        console.log(data);

        drawFaceCoordinates(data);

        $('.info-footer').fadeIn();
    })
    .fail(function(err) {
        console.log(err)
        // alert("error");
    });
}

var makeblob = function (dataURL) {
    var BASE64_MARKER = ';base64,';
    if (dataURL.indexOf(BASE64_MARKER) == -1) {
        var parts = dataURL.split(',');
        var contentType = parts[0].split(':')[1];
        var raw = decodeURIComponent(parts[1]);
        return new Blob([raw], { type: contentType });
    }
    var parts = dataURL.split(BASE64_MARKER);
    var contentType = parts[0].split(':')[1];
    var raw = window.atob(parts[1]);
    var rawLength = raw.length;

    var uInt8Array = new Uint8Array(rawLength);

    for (var i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
    }

    return new Blob([uInt8Array], { type: contentType });
}

// BEGIN drawing face coordinates

$('#results').on('click', function(e) {
  /* we only need additional 6 points for our score.
   *  points are:
   *  top of the head, bottom of chin, top of nose
   *  top left ear, bottom left ear,
   *  top right ear, bottom right */

  if(manualCoords.length < 7) {
    getPosition(e);
  }

  // on the 6th click, process results and show result panel
  if(manualCoords.length == 7) {
    $('#results-holder').addClass('col-md-4').fadeIn();
    $('#video-holder').removeClass('col-md-offset-3').addClass('col-md-offset-1');

    determineManualPoints();
  }
});

function determineManualPoints() {
  var yMax = Math.max.apply(null, manualCoords.map(function(coords) { return coords.y }));
  var yMin = Math.min.apply(null, manualCoords.map(function(coords) { return coords.y }));
  var xMax = Math.max.apply(null, manualCoords.map(function(coords) { return coords.x }));
  var xMin = Math.min.apply(null, manualCoords.map(function(coords) { return coords.x }));

  // get top of head
  manualCoords.map(function(coords) {
    if(coords.y == yMin) {
      faceCoordinates.topOfForehead = coords;
    }

    if(coords.y == yMax) {
      faceCoordinates.bottomOfChin = coords;
    }
  });
  // remove top of head from array
  manualCoords = $.grep(manualCoords, function(el, idx) {return el.y == yMin}, true);
  // remove chin from array
  manualCoords = $.grep(manualCoords, function(el, idx) {return el.y == yMax}, true);

  // rearrange objects
  manualCoords.sort(function(a, b) {
    return parseFloat(a.x) - parseFloat(b.x);
  });

  var leftEarCoords = manualCoords.splice(0, 2);
  console.log(leftEarCoords);

  if(leftEarCoords[0].y >= leftEarCoords[1].y) {
    faceCoordinates.leftEarTop = leftEarCoords[0];
    faceCoordinates.leftEarBottom = leftEarCoords[1];
  } else {
    faceCoordinates.leftEarTop = leftEarCoords[1];
    faceCoordinates.leftEarBottom = leftEarCoords[0];
  }

  console.log(faceCoordinates);
  // faceCoordinates.push({
  //   "leftEarTop": { "x": manualCoords[0].x, "y": coords.y }
  // });

  console.log('sup');
  $.each(manualCoords, function(key, val) {
      console.log(val);
  });
}

function drawFaceCoordinates(data) {
  var flm = data[0].faceLandmarks;

  $.each(flm, function(key, val) {
    drawCoordinates(val.x, val.y);
  });
}

function getPosition(event){
     var rect = canvas.getBoundingClientRect();
     var x = event.clientX - rect.left;
     var y = event.clientY - rect.top;

     manualCoords.push({ 'x': x, 'y': y });
     console.log({ 'x': x, 'y': y });
     drawCoordinates(x,y);
}

function drawCoordinates(x,y){
  	var ctx = document.getElementById("canvas").getContext("2d");


  	ctx.fillStyle = "#ff2626"; // Red color

    ctx.beginPath();
    ctx.arc(x, y, pointSize, 0, Math.PI * 2, true);
    ctx.fill();
}

// END drawing face coordinates
