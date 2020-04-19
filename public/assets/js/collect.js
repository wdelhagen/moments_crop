window.onload = function() {
    'use strict';

    // test with big uncropped album
    // getAlbumAjax("/album/"+"Mv46AWp44zd8QTLs9", populateAlbum);
}

const albumAPI = "/album/"
const regex = /https:\/\/photos\.app\.goo\.gl\/([a-zA-Z0-9\-_]*)/i;
const test_link = "https://photos.app.goo.gl/QWsU1knpjTjcr9Pb9";
const test_uncropped_link = "https://photos.app.goo.gl/Mv46AWp44zd8QTLs9"

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

function addPhoto(album, orientation, src) {
  src += "=w2048";
  if (orientation == "vertical") {
    album.append(
       `<div class="col-3 card_frame_${orientation}">
          <div class="image_frame_${orientation}">
            <img class="card_image_${orientation}" src="${src}">
          </div>
        </div>`
    );
  } else {
    album.append(
       `<div class="col-4 card_frame_${orientation}">
          <div class="image_frame_${orientation}">
            <img class="card_image_${orientation}" src="${src}">
          </div>
        </div>`
    );
  };
}

function populateImages(imgStore) {
  album = $("#album");
  for (const key in imgStore) {
    if (imgStore[key].ratio >= 1) {
      addPhoto(album, "horizontal", key);
    };
  }
  for (const key in imgStore) {
    if (imgStore[key].ratio < 1) {
      addPhoto(album, "vertical", key);
    };
  }
  setTimeout(function(){ addFrames(); }, 500);
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

$("#loadAlbum").click(function() {
  var link = $("#albumLink").val();
  var result = link.match(regex);
  if (result) {
    $("#album").empty();
    const key = result[1];
    url = albumAPI + key;
    getAlbumAjax(url, populateAlbum);
  } else {
    alert("Unable to find Google Photos album from that link. Please check it and try again.")
  }

});
