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
  var outerDiv = $(`<div class="col-4 card_frame my-auto"></div>`);
  var innerDiv = $(`<div class="gallery_frame ${orientation} ${addClass}"> </div>`)
  var img = obj.img;
  $(img).addClass(`gallery_image ${orientation}`);
  innerDiv.append(img);
  outerDiv.append(innerDiv);
  album.append(outerDiv);

  // var outerDiv = $(`<div class="col-3 card_frame my-auto"></div>`)
  // var middleDiv = $(`<div class="gallery_frame ${orientation}"> </div>`)
  // var innerDiv = $(`<div class="image_holder ${orientation}"> </div>`)
  // var img = obj.img;
  // $(img).addClass(`gallery_image ${orientation}`);
  // innerDiv.append(img);
  // middleDiv.append(innerDiv);
  // outerDiv.append(middleDiv);
  // album.append(outerDiv);


  // if (obj.ratio < 1) {
  //   // var outerDiv = $(`<div class="col-3 card_frame_${orientation}"></div>`)
  //   var innerDiv = $(`<div class="gallery_frame ${orientation}"> </div>`)
  //   var img = obj.img;
  //   $(img).addClass(`gallery_image_${orientation}`);
  //   // var maskImage = $(`<img class="card_stack_img_${orientation} ${addClass}" src="assets/img/print_mask_${orientation}.png" >`);
  //   innerDiv.append(img);
  //   // innerDiv.append(maskImage);
  //   outerDiv.append(innerDiv);
  //   album.append(outerDiv);
  //   // album.append(
  //   //    `<div class="col-3 card_frame_${orientation}">
  //   //       <div class="image_frame_${orientation}">
  //   //         <img class="card_image_${orientation}" src="${src}">
  //   //         <img class="card_stack_img_vertical ${addClass}" src="assets/img/print_mask_${orientation}.png" >
  //   //       </div>
  //   //     </div>`
  //   // );
  // } else {
  //   // var outerDiv = $(`<div class="col-3 card_frame_${orientation}"></div>`)
  //   var innerDiv = $(`<div class="gallery_frame ${orientation}"> </div>`)
  //   var img = obj.img;
  //   $(img).addClass(`gallery_image_${orientation}`);
  //   // var maskImage = $(`<img class="card_stack_img_${orientation} ${addClass}" src="assets/img/print_mask_${orientation}.png" >`);
  //   innerDiv.append(img);
  //   // innerDiv.append(maskImage);
  //   outerDiv.append(innerDiv);
  //   album.append(outerDiv);
  //   // album.append(
  //   //    `<div class="col-4 card_frame_${orientation}">
  //   //       <div class="image_frame_${orientation}">
  //   //         <img class="card_image_${orientation}" src="${src}">
  //   //         <img class="card_stack_img_horizontal ${addClass}" src="assets/img/print_mask_${orientation}.png" >
  //   //       </div>
  //   //     </div>`
  //   // );
  // };
}

function populateImages(imgStore) {
  for (const key in imgStore) {
    if (imgStore[key].ratio >= 1) {
      addPhoto(album, imgStore[key]);
    };
  }
  for (const key in imgStore) {
    if (imgStore[key].ratio < 1) {
      addPhoto(album, imgStore[key]);
    };
  }
  // setTimeout(function(){ addFrames(); }, 500);
}

function populateAlbum(result) {
  var photos = result;
  console.log(result);
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
    // album.append(img)
    imgStore[index] = {"img" : img}
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
  $("#loadAlbum").html("Reload Album");
  $("#loadAlbum").removeClass("btn-success");
  $("#loadAlbum").addClass("btn-warning");
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
  }
  else {
    alert("Unable to find album at that link. Please check it and try again.")
  }
}

$("#albumLink").click(function() {
  this.select();
  $("#loadAlbum").html("Load Album");
  $("#loadAlbum").removeClass("btn-warning");
  $("#loadAlbum").addClass("btn-success");
});

$("#loadAlbum").click(function() {
  var link = $("#albumLink").val();
  loadAlbum(link);
});
