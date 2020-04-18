window.onload = function() {
    'use strict';
    getAlbumAjax(populateAlbum);

}



function addPhoto(album, src) {
  src += "=w2048";
  album.append(
    `<div class="col-4 card_frame">
      <img class="card_image" src="${src}">
    </div>`
  )
}

function populateAlbum(result) {
  var photos = result;
  album = $("#album");
  photos.forEach(function(item){
    addPhoto(album, item);
  })
}

function getAlbumAjax(onSuccess){
  $.ajax({
    url: "/album/QWsU1knpjTjcr9Pb9",
    type:"GET",
    success: onSuccess,
    error: function(error){
      console.log(`Error${error}`);
    }});
}
