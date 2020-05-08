window.onload = function() {
    'use strict';

    var clear = getUrlParameter('clear');

    if (clear === 'true') {
      document.cookie = "album=null";
      location.reload();
    }

    pageState = "collect";
    album = $("#gallery_album");
    $("#create").hide();
    $("#crop_step").hide();
    $("#create_step").hide();

    // test with big uncropped album
    // getAlbumAjax("/album/"+"Mv46AWp44zd8QTLs9", populateAlbum);

    loadAlbumFromCookie();

    // DEV
    // createStep();
    // $('#orderModal').modal();
    // cropStep();
}

// https://www.icloud.com/sharedalbum/#B0k532ODWGQsi8U

// 2 card album:  https://photos.app.goo.gl/xxUP9zWShUPUxGVA6
// Complete & cropped: https://photos.app.goo.gl/ZjZEWmW2bEDtJQrm6
// Crop test: https://photos.app.goo.gl/Mv46AWp44zd8QTLs9


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
const cardBack = "assets/img/B0006.png";
const numCards = 12;
const flipDelayms = 150;

const redX = `<svg class="bi bi-x-circle" width="1em" height="1em" viewBox="0 0 16 16" fill="red" xmlns="http://www.w3.org/2000/svg">
                      <path fill-rule="evenodd" d="M8 15A7 7 0 108 1a7 7 0 000 14zm0 1A8 8 0 108 0a8 8 0 000 16z" clip-rule="evenodd"/>
                      <path fill-rule="evenodd" d="M11.854 4.146a.5.5 0 010 .708l-7 7a.5.5 0 01-.708-.708l7-7a.5.5 0 01.708 0z" clip-rule="evenodd"/>
                      <path fill-rule="evenodd" d="M4.146 4.146a.5.5 0 000 .708l7 7a.5.5 0 00.708-.708l-7-7a.5.5 0 00-.708 0z" clip-rule="evenodd"/>
                    </svg>`
const greenCheck = `<svg class="bi bi-check" width="1em" height="1em" viewBox="0 0 16 16" fill="green" xmlns="http://www.w3.org/2000/svg">
                      <path fill-rule="evenodd" d="M13.854 3.646a.5.5 0 010 .708l-7 7a.5.5 0 01-.708 0l-3.5-3.5a.5.5 0 11.708-.708L6.5 10.293l6.646-6.647a.5.5 0 01.708 0z" clip-rule="evenodd"/>
                    </svg>`

var album;
var pageState = "";
var albumLink = "";
var numImages = 0;
var numCrops = 0;
var currImages = "";
var albumIsLoading = false;
var loadingTimeout;
var imgStore = new Object();
var flipTimeouts = new Array();
var backID = "";

var icloudphoto;

window.addEventListener('focus', pollAlbum);

function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
};

// Check the album
// Fired on the window getting focus
function pollAlbum() {
  // console.log("Checking album");
  if (albumLink != "") {
    loadAlbum(albumLink);
  }
}

