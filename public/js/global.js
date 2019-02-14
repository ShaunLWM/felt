$(document).ready(function () {
    M.AutoInit();

    $("#panel-post-edit, #panel-post-delete, #panel-post-archive").on("click", function (e) {
        e.preventDefault();
        let slug = $(this).parent().data("slug");
        console.log(slug);
        switch ($(this).attr("id")) {
            case "panel-post-edit":
                break;
            case "panel-post-delete":
                break;
            case "panel-post-archive":
                $.post("/action", { action: "archive", slug }, () => {
                    return $(this).parent().parent().remove();
                }).fail(function (e) {
                    if (typeof e["responseJSON"] !== "undefined" && typeof e["responseJSON"]["message"] !== "undefined") {
                        return alert(e["responseJSON"]["message"]);
                    }

                    return alert("Error archiving post");
                });
                break;
        }
    });

    $("#setup-input-protect-enabled").on("change", function (e) {
        if (this.checked) {
            $("#setup-input-protect-password").attr("disabled", false);
            $("#setup-input-protect-salt").attr("disabled", false);
            $("#setup-input-protect-days").attr("disabled", false);
        } else {
            $("#setup-input-protect-password").attr("disabled", true);
            $("#setup-input-protect-salt").attr("disabled", true);
            $("#setup-input-protect-days").attr("disabled", true);
        }
    });

    $("#setup-button-submit").on("click", function (e) {
        e.preventDefault();
        let host = $("#setup-input-host").val();
        let title = $("#setup-input-title").val();
        let adminUsername = $("#setup-input-admin-username").val();
        let adminPassword = $("#setup-input-admin-password").val();
        let protectEnabled = $("#setup-input-protect-enabled").prop("checked");
        let protectPassword = $("#setup-input-protect-password").val();
        let protectSalt = $("#setup-input-protect-salt").val();
        let protectDays = $("#setup-input-protect-days").val();
        if (title.length < 1) {
            return alert("Default title cannot be empty");
        }

        if (adminUsername.length < 1) {
            return alert("Admin username cannot be empty");
        }

        if (adminPassword.length < 1) {
            return alert("Admin password cannot be empty");
        }

        if (protectEnabled && protectPassword.length < 1) {
            return alert("Password protect is enabled. Please enter a password.")
        }

        $.post("/setup", { host, title, adminUsername, adminPassword, protectEnabled, protectPassword, protectSalt, protectDays }, function () {
            return window.location.replace("/");
        }).fail(function (e) {
            if (typeof e["responseJSON"] !== "undefined" && typeof e["responseJSON"]["message"] !== "undefined") {
                return alert(e["responseJSON"]["message"]);
            }

            return alert("Error setting up");
        });
    });

    $("#submit-password-protected").on("click", function (e) {
        e.preventDefault();
        let password = $("#password-protected").val();
        if (password.length < 1) {
            return alert("Password cannot be empty");
        }

        $.post("/protected", { password }, function () {
            return window.location.replace("/");
        }).fail(function (e) {
            if (typeof e["responseJSON"] !== "undefined" && typeof e["responseJSON"]["message"] !== "undefined") {
                return alert(e["responseJSON"]["message"]);
            }

            return alert("Error submitting password");
        });
    })

    $("#button-update-aboutme").on("click", function (e) {
        e.preventDefault();
        $.post("/admin/update/aboutme", { aboutMe: $("#textarea-about-me").val() }, function () {
            location.reload();
        }).fail(function (e) {
            alert(JSON.stringify(e));
        });
    });

    $("#fileUpload").on("change", function () {
        let currentFile = $(this)[0].files[0];
        let imgPath = $(this)[0].value;
        let extn = imgPath.substring(imgPath.lastIndexOf(".") + 1).toLowerCase();
        let image_holder = $("#image-holder");
        image_holder.empty();
        let allowedExtensions = ["gif", "png", "jpg", "jpeg"];
        if (!allowedExtensions.includes(extn)) {
            return alert(`allowed filetypes: ${JSON.stringify(allowedExtensions)}`);
        }

        if (typeof FileReader === "undefined") {
            return alert("This browser does not support FileReader.");
        }

        let reader = new FileReader();
        reader.onload = function (e) {
            $("<img />", {
                "src": e.target.result,
                "class": "thumb-image",
                "style": "width: 100px"
            }).appendTo(image_holder);
        }

        image_holder.show();
        reader.readAsDataURL(currentFile);
        $("#button-upload-photos").on("click", function (e) {
            e.preventDefault();
            let formData = new FormData();
            formData.append("file-avatar", currentFile);
            $.ajax({
                url: "/admin/update/avatar",
                type: "POST",
                data: formData,
                contentType: false,
                processData: false,
                success: function (data) {
                    location.reload();
                },
                error: function (error) {
                    alert(error);
                }
            });
        });
    });

    $("#editor").froalaEditor({
        // Set the image upload parameter.
        imageUploadParam: "image",

        // Set the image upload URL.
        imageUploadURL: "/admin/upload",

        // Additional upload params.
        imageUploadParams: { id: "my_editor" },

        // Set request type.
        imageUploadMethod: "POST",

        // Set max image size to 5MB.
        imageMaxSize: 5 * 1024 * 1024,

        // Allow to upload PNG and JPG.
        imageAllowedTypes: ["jpeg", "jpg", "png"]
    })
        .on("froalaEditor.image.beforeUpload", function (e, editor, images) {
            // Return false if you want to stop the image upload.
        })
        .on("froalaEditor.image.uploaded", function (e, editor, response) {
            // Image was uploaded to the server.
        })
        .on("froalaEditor.image.inserted", function (e, editor, $img, response) {
            // Image was inserted in the editor.
        })
        .on("froalaEditor.image.replaced", function (e, editor, $img, response) {
            // Image was replaced in the editor.
        })
        .on("froalaEditor.image.error", function (e, editor, error, response) {
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

    $("#submit").on("click", function (e) {
        let error = $("#error_text");
        e.preventDefault();
        let tags = $("#post_tags").val().trim();
        let title = $("#post_title").val().trim();
        let body = $("#editor").val();
        if (title.length < 1) {
            return error.text("Title cannot be empty").css("display", "block");
        }

        if (body.length < 1) {
            return error.text("Content cannot be empty").css("display", "block");
        }

        error.text("").css("display", "hidden");
        $("input").attr("disabled", true);
        $("#editor").froalaEditor("edit.off");
        $.post("/admin/new", {
            tags, title, body
        }, function (data) {
            M.toast({ html: "Successfully posted. Refreshing in 5s..", duration: 10000 });
            setTimeout(() => {
                location.reload();
            }, 5000);
        }).fail(function (data) {
            $("input").attr("disabled", false);
            $("#editor").froalaEditor("edit.on");
            alert(data);
        });
    });

    $('input[name="checkbox_post_action"]').change(function () {
        console.log($(this).data("slug"));
    });
});