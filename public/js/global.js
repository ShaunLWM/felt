$(document).ready(function () {
    M.AutoInit();

    $('#editor').froalaEditor({
        // Set the image upload parameter.
        imageUploadParam: 'image',

        // Set the image upload URL.
        imageUploadURL: '/admin/upload',

        // Additional upload params.
        imageUploadParams: { id: 'my_editor' },

        // Set request type.
        imageUploadMethod: 'POST',

        // Set max image size to 5MB.
        imageMaxSize: 5 * 1024 * 1024,

        // Allow to upload PNG and JPG.
        imageAllowedTypes: ['jpeg', 'jpg', 'png']
    })
        .on('froalaEditor.image.beforeUpload', function (e, editor, images) {
            // Return false if you want to stop the image upload.
        })
        .on('froalaEditor.image.uploaded', function (e, editor, response) {
            // Image was uploaded to the server.
        })
        .on('froalaEditor.image.inserted', function (e, editor, $img, response) {
            // Image was inserted in the editor.
        })
        .on('froalaEditor.image.replaced', function (e, editor, $img, response) {
            // Image was replaced in the editor.
        })
        .on('froalaEditor.image.error', function (e, editor, error, response) {
            // Bad link.
            if (error.code == 1) { }

            // No link in upload response.
            else if (error.code == 2) { }

            // Error during image upload.
            else if (error.code == 3) { }

            // Parsing response failed.
            else if (error.code == 4) { }

            // Image too text-large.
            else if (error.code == 5) { }

            // Invalid image type.
            else if (error.code == 6) { }

            // Image can be uploaded only to same domain in IE 8 and IE 9.
            else if (error.code == 7) { }

            // Response contains the original server response to the request if available.
        });

    $('#submit').on('click', function (e) {
        let error = $('#error_text');
        e.preventDefault();
        let tags = $('#post_tags').val().trim();
        let title = $('#post_title').val().trim();
        let body = $('#editor').val();
        if (title.length < 1) {
            return error.text('Title cannot be empty').css('display', 'block');
        }

        if (body.length < 1) {
            return error.text('Content cannot be empty').css('display', 'block');
        }

        error.text('').css('display', 'hidden');
        $('input').attr('disabled', true);
        $.post("/admin/new", {
            tags, title, body
        }, function (data) {
            M.toast({ html: 'Successfully posted. Refreshing in 5s..', duration: 10000 });
            setTimeout(() => {
                location.reload();
            }, 5000);
        }).fail(function (data) {
            $('input').attr('disabled', false);
            alert(data);
        });
    });
});