function loadAlbumFromCookie() {
  var cookieAlbum = getCookie("album");
  if (cookieAlbum.length > 0) {
    try {
      loadAlbum(cookieAlbum);
      $("#new_album").hide();
      $("#create").show();
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

function addImage(album, obj) {
  var ratio = obj.ratio;
  var addData="";
  addData = obj.addData;
  var orientation = "horizontal";
  if (ratio >= 1) {
    orientation = "horizontal";
  } else {
    orientation = "vertical";
  }
  var containerDiv = $(`<div class="card_container ${orientation}"></div>`);
  var outerDiv = $(`<div class="card_frame ${orientation}"></div>`);
  var anchor = $(`<a class="card_anchor" href="${albumLink}" target="_blank"></a>`);
  var cardFrontDiv = $(`<div class="gallery_frame ${orientation} card_front" ${addData}> </div>`)
  var imgFront = obj.img;
  $(imgFront).addClass(`gallery_image ${orientation}`);
  cardFrontDiv.append(imgFront);
  outerDiv.append(cardFrontDiv);
  anchor.append(outerDiv);
  containerDiv.append(anchor);
  album.append(containerDiv);
}

function addBack(elt, backID) {
  var orientation = "";
  var imgURL = "";
  if ($(elt).hasClass("horizontal")) {
    orientation = "horizontal";
  } else {
    orientation = "vertical";
  }
  imgURL = `assets/img/${backID}_${orientation}.png`;
  var imgBack = new Image();
  imgBack.src = imgURL;
  $(imgBack).addClass(`gallery_image ${orientation} card_back`);
  var cardBackDiv = $(`<div class="gallery_frame ${orientation} animate card_back"> </div>`)
  cardBackDiv.append(imgBack);
  // if it already exists, just change the img src
  var currDiv = $(elt).find(".gallery_frame.card_back")
  if (currDiv.length != 0) {
    $(currDiv).remove();
  }
  $(elt).append(cardBackDiv);
}

function addBacks(backID) {
  $(".gallery").find(".card_frame").each(function () {
    addBack(this, backID)
  });
}

function populateImages(imgStore) {
  numImages = 0;
  numCrops = 0;
  album.empty();
  for (const key in imgStore) {
    if (!imgStore[key].blank && imgStore[key].ratio >= 1) {
      var cropError = Math.abs(imgStore[key].ratio - imageRatio);
      if (cropError > imageRatioMargin) {
        imgStore[key].addData = "data-crop='1'";
        numCrops++;
      }
      numImages++;
      addImage(album, imgStore[key]);
    };
  }
  for (const key in imgStore) {
    if (!imgStore[key].blank && imgStore[key].ratio < 1) {
      var cropError = Math.abs(1/imgStore[key].ratio - imageRatio);
      if (cropError > imageRatioMargin) {
        imgStore[key].addData = "data-crop='1'";
        numCrops++;
      }
      numImages++;
      addImage(album, imgStore[key]);
    };
  }
  for (const key in imgStore) {
    if (imgStore[key].blank) {
      addImage(album, imgStore[key]);
    };
  }
  doneLoading();
  // setTimeout(function(){ addFrames(); }, 500);
}

function populateAlbum(result) {
  var images = result;
  var newImages = JSON.stringify(images);
  if (currImages === newImages) {
    // console.log("No change in album");
    doneLoading();
    return;
  }
  currImages = newImages;
  var numBlanks = 0;
  for (var item in imgStore) delete imgStore[item];
  var imgCount = 0;
  if (images.length < numCards) {
    numBlanks = numCards - images.length;
  }
  if (numBlanks > 0) {
    var i;
    for (i = 0; i < numBlanks; i++) {
      images.push(blankImage);
    }
  }
  images.forEach(function(item, index){
    var img = new Image();
    img.src = item;
    imgStore[index] = {"img" : img}
    if (item == blankImage) {
      imgStore[index].blank = true;
    }
    img.onload = function () {
      imgStore[index].ratio = this.width / this.height;
      imgCount++;
      if (imgCount == images.length) {
        try {
          populateImages(imgStore);
        }
        catch(e) {
          console.log(`Error ${e} when loading album.`)
          doneLoading();
        }
      }
    }
  })
}

function getAlbumAjax(url, onSuccess){
  // console.log("Requesting album from server.");
  $.ajax({
    url: url,
    type:"GET",
    cache: false,
    timeout: 5000,
    success: onSuccess,
    error: function(error){
      doneLoading();
      console.log(`Error${error}`);
    }});
}

function isLoading() {
  albumIsLoading = true;
  loadingTimeout = setTimeout(doneLoading, 10000)
  document.cookie = "album="+albumLink;
  $("#loadAlbum").html(`<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
  <span class="sr-only">Loading...</span>`);
  $("#albumLink").val(albumLink);
  $("#your_album").attr("href", albumLink);
}

function doneLoading() {
  albumIsLoading = false;
  clearTimeout(loadingTimeout);
  $("#loadAlbum").html("Reload album");
  $("#loadAlbum").removeClass("btn-success");
  $("#loadAlbum").addClass("btn-primary");
  if (pageState === "collect" || numImages < numCards) {
    collectStep();
    return
  }
  if (pageState === "crop" || numCrops != 0) {
    cropStep();
    return;
  }
  createStep();
}

function loadAlbum(link) {
  var result = link.match(combinedregex);
  if (result) {
    albumLink = link;
    if (albumIsLoading) {
      console.log("Request canceled -- already checking album.");
      return;
    }
    isLoading();
    if (result[1]) {
      url = googleAlbumAPI + result[1];
      getAlbumAjax(url, populateAlbum);
    } else if (result[2]) {
      url = icloudAlbumAPI + result[2];
      getAlbumAjax(url, populateAlbum);
    }
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
  if (link == "clear") {
    document.cookie = "album=null";
    location.reload();
    return;
  }
  try {
    loadAlbum(link);
  }
  catch (e) {
    alert("Unable to find album at that link. Please check it and try again.")
  }
});

function collectStep() {
  $("#create_progress").css("width", "25%");
  $("#btn_next_step").html("Next step");
  $("#crop_step").hide();
  $("#create_step").hide();
  $("#collect_step").show();
  if (numImages < numCards) {
    $("#btn_next_step").addClass("disabled");
    $("#state_text").html(redX + ` You need ${numCards - numImages} more images.`)
  } else {
    $("#btn_next_step").removeClass("disabled");
    $("#state_text").html(greenCheck + ` Complete album!`)
  }
  pageState = "collect";
}

function cropStep() {
  var stateText = ""
  var disabled = false;
  $("#create_progress").css("width", "50%");
  $("#btn_next_step").html("Next step");
  $("#create_step").hide();
  $("#collect_step").hide();
  $("#crop_step").show();
  if (numCrops > 0) {
    $('.gallery_frame[data-crop="1"]').addClass('needsCrop');
    disabled = true;
    stateText = redX + ` ${numCrops} images to crop.<br />`;
  } else {
    stateText = greenCheck + ` Done cropping!<br />`;
  }
  if (numImages > numCards) {
    disabled = true;
    stateText += redX + ` ${numImages - numCards} too many images.`;
  } else {
    stateText += greenCheck + ` ${numImages} images!`;
  }
  if (disabled) {
    $("#btn_next_step").addClass("disabled");
  } else {
    $("#btn_next_step").removeClass("disabled");
  }
  $("#state_text").html(stateText);
  pageState = "crop";
}

function addBackgroundImages() {
  // src = $(this).find('img').attr('src');
  // $(this).find('img').hide();
  // // $(this).addClass("animate");
  // $(this).css("background-image", `url("${src}")`);
  // $(this).css("background-size", "cover");
}

function doFlip(index) {
  delay = flipDelayms*index;
  var t1, t2;
  t1 = setTimeout(function() {
    $(this).addClass("flip")
  }.bind(this), delay);
  t2 = setTimeout(function() {
    $(this).removeClass("flip")
  }.bind(this), 2500+delay);
  flipTimeouts.push(t1, t2);
}

function flipAll() {
  $(".gallery").find(".card_frame").each(doFlip);
}

function createStep() {
  var stateText = "";
  var disabled = true;
  $("#collect_step").hide();
  $("#crop_step").hide();
  $("#create_step").show();
  $("#btn_next_step").html("Order my cards");
  selectedCard = $(".backDesignRadio:checked");
  if (selectedCard[0]) {
    disabled = false;
    stateText += greenCheck + ` Designed!`;
    $("#create_progress").css("width", "100%");
  } else {
    stateText += redX + ` Choose a design.`;
    $("#create_progress").css("width", "75%");
  }
  if (disabled) {
    $("#btn_next_step").addClass("disabled");
  } else {
    $("#btn_next_step").removeClass("disabled");
  }
  $("#state_text").html(stateText);
  $(".gallery").find(".gallery_frame.card_front").each(addBackgroundImages);
  pageState = "create";
}

function addAnimation () {
  $(".gallery").find(".card_frame", ".gallery_frame").addClass("animate");
}

function interruptFlip() {
  while (flipTimeouts.length >0) {
    var elt = flipTimeouts.pop();
    clearTimeout(elt);
  }
  $(".gallery").find(".card_frame").removeClass("flip");
}

$(".backDesignRadio").click(function() {
  var selectedCard = $(".backDesignRadio:checked")[0];
  var stateText = "";
  if (selectedCard) {
    interruptFlip();
    backID = $(selectedCard).val();
    addBacks(backID);
    disabled = false;
    stateText += greenCheck + ` Designed!`;
    $("#create_progress").css("width", "100%");
    addAnimation();
    flipAll();
  } else {
    stateText += redX + `Choose a design for the back.`;
  }
  if (disabled) {
    $("#btn_next_step").addClass("disabled");
  } else {
    $("#btn_next_step").removeClass("disabled");
  }
  $("#state_text").html(stateText);
});

$("#btn_next_step").click(function() {
  if (pageState === "collect" && numImages >= numCards) {
    cropStep();
  } else if (pageState === "crop" && numCrops == 0) {
    createStep();
  } else if (pageState === "create" && numImages == numCards) {
    $("#album_link").val(albumLink);
    $("#back_id").val(backID);
    $('#orderModal').modal();
  }
});

$("#is_gift").change(function() {
  if ($(this).prop("checked") == true) {
    $("#recipient").show();
  } else {
    $("#recipient").hide();
  }
});

$("#clearAlbum").click(function() {
  document.cookie = "album=null";
  location.reload();
});

$("#newAlbum").click(function() {
  var link = $("#newAlbumLink").val();
  try {
    loadAlbum(link);
    $("#new_album").hide();
    $("#create").show();
  }
  catch (e) {
    alert("Unable to find album at that link. Please check it and try again.")
  }
});
