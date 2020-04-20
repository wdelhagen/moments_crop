window.onload = function() {
    'use strict';

    // test with big uncropped album
    // getAlbumAjax("/album/"+"Mv46AWp44zd8QTLs9", populateAlbum);

    if ($("#collect_album").length > 0) {
      album = $("#collect_album");
    } else {
      album = $("#crop_album");
      isCrop = true;
      console.log(isCrop);
    }

    loadAlbumFromCookie();

}

const albumAPI = "/album/"
const regex = /https:\/\/photos\.app\.goo\.gl\/([a-zA-Z0-9\-_]*)/i;
const test_link = "https://photos.app.goo.gl/QWsU1knpjTjcr9Pb9";
const test_uncropped_link = "https://photos.app.goo.gl/Mv46AWp44zd8QTLs9"

var album;
var isCrop = false;

function loadAlbumFromCookie() {
  var cookieAlbum = getCookie("album");
  if (cookieAlbum.length > 0) {
    $("#albumLink").val(cookieAlbum);
    loadAlbum(cookieAlbum);
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

function checkImages(photos, imgMeta) {

}

function addPhoto(album, src, obj) {
  src += "=w2048";
  ratio = obj.ratio;
  var addClass="";
  var cropError = 0;
  var orientation = "horizontal";
  if (ratio >= 1) {
    cropError = Math.abs(ratio - 1.5);
    orientation = "horizontal";
  } else {
    cropError = Math.abs(ratio - 1/3);
    orientation = "vertical";
  }
  if (isCrop && cropError > 0.1) {
    addClass += "needsCrop";
  }
  if (obj.ratio < 1) {
    album.append(
       `<div class="col-3 card_frame_${orientation}">
          <div class="image_frame_${orientation}">
            <img class="card_image_${orientation}" src="${src}">
            <img class="card_stack_img_vertical ${addClass}" src="assets/img/print_mask_${orientation}.png" >
          </div>
        </div>`
    );
  } else {
    album.append(
       `<div class="col-4 card_frame_${orientation}">
          <div class="image_frame_${orientation}">
            <img class="card_image_${orientation}" src="${src}">
            <img class="card_stack_img_horizontal ${addClass}" src="assets/img/print_mask_${orientation}.png" >
          </div>
        </div>`
    );
  };
}

function populateImages(imgStore) {
  for (const key in imgStore) {
    if (imgStore[key].ratio >= 1) {
      addPhoto(album, key, imgStore[key]);
    };
  }
  for (const key in imgStore) {
    if (imgStore[key].ratio < 1) {
      addPhoto(album, key, imgStore[key]);
    };
  }
  // setTimeout(function(){ addFrames(); }, 500);
}

function populateAlbum(result) {
  var photos = result;
  var imgStore = new Object();
  var imgCount = 0;

  photos.forEach(function(item){
    var img = new Image();
    img.src = item;
    imgStore[item] = {"img" : img}
    img.onload = function () {
      imgStore[this.src] = {"ratio" : this.width / this.height};
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
  var result = link.match(regex);
  if (result) {
    document.cookie = "album="+link;
    album.empty();
    const key = result[1];
    url = albumAPI + key;
    getAlbumAjax(url, populateAlbum);
    $("#loadAlbum").html("Reload Album");
    $("#loadAlbum").removeClass("btn-success");
    $("#loadAlbum").addClass("btn-warning");
  } else {
    alert("Unable to find Google Photos album from that link. Please check it and try again.")
  }
}

$("#loadAlbum").click(function() {
  var link = $("#albumLink").val();
  loadAlbum(link);
});
