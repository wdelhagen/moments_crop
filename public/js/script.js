// const image = document.getElementById('image');
// const cropper = new Cropper(image, {
//   aspectRatio: 2 / 3.5,
//   crop(event) {
//     console.log(event.detail.x);
//     console.log(event.detail.y);
//     console.log(event.detail.width);
//     console.log(event.detail.height);
//     console.log(event.detail.rotate);
//     console.log(event.detail.scaleX);
//     console.log(event.detail.scaleY);
//   },
// });

// var $image = $('#image');
//
// $image.cropper({
//   aspectRatio: 3.5 / 2,
//   crop: function(event) {
//     console.log(event.detail.x);
//     console.log(event.detail.y);
//     console.log(event.detail.width);
//     console.log(event.detail.height);
//     console.log(event.detail.rotate);
//     console.log(event.detail.scaleX);
//     console.log(event.detail.scaleY);
//   }
// });
//
// // Get the Cropper.js instance after initialized
// var cropper = $image.data('cropper');

window.onload = function() {
    'use strict';

    // Keep the div and image mask over the preview sized properly as the preview
    // changes from horizontal to vertical
    var resizePreviewMask = function() {
        $('#previewMask').width($('#preview').width());
        $('#previewMask').height($('#preview').height());
        if ($('#previewMask').width() > $('#previewMask').height()) {
            $('#previewMaskImg').attr("src", "img/print_mask_horizontal.png");
            $('#downloadMaskImg').attr("src", "img/print_mask_horizontal.png");

        } else {
            $('#previewMaskImg').attr("src", "img/print_mask_vertical.png");
            $('#downloadMaskImg').attr("src", "img/print_mask_vertical.png");
        }
    };

    var Cropper = window.Cropper;
    var URL = window.URL || window.webkitURL;
    var container = document.querySelector('.img-container');
    var image = container.getElementsByTagName('img').item(0);
    var download = document.getElementById('download');
    var actions = document.getElementById('actions');
    var options = {
        aspectRatio: 1.5,
        preview: '.img-preview',
        ready: function(e) {
            console.log(e.type);
            // size the preview mask to fit in the preview div
            resizePreviewMask();
        },
        cropstart: function(e) {
            console.log(e.type, e.detail.action);
        },
        cropmove: function(e) {
            console.log(e.type, e.detail.action);
        },
        cropend: function(e) {
            console.log(e.type, e.detail.action);
        },
        crop: function(e) {
            var data = e.detail;

            console.log(e.type);
        },
        zoom: function(e) {
            console.log(e.type, e.detail.ratio);
        },
        viewMode: 0,
        dragMode: 'move'
    };
    var cropper = new Cropper(image, options);
    var originalImageURL = image.src;
    var uploadedImageType = 'image/jpeg';
    var uploadedImageName = 'cropped.jpg';
    var uploadedImageURL;
    var expansionFactor = 0.1;

    // Tooltip
    $('[data-toggle="tooltip"]').tooltip();

    // Buttons
    if (!document.createElement('canvas').getContext) {
        $('button[data-method="getCroppedCanvas"]').prop('disabled', true);
    }

    if (typeof document.createElement('cropper').style.transition === 'undefined') {
        $('button[data-method="rotate"]').prop('disabled', true);
        $('button[data-method="scale"]').prop('disabled', true);
    }

    // Download
    if (typeof download.download === 'undefined') {
        download.className += ' disabled';
        download.title = 'Your browser does not support download';
    }

    // Options
    actions.querySelector('.docs-toggles').onchange = function(event) {
        var e = event || window.event;
        var target = e.target || e.srcElement;
        var cropBoxData;
        var canvasData;
        var isCheckbox;
        var isRadio;

        if (!cropper) {
            return;
        }

        if (target.tagName.toLowerCase() === 'label') {
            target = target.querySelector('input');
        }

        isCheckbox = target.type === 'checkbox';
        isRadio = target.type === 'radio';

        if (isCheckbox || isRadio) {
            if (isCheckbox) {
                options[target.name] = target.checked;
                cropBoxData = cropper.getCropBoxData();
                canvasData = cropper.getCanvasData();

                options.ready = function() {
                    console.log('ready');
                    cropper.setCropBoxData(cropBoxData).setCanvasData(canvasData);
                };
            } else {
                options[target.name] = target.value;
                options.ready = function() {
                    console.log('ready');
                    // resize the preview mask when we switch orientation
                    resizePreviewMask();
                };
            }

            // Restart
            cropper.destroy();
            cropper = new Cropper(image, options);
        }
    };

    // Methods
    actions.querySelector('.docs-buttons').onclick = function(event) {
        var e = event || window.event;
        var target = e.target || e.srcElement;
        var cropped;
        var result;
        var input;
        var data;

        if (!cropper) {
            return;
        }

        while (target !== this) {
            if (target.getAttribute('data-method')) {
                break;
            }

            target = target.parentNode;
        }

        if (target === this || target.disabled || target.className.indexOf('disabled') > -1) {
            return;
        }

        data = {
            method: target.getAttribute('data-method'),
            target: target.getAttribute('data-target'),
            option: target.getAttribute('data-option') || undefined,
            secondOption: target.getAttribute('data-second-option') || undefined
        };

        cropped = cropper.cropped;

        if (data.method) {
            if (typeof data.target !== 'undefined') {
                input = document.querySelector(data.target);

                if (!target.hasAttribute('data-option') && data.target && input) {
                    try {
                        data.option = JSON.parse(input.value);
                    } catch (e) {
                        console.log(e.message);
                    }
                }
            }

            switch (data.method) {
                case 'rotate':
                    if (cropped && options.viewMode > 0) {
                        cropper.clear();
                    }

                    break;

                case 'getCroppedCanvas':
                    var d = cropper.getCropBoxData();
                    try {
                        data.option = JSON.parse(data.option);
                    } catch (e) {
                        console.log(e.message);
                    }

                    if (uploadedImageType === 'image/jpeg') {
                        if (!data.option) {
                            data.option = {};
                        }

                        data.option.fillColor = '#fff';
                    }

                    break;
            }

            result = cropper[data.method](data.option, data.secondOption);

            switch (data.method) {
                case 'rotate':
                    if (cropped && options.viewMode > 0) {
                        cropper.crop();
                    }

                    break;

                case 'scaleX':
                case 'scaleY':
                    target.setAttribute('data-option', -data.option);
                    break;

                case 'getCroppedCanvas':
                    if (result) {
                        // Bootstrap's Modal
                        // $('#getCroppedCanvasModal').modal().find('.modal-body').html("<img src='" + result.toDataURL(uploadedImageType) + "' width=200>");

                        if (!download.disabled) {
                            download.download = uploadedImageName;
                            // download.download = "MOMENTS_CARD.jpg";
                            download.href = result.toDataURL(uploadedImageType);
                            download.click();
                        }
                    }

                    break;

                case 'destroy':
                    cropper = null;

                    if (uploadedImageURL) {
                        URL.revokeObjectURL(uploadedImageURL);
                        uploadedImageURL = '';
                        image.src = originalImageURL;
                    }

                    break;
            }

            if (typeof result === 'object' && result !== cropper && input) {
                try {
                    input.value = JSON.stringify(result);
                } catch (e) {
                    console.log(e.message);
                }
            }
        }
    };

    document.body.onkeydown = function(event) {
        var e = event || window.event;

        if (e.target !== this || !cropper || this.scrollTop > 300) {
            return;
        }

        switch (e.keyCode) {
            case 37:
                e.preventDefault();
                cropper.move(-1, 0);
                break;

            case 38:
                e.preventDefault();
                cropper.move(0, -1);
                break;

            case 39:
                e.preventDefault();
                cropper.move(1, 0);
                break;

            case 40:
                e.preventDefault();
                cropper.move(0, 1);
                break;
        }
    };

    // Import image
    var inputImage = document.getElementById('inputImage');

    if (URL) {
        inputImage.onchange = function() {
            var files = this.files;
            var file;

            if (cropper && files && files.length) {
                file = files[0];

                if (/^image\/\w+/.test(file.type)) {
                    uploadedImageType = file.type;
                    uploadedImageName = file.name;

                    if (uploadedImageURL) {
                        URL.revokeObjectURL(uploadedImageURL);
                    }

                    image.src = uploadedImageURL = URL.createObjectURL(file);
                    cropper.destroy();
                    cropper = new Cropper(image, options);
                    inputImage.value = null;
                } else {
                    window.alert('Please choose an image file.');
                }
            }
        };
    } else {
        inputImage.disabled = true;
        inputImage.parentNode.className += ' disabled';
    }

    var IMAGE_MIME_REGEX = /^image\/(p?jpeg|gif|png)$/i;

    var loadMostRecentImageFromClipboard = function(file) {
        var reader = new FileReader();
        reader.onload = function(e) {
            var container = document.querySelector('.img-container');
            var img = container.getElementsByTagName('img').item(0);
            img.src = e.target.result;
            cropper.destroy();
            cropper = new Cropper(img, options);
        };
        reader.readAsDataURL(file);
    };

    document.onpaste = function(e) {
        var items = e.clipboardData.items;
        for (var i = 0; i < items.length; i++) {
            if (IMAGE_MIME_REGEX.test(items[i].type)) {
                loadMostRecentImageFromClipboard(items[i].getAsFile());
                return;
            }
        }
        e.preventDefault();
    }

};
