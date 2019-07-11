$(document).ready(function () {
    M.AutoInit();

    $("#form-import-zip").on("submit", function (e) {
        e.preventDefault();
        let formData = new FormData(this);
        $.ajax({
            type: 'POST',
            url: `/tools/import/${window.location.search}`,
            data: formData,
            contentType: false,
            processData: false,
            success: function (data) {
                window.location.reload();
            },
            error: function (data) {
                alert(data);
            }
        });
    });

    $("#button-import-database").on("change", function (e) {
        e.preventDefault();
        $("#form-import-zip").submit();
    });

    $("#button-export-database").on("click", function (e) {
        e.preventDefault();
        let form = $("<form></form>").attr("action", `/tools/export/${window.location.search}`).attr("method", "post");
        form.appendTo("body").submit().remove();
    });

    $("#panel-post-edit, #panel-post-delete, #panel-post-archive").on("click", function (e) {
        e.preventDefault();
        let slug = $(this).parent().data("slug");
        console.log(slug);
        switch ($(this).attr("id")) {
            case "panel-post-edit":
                if ($("#editor").froalaEditor("html.get").length > 0) {
                    return alert("Editor is not empty. Please save your current post as draft or submit before editing any post.");
                }

                $.post("/admin/action", { action: "edit", slug }, (post) => {
                    $("#post_tags").val(post["tags"].join(","));
                    $("#post_title").val(post["title"]);
                    $("#editor").froalaEditor("html.set", post["body"]);
                    $("#post-editor-form").attr("data-action", "edit").attr("data-short", post["short"]);
                }).fail(function (e) {
                    if (typeof e["responseJSON"] !== "undefined" && typeof e["responseJSON"]["message"] !== "undefined") {
                        return alert(e["responseJSON"]["message"]);
                    }

                    return alert("Error editing post");
                });

                break;
            case "panel-post-delete":
                break;
            case "panel-post-archive":
                $.post("/admin/action", { action: "archive", slug }, () => {
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
            $("#setup-input-protect-hint").attr("disabled", false);
            $("#setup-input-protect-days").attr("disabled", false);
        } else {
            $("#setup-input-protect-password").attr("disabled", true);
            $("#setup-input-protect-hint").attr("disabled", true);
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
        let protectHint = $("#setup-input-protect-hint").val();
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
            return alert("Password protect is enabled. Please enter a password.");
        }

        $.post("/setup", { host, title, adminUsername, adminPassword, protectEnabled, protectPassword, protectHint, protectDays }, function () {
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
            let url = new URL(window.location.href);
            if (url.searchParams.get("redir") !== null) {
                return window.location.replace(url.searchParams.get("redir"));
            }

            return window.location.replace("/");
        }).fail(function (e) {
            if (typeof e["responseJSON"] !== "undefined" && typeof e["responseJSON"]["message"] !== "undefined") {
                return alert(e["responseJSON"]["message"]);
            }

            return alert("Error submitting password");
        });
    });

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
        let allowedExtensions = ["gif", "jpeg", "jpg", "png", "svg", "blob"];
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
        placeholderText: "",
        imageUploadParam: "image",
        imageUploadURL: "/admin/upload",
        imageUploadParams: { id: "my_editor" },
        imageUploadMethod: "POST",
        imageMaxSize: 5 * 1024 * 1024,
        imageAllowedTypes: ["gif", "jpeg", "jpg", "png", "svg", "blob"]
    }).on("froalaEditor.image.beforeUpload", function (e, editor, images) {
    })
        .on("froalaEditor.image.uploaded", function (e, editor, response) {
        })
        .on("froalaEditor.image.inserted", function (e, editor, $img, response) {
        })
        .on("froalaEditor.image.replaced", function (e, editor, $img, response) {
        })
        .on("froalaEditor.image.error", function (e, editor, error, response) {
            if (error.code == 1) { }
            else if (error.code == 2) { }
            else if (error.code == 3) { }
            else if (error.code == 4) { }
            else if (error.code == 5) { }
            else if (error.code == 6) { }
            else if (error.code == 7) { }
        });

    $("#button-post-submit, #button-post-save-draft").on("click", function (e) {
        let error = $("#error_text");
        e.preventDefault();
        let tags = $("#post_tags").val().trim();
        let title = $("#post_title").val().trim();
        let password = $("#post_password").val().trim();
        let body = $("#editor").froalaEditor("html.get");
        if (title.length < 1) {
            return error.text("Title cannot be empty").css("display", "block");
        }

        if (body.length < 1) {
            return error.text("Content cannot be empty").css("display", "block");
        }

        error.text("").css("display", "hidden");
        $("input").attr("disabled", true);
        $("#editor").froalaEditor("edit.off");
        let route = "/admin/post/new";
        let status = $(this).attr("id") === "button-post-submit" ? 1 : 3;
        let opts = { tags, title, body, status, password };
        if ($("#post-editor-form").data("action") === "edit") {
            route = "/admin/post/edit";
            opts["short"] = $("#post-editor-form").data("short");
        }

        $.post(route, opts, function (data) {
            M.toast({ html: "Successfully posted. Refreshing in 3s..", duration: 10000 });
            setTimeout(() => {
                location.reload();
            }, 3000);
        }).fail(function (data) {
            $("input").attr("disabled", false);
            $("#editor").froalaEditor("edit.on");
            alert(data);
        });
    });

    $('input[name="checkbox_post_action"]').change(function () {
        console.log($(this).data("slug"));
    });

    $(".btn-protected-submit").on("click", function (e) {
        e.preventDefault();
        let short = $(this).data("post-short");
        let password = $(this).parent().siblings().find(`[data-protected-short='${short}']`).val();
        $.post("/p/protected", { short, password }, function (data) {
            $(`#post-body-${short}`).html(data["body"]);
        }).fail(function (data) {
            alert(data["responseJSON"]["message"])
        });
    })
});