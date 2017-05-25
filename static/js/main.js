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


$(document).ready(function() {
    // Grab elements, create settings, etc.
    var video = document.getElementById('video');

    // Get access to the camera!
    if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // Not adding `{ audio: true }` since we only want video now
        navigator.mediaDevices.getUserMedia({ video: true }).then(function(stream) {
            video.src = window.URL.createObjectURL(stream);
            video.play();

            // startCapture();
        });
    }

    $('#capture').on('click', function() {
        capture();
    });

});



function capture() {
  console.log('capture');
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
  // console.log(imgByte.replace('data:image/jpeg;base64,', ''));
  sendToFaceApi(imgByte);
  // console.log(makeblob(imgByte));
  $.ajax({
      url: "/save-image",
      type: "POST",
      data: imgByte.replace('data:image/jpeg;base64,', ''),
      processData: false
  })
  // console.log(imgByte)
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

        // draw the dots to the face, then add beauty score

        // if(data[0]) {
        //     drawFaceRectangle(data);
        //     checkMatchedFaces(data);
        //     getAdsByDemographic(data[0].faceAttributes.age, data[0].faceAttributes.gender)
        // }

        // startCapture();
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

var drawFaceCoordinates = function(data) {

}

var drawFaceRectangle = function(data) {
    // console.log(data);

    var frect = data[0].faceRectangle;

    resultsContext.beginPath();
    resultsContext.rect(frect.left, frect.top, frect.width, frect.height );
    resultsContext.stroke();

    // input results text
    // $('#age').html(parseInt(data[0].faceAttributes.age))
    // $('#gender').html(data[0].faceAttributes.gender)
    // if(data[0].faceAttributes.glasses != 'NoGlasses') {
    //     $('#glasses').html('| Wearing ' + data[0].faceAttributes.glasses)
    // } else {
    //     $('#glasses').html('');
    // }
    // if(data[0].faceAttributes.smile > .5)
    //     $('#smile').html('| Smiling')
    //
    // $('.info-footer').show("slow");
    //
    // for (var i = 0; i < 2; i++) {
    //     randomColor = (function(m,s,c){return (c ? arguments.callee(m,s,c-1) : '#') + s[m.floor(m.random() * s.length)]})(Math,'0123456789ABCDEF',5)
    //     setTimeout(function() {
    //         $('<div class="offer-panel" style="background-color: '+randomColor+'">Test Offer</div>').hide()
    //                 .prependTo('#results-panel').show('slow');
    //
    //     }, 800 * i)
    // }

}
