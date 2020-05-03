window.onload = function() {
    'use strict';

    // test with big uncropped album
    // getAlbumAjax("/album/"+"Mv46AWp44zd8QTLs9", populateAlbum);

    if ($("#gallery_album").length > 0) {
      album = $("#gallery_album");
      isCrop = true;
    } else {
      album = $("#crop_album");
      isCrop = true;
    }

    loadAlbumFromCookie();

}

// https://www.icloud.com/sharedalbum/#B0k532ODWGQsi8U

// const albumAPI = "/album/"
const googleAlbumAPI = "/googlealbum/"
const icloudAlbumAPI = "/icloudalbum/"
const googleregex = /https:\/\/photos\.app\.goo\.gl\/([a-zA-Z0-9\-_]*)/i;
const icloudregex = /https:\/\/www\.icloud\.com\/sharedalbum\/#([a-zA-Z0-9\-_]*)/i;
const combinedregex = /https:\/\/photos\.app\.goo\.gl\/([a-zA-Z0-9\-_]*)|https:\/\/www\.icloud\.com\/sharedalbum\/#([a-zA-Z0-9\-_]*)/i;
const test_link = "https://photos.app.goo.gl/QWsU1knpjTjcr9Pb9";
const test_uncropped_link = "https://photos.app.goo.gl/Mv46AWp44zd8QTLs9"
const imageRatio = 1.5;
const imageRatioMargin = 0.1;
const blankImage = "assets/img/blank_image.png";
const minNumImages = 12;

var album;
var isCrop = false;

var icloudphoto;

function loadAlbumFromCookie() {
  var cookieAlbum = getCookie("album");
  if (cookieAlbum.length > 0) {
    $("#albumLink").val(cookieAlbum);
    try {
      loadAlbum(cookieAlbum);
      $("#loadAlbum").html("Reload Album");
      $("#new_album").hide();
      $("#create").css("display", "flex");
    }
    catch (e) {
      console.log("Cookie contained 'album' value, but link failed to load.")
    }
  }
}

function getCookie(cname) {
  var name = cname + "=";
  var decodedCookie = decodeURIComponent(document.cookie);
  var ca = decodedCookie.split(';');
  for(var i = 0; i <ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

function addFrames() {
  $(".image_frame_horizontal").each(function () {
    $(this).append(`<img class="card_stack_img_horizontal" src="assets/img/print_mask_horizontal.png" >`);
  });
  $(".image_frame_vertical").each(function () {
    $(this).append(`<img class="card_stack_img_vertical" src="assets/img/print_mask_vertical.png" >`);
  });
}

function getMeta(url, callback) {
    var img = new Image();
    img.src = url;
    img.onload = function() { callback(this.width, this.height); }
}

function addPhoto(album, obj) {
  ratio = obj.ratio;
  var addClass="";
  var cropError = 0;
  var orientation = "horizontal";
  if (ratio >= 1) {
    cropError = Math.abs(ratio - imageRatio);
    orientation = "horizontal";
  } else {
    cropError = Math.abs(1/ratio - imageRatio);
    orientation = "vertical";
  }
  if (isCrop && cropError > imageRatioMargin) {
    addClass += "needsCrop";
  }
  var outerDiv = $(`<div class="card_frame my-auto ${orientation}"></div>`);
  var innerDiv = $(`<div class="gallery_frame ${orientation} ${addClass}"> </div>`)
  var img = obj.img;
  $(img).addClass(`gallery_image ${orientation}`);
  innerDiv.append(img);
  outerDiv.append(innerDiv);
  album.append(outerDiv);
}

function populateImages(imgStore) {
  for (const key in imgStore) {
    if (!imgStore[key].blank && imgStore[key].ratio >= 1) {
      addPhoto(album, imgStore[key]);
    };
  }
  for (const key in imgStore) {
    if (!imgStore[key].blank && imgStore[key].ratio < 1) {
      addPhoto(album, imgStore[key]);
    };
  }
  for (const key in imgStore) {
    if (imgStore[key].blank) {
      addPhoto(album, imgStore[key]);
    };
  }
  // setTimeout(function(){ addFrames(); }, 500);
}

function populateAlbum(result) {
  var photos = result;
  var numBlanks = 0;
  var imgStore = new Object();
  var imgCount = 0;
  if (photos.length < minNumImages) {
    numBlanks = minNumImages - photos.length;
  }
  album.empty();
  if (numBlanks > 0) {
    var i;
    for (i = 0; i < numBlanks; i++) {
      photos.push(blankImage);
    }
  }
  photos.forEach(function(item, index){
    var img = new Image();
    img.src = item;
    imgStore[index] = {"img" : img}
    if (item == blankImage) {
      imgStore[index].blank = true;
    }
    img.onload = function () {
      imgStore[index].ratio = this.width / this.height;
      imgCount++;
      if (imgCount == photos.length) {
        populateImages(imgStore);
      }
    }
  })
}

function getAlbumAjax(url, onSuccess){
  $.ajax({
    url: url,
    type:"GET",
    success: onSuccess,
    error: function(error){
      console.log(`Error${error}`);
    }});
}

function loadAlbum(link) {
  var result = link.match(combinedregex);
  if (result) {
    document.cookie = "album="+link;
    if (result[1]) {
      url = googleAlbumAPI + result[1];
      getAlbumAjax(url, populateAlbum);
    } else if (result[2]) {
      url = icloudAlbumAPI + result[2];
      getAlbumAjax(url, populateAlbum);
    }
    $("#loadAlbum").html("Reload Album");
    $("#loadAlbum").removeClass("btn-success");
    $("#loadAlbum").addClass("btn-primary");
    $("#albumLink").val(link);
    $("#your_album").attr("href", link);
  }
  else {
    throw 'InvalidAlbumLink';
  }
}

$("#albumLink").click(function() {
  this.select();
  $("#loadAlbum").html("Load Album");
  $("#loadAlbum").removeClass("btn-primary");
  $("#loadAlbum").addClass("btn-success");
});

$("#newAlbumLink").click(function() {
  this.select();
});

$("#loadAlbum").click(function() {
  var link = $("#albumLink").val();
  try {
    loadAlbum(link);
  }
  catch (e) {
    alert("Unable to find album at that link. Please check it and try again.")
  }
});

$("#newAlbum").click(function() {
  var link = $("#newAlbumLink").val();
  try {
    loadAlbum(link);
    $("#new_album").hide();
    $("#create").css("display", "flex");
  }
  catch (e) {
    alert("Unable to find album at that link. Please check it and try again.")
  }
});
