window.onload = function() {
    'use strict';
    getAlbumAjax(populateAlbum);

}



function addPhoto(album, src) {
  album.append(
    `<div class="gphoto">
      <img src=${src}>
    </div>`
  )
}

function populateAlbum(result) {
  var photos = result;
  album = $("#album");
  photos.forEach(function(item){
    addPhoto(album, item);
  })
  $("#gphoto").attr("src", photos[0]);
  console.log(result);
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
