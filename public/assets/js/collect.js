window.onload = function() {
    'use strict';
}

const albumAPI = "/album/"
const regex = /https:\/\/photos\.app\.goo\.gl\/([a-zA-Z0-9\-_]*)/i;
const test_link = "https://photos.app.goo.gl/QWsU1knpjTjcr9Pb9";

function addFrames() {
  $(".image_frame").each(function () {
    if ($(this).width() > $(this).height()) {
      $(this).append(`<img class="card_stack_img" src="assets/img/print_mask_horizontal.png" >`);
    } else {
      $(this).append(`<img class="card_stack_img" src="assets/img/print_mask_vertical.png" >`);
    }
  });
}

function getMeta(url, callback) {
    var img = new Image();
    img.src = url;
    img.onload = function() { callback(this.width, this.height); }
}

function checkImages(photos, imgMeta) {

}

function addPhoto(album, src) {
  src += "=w2048";
  album.append(
     `<div class="col-4 card_frame">
        <div class="image_frame">
          <img class="card_image" src="${src}">
        </div>
      </div>`
  );
}

function populateImages(imgStore) {
  album = $("#album");
  for (const key in imgStore) {
    if (imgStore[key].ratio >= 1) {
      addPhoto(album, key);
    };
  }
  for (const key in imgStore) {
    if (imgStore[key].ratio < 1) {
      addPhoto(album, key);
    };
  }
  addFrames();
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
