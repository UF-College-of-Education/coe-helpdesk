$(document).ready(function () {

// Server ping
server_ping();

// Create a URL object (replace window.location.href with any URL string)
const url = new URL(window.location.href);

// Create a URLSearchParams object from the query string
const params = new URLSearchParams(url.search);

$(".form-selector-dropdown").change(function () {

    $(this).addClass("selected");
    var category = $(this).val();

    // Persist form category
    localStorage.setItem("/persistence/formcategory", category);

    $(".forms-list .form-parent").addClass("hidden");
    var formparent = $(".forms-list .form-parent[category='" + category + "']");
    var nocategorynorification = $(".forms-list .no-category-selected-notification");

    var persisted = {
        email: localStorage.getItem("/persistence/email"),
        name: localStorage.getItem("/persistence/name"),
        phone: localStorage.getItem("/persistence/phone")
    }

    // Pre-fill name and email and phone
    formparent.find("input[persistence-id='name']").val(persisted.name || "");
    formparent.find("input[persistence-id='email']").val(persisted.email || "");
    formparent.find("input[persistence-id='phone']").val(persisted.phone || "");

    if (formparent.length > 0) {
        nocategorynorification.addClass("hidden");
        formparent.removeClass("hidden");
    }
    else if (formparent.length === 0) {
        nocategorynorification.removeClass("hidden");
    }
});

// Get the form requested in the URL
var urlSelectedForm = params.get('f') || params.get('form');
if (urlSelectedForm != null && $(".form-selector-dropdown option[value='" + urlSelectedForm + "']").length == 0) {
    console.log("Invalid form requested in the URL: " + urlSelectedForm);

    $('#busy_popup').popup('hide');
    $('#error_popup').popup({
        scrolllock: true,
        transition: 'all 0.1s'
    });
    $('#error_popup').popup('show');

    $('#error_popup').find(".title").html("⚠️ Invalid form requested!")
    $('#error_popup').find(".message").html("The form requested in the URL (" + urlSelectedForm + ") is invalid.<!–- [et_pb_br_holder] -–>Please reach out <a href='mailto:dinsmore@ufl.edu'>Mark Dinsmore</a>.");
    
    urlSelectedForm = null;
}

// Preselect the form provided in the URL
if (urlSelectedForm != null) {
    $(".form-selector-dropdown").val(urlSelectedForm).trigger("change");
}

$("#primary_research_interests").change(function (e) {
    var options = $(this).find('option:selected');
    var maxitems = parseInt($(this).attr("max-selections")) || 1;

    $("#primary_3_interests").html("");
    options.each(function (ei, el) {
        $("#primary_3_interests").append(`<option value="${$(el).text()}">${$(el).text()}</option>`);
    })

    var selectedOptions = $(this).find('option:selected');
            
    // Check if the number of selected options exceeds the limit
    if (selectedOptions.length > maxitems) {
        // Deselect the last selected option
        $(this).find('option:selected').last().prop('selected', false);
        $(this).change();
    }

    else if (selectedOptions.length > 0) {
        $("#primary_3_interests").parent().find(".sublabel").text(`Of your selected ${selectedOptions.length} research interests, please list your primary 3 in order of preference. Hold "control" key to select multiple items..`)
    }
});

$("#primary_3_interests").change(function (e) {
    var maxitems = parseInt($(this).attr("max-selections")) || 1;

    var selectedOptions = $(this).find('option:selected');
            
    // Check if the number of selected options exceeds the limit
    if (selectedOptions.length > maxitems) {
        // Deselect the last selected option
        $(this).find('option:selected').last().prop('selected', false);
        $(this).change();
    }
});

$("span.url-prefix").off("click").click(function (e) {
    var value = $(this).parent().next().val() || "";
    $(this).parent().next().val($(this).text() + value.replace("https://", "").replace("http://", ""));
});

// $("[del-anchor]").each(function (ei, el) {
//     var anchor = $(el);

//     var anchor_id = anchor.attr("del-anchor");

//     $(`[del-anchor-id='${anchor_id}']`).each(function (depei, depel) {
//         var dependentel = $(depel);
//     })
// })


// Dynamic form items
$(".form-parent[category='user-management']").find("#issue_type").change(function (e) {
    var value = $(this).val();
    var formel = $(".form-parent[category='user-management']");

    if (value == "new-user") {
        formel.find("#employee-name").attr("required", "true").parent().removeClass("hidden");
        formel.find("#employee-ufid").attr("required", "true").parent().removeClass("hidden");
        formel.find("#start-date").attr("required", "true").parent().removeClass("hidden");
        formel.find("#email-alias").attr("required", "true").parent().removeClass("hidden");
        formel.find("#email-list").attr("required", "true").parent().removeClass("hidden");
        
        formel.find("#termination-date").removeAttr("required").parent().addClass("hidden");
        formel.find("#grant-project").removeAttr("required").parent().addClass("hidden");
        formel.find("#room-number").removeAttr("required").parent().addClass("hidden");
    }
    
    else if (value == "disable-user") {
        formel.find("#employee-name").attr("required", "true").parent().removeClass("hidden");
        formel.find("#employee-ufid").attr("required", "true").parent().removeClass("hidden");
        formel.find("#start-date").removeAttr("required").parent().addClass("hidden");
        formel.find("#email-alias").removeAttr("required").parent().addClass("hidden");
        formel.find("#email-list").removeAttr("required").parent().addClass("hidden");
        
        formel.find("#termination-date").attr("required", "true").parent().removeClass("hidden");
        formel.find("#grant-project").removeAttr("required").parent().addClass("hidden");
        formel.find("#room-number").removeAttr("required").parent().addClass("hidden");
    }
    
    else if (value == "other") {
        formel.find("#employee-name").removeAttr("required").parent().addClass("hidden");
        formel.find("#employee-ufid").removeAttr("required").parent().addClass("hidden");
        formel.find("#start-date").removeAttr("required").parent().addClass("hidden");
        formel.find("#email-alias").removeAttr("required").parent().addClass("hidden");
        formel.find("#email-list").removeAttr("required").parent().addClass("hidden");
        formel.find("#termination-date").removeAttr("required").parent().addClass("hidden");
        
        formel.find("#grant-project").parent().removeClass("hidden");
        formel.find("#room-number").parent().removeClass("hidden");
    }
})

// Pre-open last used form (if none requested in the URL)
if (localStorage.getItem("/persistence/formcategory") && !urlSelectedForm) {
    $(".form-selector-dropdown").val(localStorage.getItem("/persistence/formcategory")).change();
}

// TODO: Deprecate
$(".form-selector-list .list-item").click(function () {
    $(".form-selector-list .list-item").removeClass("selected");
    $(this).addClass("selected");
    var category = $(this).attr("category");

    $(".forms-list .form-parent").addClass("hidden");
    var formparent = $(".forms-list .form-parent[category='" + category + "']");
    var nocategorynorification = $(".forms-list .no-category-selected-notification");

    if (formparent.length == 0) {
        nocategorynorification.addClass("hidden");

    }
    else {
        nocategorynorification.addClass("hidden");
        formparent.removeClass("hidden");
    }
});

// try {
//     $("#primary_research_interests").picker({ "limit": 10, "search": true, "texts": { trigger: "Select item", noResult: "No results", search: "Search" } });
//     $("#primary_3_interests").picker({ "limit": 3, "search": true, "texts": { trigger: "Select item", noResult: "No results", search: "Search" } });

//     $(".picker-element").css({
//         "width": " 100%",
//         "padding": "10px",
//         "margin-bottom": "15px",
//         "border": "1px solid #ccc",
//         "border-radius": "4px",
//         "box-sizing": "border-box"
//     });
// }
// catch (e) {
//     console.warn("jQuery Multi-select plugin not initialized.")
// }

$("input[type='file']").on('change', function (e) {
    var files = e.target.files;
    var numfiles = files.length;
    var maxfiles = $(this).attr("max-file-count");
    var minfiles = $(this).attr("min-file-count");

    $(".custom-validation-error").remove();
    if (maxfiles && numfiles > maxfiles) {
        $(this).after(`
            <div class="custom-validation-error">
                Only the first ${maxfiles} file(s) will be uploaded. Please combine documents into at most ${maxfiles} file(s).
            </div>
        `);
    }
    else if (minfiles && numfiles < minfiles) {
        $(this).after(`
            <div class="custom-validation-error">
                Please select at least ${minfiles} file(s).
            </div>
        `);
    }
});

// $(".form-parent form input[type='submit']").click(function (e) {
$('.form-parent form').on('submit', function (e) {

    var form = $(this);

grecaptcha.enterprise.ready(async () => {
const token = await grecaptcha.enterprise.execute('6Lf6di0sAAAAAKmzfGT9VbogLr4ekPhBNFfOP-o5', { action: 'helpdesk_submit' });
  console.log(token);

        var parent = form.closest(".form-parent");
        var category = parent.attr("category");

        var datasink = form.attr("data-sink") || "email";
        var reference_id = generateuuid();
        var formdata = new FormData();
        formdata.append("recaptcha_response", token);
        var persistence = {}

        if (datasink == "monday.com") {

            if (category == "website-edits") {
                var boardid = lookup[category].board;

                var email = form.find("input#email").val();
                var name = form.find("input#name").val();
                var description = form.find("textarea#description").val();
                var subject = form.find("input#subject").val();
                var website_url = form.find("input#website_url").val();
                var file_upload = form.find("input#file_upload");
                var date = moment(moment.now()).format("YYYY-MM-DD");

                // Set the persistence object
                persistence.name = name;
                persistence.email = email;

                formdata.append("action", "monday");
                formdata.append("form_category", category);
                formdata.append("reference_id", reference_id);
                formdata.append("board_id", boardid);

                formdata.append("email", form.find("input#email").val());
                formdata.append("fullname", form.find("input#name").val());
                formdata.append("description", form.find("textarea#description").val());
                formdata.append("subject", form.find("input#subject").val());
                formdata.append("website_url", form.find("input#website_url").val());
                formdata.append("date", moment(moment.now()).format("YYYY-MM-DD"));

                // TODO: Not sure what this is supposed to be checking for?
                if (false) {
                    createitem({
                        board: boardid,
                        group: "topics",
                        item: {
                            "name": reference_id + ": " + subject,
                            "description": description
                        },
                        columns: JSON.stringify({
                            "date": date,
                            "name": subject,
                            "text": name,
                            "email": {
                                "email": email,
                                "text": email
                            },
                            "link": {
                                "url": website_url,
                                 "text": website_url,
                            },
                            "long_text": description
                        }).trim().replace(/"/g, '\"').replace(/\n/g, ''),
                        callback: (res) => {
                            uploadtomonday({
                                "item": res.data.create_item.id,
                                "files": file_upload[0].files,
                                "column": "file"
                            })

                            $('#success_popup').popup({
                                scrolllock: true,
                                transition: 'all 0.1s'
                            });
                            $('#success_popup').popup('show');
                            $('#success_popup').find(".message").text("The request has been registered. We will reach out to you via email shortly.");
                            $('#success_popup').find(".reference-id").removeClass("hidden").text(reference_id);

                            // Save the persistence object to localStorage
                            Object.keys(persistence).forEach(function (key, ki) {
                                if (persistence[key]) localStorage.setItem("/persistence/" + key, persistence[key]);
                            });
                        }

                    });
                }

                else {
                    // Check if the number of files is under the limit. [FIX: Added null check]
                    if (file_upload.length > 0 && file_upload[0].files) {
                        for (var i = 0; i < Math.min($(file_upload[0]).attr("max-file-count"), file_upload[0].files.length); i++) {
                            formdata.append('file_upload[]', file_upload[0].files[i]);
                        }
                    }

                }
            }

            else if (category == "marketing-and-design") {
                var boardid = lookup[category].board;

                var client_email = form.find("input#client_email").val();
                var client_name = form.find("input#client_name").val();
                var project_name = form.find("input#project_name").val();
                var subject = form.find("input#subject").val();
                var project_description = form.find("textarea#project_description").val();
                var request_type = form.find("select#request_type option:selected").text();
                var due_date = form.find("input#due_date").val();
                var project_link = form.find("input#project_link").val();
                var content_assistance = form.find("select#content_assistance option:selected").text();
                var file_upload = form.find("input#file_upload");

                formdata.append("action", "monday");
                formdata.append("form_category", category);
                formdata.append("reference_id", reference_id);
                formdata.append("board_id", boardid);

                formdata.append("email", client_email);
                formdata.append("fullname", client_name);
                formdata.append("project_name", project_name);
                formdata.append("subject", subject);
                formdata.append("project_description", project_description);
                formdata.append("request_type", form.find("select#request_type option:selected").text());
                formdata.append("due_date", due_date);
                formdata.append("project_link", project_link);
                formdata.append("content_assistance", content_assistance);

                // Set the persistence object
                persistence.name = client_name;
                persistence.email = client_email;


                // Check if the number of files is under the limit. [FIX: Added null check]
                if (file_upload.length > 0 && file_upload[0].files) {
                    for (var i = 0; i < Math.min($(file_upload[0]).attr("max-file-count"), file_upload[0].files.length); i++) {
                        formdata.append('file_upload[]', file_upload[0].files[i]);
                    }
                }
            }

            else if (category == "faculty-profile") {

                var boardid = lookup[category].board;

                var request_type = form.find('#request_type option:selected').text();
                var email = form.find('#email').val();
                var faculty_name = form.find('#faculty_name').val();
                var display_name = form.find('#display_name').val();
                var title = form.find('#title').val();
                var affiliations = form.find('#affiliations').val();
                var business_email = form.find('#business_email').val();
                var business_phone = form.find('#business_phone').val().replace(/\D/g, '');
                var linkedin = form.find('#linkedin').val();
                var twitter = form.find('#twitter').val();
                var business_address = form.find('#business_address').val();
                var video_profile = form.find('#video_profile').val();
                var bio = form.find('#bio').val();
                var primary_research_interests = form.find('#primary_research_interests').val().map((d) => { return d.replace(/\n/g, "") });
                var primary_3_interests = form.find('#primary_3_interests').val().map((d) => { return d.replace(/\n/g, "") });
                var education_certifications = form.find('#education_certifications').val().replace(/\r?\n/g, '\n\n');
                var appointments_affiliations = form.find('#appointments_affiliations').val().replace(/\r?\n/g, '\n\n');
                var activities_honors = form.find('#activities_honors').val().replace(/\r?\n/g, '\n\n');
                var selected_grants = form.find('#selected_grants').val().replace(/\r?\n/g, '\n\n');
                var publications_books = form.find('#publications_books').val().replace(/\r?\n/g, '\n\n');
                var publications_articles = form.find('#publications_articles').val().replace(/\r?\n/g, '\n\n');
                var publications_other = form.find('#publications_other').val().replace(/\r?\n/g, '\n\n');
                var selected_presentations = form.find('#selected_presentations').val().replace(/\r?\n/g, '\n\n');
                var selected_links = form.find('#selected_links').val().replace(/\r?\n/g, '\n\n');
                var website_url = form.find('input#website_url').val().replace(/\r?\n/g, '\n\n');

                var cv_file_upload = form.find("input[type='file']").first();
                var supporting_file_upload = form.find("input#supporting_files");

                // Set the persistence object
                persistence.email = email;

                formdata.append("action", "monday");

                formdata.append("form_category", category);
                formdata.append("reference_id", reference_id);
                formdata.append("board_id", boardid);
                formdata.append("request_type", form.find('#request_type option:selected').text());
                formdata.append("email", form.find('#email').val());
                formdata.append("faculty_name", form.find('#faculty_name').val());
                formdata.append("display_name", form.find('#display_name').val());
                formdata.append("title", form.find('#title').val());
                formdata.append("affiliations", form.find('#affiliations').val());
                formdata.append("business_email", form.find('#business_email').val());
                formdata.append("business_phone", form.find('#business_phone').val().replace(/\D/g, ''));
                formdata.append("website_url", form.find('#website_url').val());
                formdata.append("linkedin", form.find('#linkedin').val());
                formdata.append("twitter", form.find('#twitter').val());
                formdata.append("business_address", form.find('#business_address').val());
                formdata.append("video_profile", form.find('#video_profile').val());
                formdata.append("bio", form.find('#bio').val());
                formdata.append("primary_research_interests", (form.find('#primary_research_interests').val().map((d) => { return d.replace(/\n/g, ""); })));
                formdata.append("primary_3_interests", (form.find('#primary_3_interests').val().map((d) => { return d.replace(/\n/g, ""); })));
                formdata.append("education_certifications", form.find('#education_certifications').val().replace(/\r?\n/g, '\n\n')); // Add extra line break for readability on Monday.com board.
                formdata.append("appointments_affiliations", form.find('#appointments_affiliations').val().replace(/\r?\n/g, '\n\n'));
                formdata.append("activities_honors", form.find('#activities_honors').val().replace(/\r?\n/g, '\n\n'));
                formdata.append("selected_grants", form.find('#selected_grants').val().replace(/\r?\n/g, '\n\n'));
                formdata.append("publications_books", form.find('#publications_books').val().replace(/\r?\n/g, '\n\n'));
                formdata.append("publications_articles", form.find('#publications_articles').val().replace(/\r?\n/g, '\n\n'));
                formdata.append("publications_other", form.find('#publications_other').val().replace(/\r?\n/g, '\n\n'));
                formdata.append("selected_presentations", form.find('#selected_presentations').val().replace(/\r?\n/g, '\n\n'));
                formdata.append("selected_links", form.find('#selected_links').val().replace(/\r?\n/g, '\n\n'));

                // [FIX #1] Appending CV file - only if file is selected
                if (cv_file_upload.length > 0 && cv_file_upload[0].files && cv_file_upload[0].files.length > 0) {
                    formdata.append("cv_file_upload", cv_file_upload[0].files[0]);
                }

                // [FIX #2] Check if the number of files is under the limit - with null check
                if (supporting_file_upload.length > 0 && supporting_file_upload[0].files) {
                    for (var i = 0; i < Math.min($(supporting_file_upload[0]).attr("max-file-count"), supporting_file_upload[0].files.length); i++) {
                        formdata.append('supporting_file_upload[]', supporting_file_upload[0].files[i]);
                    }
                }

            }

            if (formdata) {

                $('#busy_popup').popup({
                    scrolllock: true,
                    transition: 'all 0.1s',
                    blur: false
                });
                $('#busy_popup').popup('show');
                $('#busy_popup').find(".message").html("Please wait while we upload your response. Please do <u>not</u> refresh the page.");

                // Send monday.com form data
                $.ajax({
                    type: 'POST',
                    url: '/helpdesk/helpdesk-mailer/',
                    data: formdata,
                    processData: false,
                    contentType: false,
                    success: function (response) {
                        var response = Excavator.extractAndParseJson(response);

                        try {
                            if (response.status == "success") {
                                $('#busy_popup').popup('hide');
                                $('#success_popup').popup({
                                    scrolllock: true,
                                    transition: 'all 0.1s'
                                });
                                $('#success_popup').popup('show');
                                $('#success_popup').find(".message").text(response.message);
                                $('#success_popup').find(".reference-id").removeClass("hidden").text(response["reference-id"]);

                                // Reset form
                                if (localStorage.getItem("/persistence/email") != "pagade@ufl.edu") {
                                    $("form input").not("[type='submit']").not("[persistence-id]").val("");
                                    $("form select").val("");
                                    $("form textarea").val("");
                                }

                                e.preventDefault();

                                // Save the persistence object to localStorage
                                Object.keys(persistence).forEach(function (key, ki) {
                                    if (persistence[key]) localStorage.setItem("/persistence/" + key, persistence[key]);
                                });
                            }
                            else {
                                $('#busy_popup').popup('hide');
                                $('#error_popup').popup({
                                    scrolllock: true,
                                    transition: 'all 0.1s'
                                });
                                $('#error_popup').popup('show');

                                // If the error was a ReCaptcha validation error, disable form submission
                                if (response.code == "badbaker") {
                                    $('.form-parent form').off('submit').on('submit', function (e) {
                                        e.preventDefault();
                                        $('#error_popup').popup({
                                            scrolllock: true,
                                            transition: 'all 0.1s'
                                        });
                                        $('#error_popup').popup('show');
                                        $('#error_popup').find(".message").html("Form submission has been disabled. Please refresh this webpage to try again.");
                                    });
                                    $('#error_popup').find(".message").html(response.message);
                                }

                                // Some other issue
                                else {
                                    if (response.error) $('#error_popup').find(".message").html(response.message + "<p style=' margin: 6px 0px; background: #dbdbdb; padding: 0 8px; font-size: 13px; border-radius: 2px; user-select: all;'>" + response.error.error_code + ": " + response.error.error_data.column_value + "");
                                    else $('#error_popup').find(".message").html(response.message);

                                }
                            }

                            console.log(response);
                        }
                        catch (e) {
                            console.log(e);
                            $('#busy_popup').popup('hide');
                            $('#error_popup').popup({
                                scrolllock: true,
                                transition: 'all 0.1s'
                            });
                            $('#error_popup').popup('show');
                            $('#error_popup').find(".message").html("An error has occured. Please try again later.");
                        }

                    },
                    error: function (xhr, textStatus, errorThrown) {
                        console.log('Error: ' + textStatus); // Display error message

                        $('#busy_popup').popup('hide');
                        $('#error_popup').popup({
                            scrolllock: true,
                            transition: 'all 0.1s'
                        });
                        $('#error_popup').popup('show');

                        try {
                            var response = JSON.parse(xhr.responseText);

                            if (response.code) {
                                if (response.error) $('#error_popup').find(".message").html(response.message + "<p style=' margin: 6px 0px; background: #dbdbdb; padding: 0 8px; font-size: 13px; border-radius: 2px; user-select: all;'>" + response.error.error_code + ": " + response.error.error_data.column_value + "");
                                else $('#error_popup').find(".message").html(response.message);
                            }
                            else {
                                $('#error_popup').find(".message").text("Something didn't work. Please try again.");
                            }
                        }

                        catch (e) {
                            console.log(e);
                            $('#error_popup').find(".message").text("A server-side error occured. Please try a bit later.");
                        }
                    }
                });
            }
        }

        else {
            // [FIX #3] Initialize FormData properly - was missing "new FormData()"
            var formdata = new FormData();
            formdata.append("action", "form-email");
          	formdata.append("recaptcha_response", token);

            console.log("Sending form: " + category);
            var email = form.find("#email").val();

            if (category == "it-request") {

                formdata.append("form_category", (email == "pagade@ufl.edu" ? "" : "") + category);
                formdata.append("reference_id", reference_id);
                formdata.append("fullname", form.find("#name").val());
                formdata.append("email", form.find("#email").val());
                formdata.append("department", form.find("#department").val());
                formdata.append("issue_type", form.find("#issue_type").val());
                formdata.append("description", form.find("#description").val());
                formdata.append("urgency", form.find("#urgency").val());

                // Set the persistence object
                persistence.name = form.find("#name").val();
                persistence.email = form.find("#email").val();

                // Append file if it exists [FIX: Added null check]
                var fileInput = form.find("#file_upload")[0];
                if (fileInput && fileInput.files && fileInput.files.length > 0) {
                    formdata.append("file_upload", fileInput.files[0]);
                }
            }
            
            if (category == "user-management") {

                formdata.append("form_category", (email == "pagade@ufl.edu" ? "" : "") + category);
                formdata.append("reference_id", reference_id);
                formdata.append("fullname", form.find("#name").val());
                formdata.append("email", form.find("#email").val());
                formdata.append("issue_type", form.find("#issue_type").val());
                formdata.append("department", form.find("#department").val());
                formdata.append("employee-name", form.find("#employee-name").val());
                formdata.append("employee-id", form.find("#employee-ufid").val());
                formdata.append("start-date", form.find("#start-date").val());
                formdata.append("termination-date", form.find("#termination-date").val());
                formdata.append("email-alias", form.find("#email-alias").val() || "N/A");
                formdata.append("email-list", form.find("#email-list").val() || "N/A");
                formdata.append("grant-project", form.find("#grant-project").val() || "N/A");
                formdata.append("room-number", form.find("#room-number").val());
                formdata.append("description", form.find("#description").val());

                // Set the persistence object
                persistence.name = form.find("#name").val();
                persistence.email = form.find("#email").val();

                // Append file if it exists [FIX: Added null check]
                var fileInput = form.find("#file_upload")[0];
                if (fileInput && fileInput.files && fileInput.files.length > 0) {
                    formdata.append("file_upload", fileInput.files[0]);
                }
            }

            else if (category == "course-request") {
                formdata.append("form_category", (email == "pagade@ufl.edu" ? "" : "") + category);
                formdata.append("reference_id", reference_id);
                formdata.append("fullname", form.find("#full_name").val());
                formdata.append("email", form.find("#email").val());
                formdata.append("role", form.find("#role").val());
                formdata.append("note", form.find("#note").val());

                // Set the persistence object
                persistence.name = form.find("#full_name").val();
                persistence.email = form.find("#email").val();
            }

            else if (category == "photo-request") {

                formdata.append("form_category", (email == "pagade@ufl.edu" ? "" : "") + category);
                formdata.append("reference_id", reference_id);
                formdata.append("fullname", form.find("#name").val());
                formdata.append("email", form.find("#email").val());
                formdata.append("phone", form.find("#phone").val());
                formdata.append("date", form.find("#date").is(":visible") ? form.find("#date").val() : "default_date");
                formdata.append("start_time", form.find("#start_time").is(":visible") ? form.find("#start_time").val() : "00:00");
                formdata.append("end_time", form.find("#end_time").is(":visible") ? form.find("#end_time").val() : "00:00");
                formdata.append("location", form.find("#location").is(":visible") ? form.find("#location").val() : "N/A");
                formdata.append("request_type", form.find("#request_type").val());
                formdata.append("other_info", form.find("#other_info").val());

                // Set the persistence object
                persistence.name = form.find("#name").val();
                persistence.email = form.find("#email").val();
                persistence.phone = form.find("#phone").val();
            }

            else if (category == "video-studio-request") {

                formdata.append("form_category", (email == "pagade@ufl.edu" ? "" : "") + category);
                formdata.append("reference_id", reference_id);
                formdata.append("fullname", form.find("#name").val());
                formdata.append("email", form.find("#email").val());
                formdata.append("faculty_advisor", form.find("#faculty-advisor").val());
                formdata.append("purpose", form.find("#purpose").val());
                formdata.append("on_camera_talent", form.find("#on-camera-talent").val());
                formdata.append("talent_email", form.find("#talent-email").val());
                formdata.append("etc_studio_space", form.find("#etc-studio-space").val());
                formdata.append("alt_location", form.find("#alt-location").val());
                formdata.append("parking_permit", form.find("#parking-permit").val());
                formdata.append("date", form.find("#date").val());
                formdata.append("start_time", form.find("#start_time").val());
                formdata.append("other_info", form.find("#other_info").val());

                // Set the persistence object
                persistence.name = form.find("#name").val();
                persistence.email = form.find("#email").val();

                // Append file if it exists [FIX: Added null check]
                var fileInput = form.find("#file_upload")[0];
                if (fileInput && fileInput.files && fileInput.files.length > 0) {
                    formdata.append("file_upload", fileInput.files[0]);
                }
            }

            else if (category == "news-and-communications") {

                formdata.append("form_category", (email == "pagade@ufl.edu" ? "" : "") + category);
                formdata.append("reference_id", reference_id);
                formdata.append("who", form.find("#who").val());
                formdata.append("fullname", form.find("#name").val());
                formdata.append("email", form.find("#email").val());
                formdata.append("what", form.find("#what").val());
                formdata.append("when", form.find("#when").val());
                formdata.append("why", form.find("#why").val());
                formdata.append("where", form.find("#where").val());
                formdata.append("link", form.find("#link").val());
                formdata.append("needs", form.find("#needs").val());

                // Set the persistence object
                persistence.email = form.find("#email").val();

                // Append file if it exists [FIX: Added null check]
                var fileInput = form.find("#file_upload")[0];
                if (fileInput && fileInput.files && fileInput.files.length > 0) {
                    formdata.append("file_upload", fileInput.files[0]);
                }
            }

            if (formdata) {

                $.ajax({
                    type: 'POST',
                    url: '/helpdesk/helpdesk-mailer/',
                    data: formdata,
                    processData: false,
                    contentType: false,
                    success: function (response) {
                        var response = Excavator.extractAndParseJson(response);

                        try {
                            if (response.status == "success") {
                                $('#success_popup').popup({
                                    scrolllock: true,
                                    transition: 'all 0.1s'
                                });
                                $('#success_popup').popup('show');
                                $('#success_popup').find(".message").text(response.message);
                                $('#success_popup').find(".reference-id").removeClass("hidden").text(response["reference-id"]);

                                // Reset form
                                if (localStorage.getItem("/persistence/email") != "pagade@ufl.edu") {
                                    $("form input").not("[type='submit']").not("[persistence-id]").val("");
                                    $("form select").val("");
                                    $("form textarea").val("");
                                }

                                e.preventDefault();

                                // Save the persistence object to localStorage
                                Object.keys(persistence).forEach(function (key, ki) {
                                    if (persistence[key]) localStorage.setItem("/persistence/" + key, persistence[key]);
                                });
                            }
                            else {
                                $('#error_popup').popup({
                                    scrolllock: true,
                                    transition: 'all 0.1s'
                                });
                                $('#error_popup').popup('show');

                                // If the error was a ReCaptcha validation error, disable form submission
                                if (response.code == "badbaker") {
                                    $('.form-parent form').off('submit').on('submit', function (e) {
                                        e.preventDefault();

                                        $('#error_popup').popup({
                                            scrolllock: true,
                                            transition: 'all 0.1s'
                                        });
                                        $('#error_popup').popup('show');
                                        $('#error_popup').find(".message").html("Form submission has been disabled. Please refresh this webpage to try again.");
                                    });
                                    $('#error_popup').find(".message").html(response.message);
                                }

                                // Some other issue
                                else {
                                    if (response.error) $('#error_popup').find(".message").html(response.message + "<p style=' margin: 6px 0px; background: #dbdbdb; padding: 0 8px; font-size: 13px; border-radius: 2px; user-select: all;'>" + response.error.error_code + ": " + response.error.error_data.column_value + "");
                                    else $('#error_popup').find(".message").html(response.message);

                                }
                            }

                            console.log(response);
                        }
                        catch (e) {
                            console.log(e);
                            $('#error_popup').popup({
                                scrolllock: true,
                                transition: 'all 0.1s'
                            });
                            $('#error_popup').popup('show');
                        }

                    },
                    error: function (xhr, textStatus, errorThrown) {
                        console.log('Error: ' + textStatus); // Display error message

                        $('#error_popup').popup({
                            scrolllock: true,
                            transition: 'all 0.1s'
                        });
                        $('#error_popup').popup('show');

                        try {
                            var response = JSON.parse(xhr.responseText);
                            console.log(response);

                            if (response.code) {
                                if (response.error) $('#error_popup').find(".message").html(response.message + "<p style=' margin: 6px 0px; background: #dbdbdb; padding: 0 8px; font-size: 13px; border-radius: 2px; user-select: all;'>" + response.error.error_code + ": " + response.error.error_data.column_value + "");
                                else $('#error_popup').find(".message").html(response.message);
                            }
                            else {
                                $('#error_popup').find(".message").text("Something didn't work. Please try again.");
                            }
                        }

                        catch (e) {
                            console.log(e);
                            $('#error_popup').find(".message").text("A server-side error occured. Please try a bit later.");
                        }
                    }
                });
            }
        }
    });

    e.preventDefault();
})

// getworkspaces();

// getallboards();

// console.log(workspaces);

// getitems({
//     board: "4985098573"
// });

// getallgroups({
//     board: "4985098573",
// });

// // EAPI
// getallcolumns({
//     board: "4985098573"
// });

// // MAPI
// getallcolumns({
//     board: "7218370600"
// });

// /// https://developer.monday.com/api-reference/reference/link
});

function createitem(args) {
if (!args) return;

const url = 'https://api.monday.com/v2';


const boardid = args.board;
const groupid = args.group;
const itemName = args.item.name || "Item name not provided";
const itemDescription = args.item.description || "Item description not provided";
const columns = args.columns;

let query = multiline(function () {/* 
    mutation {
    create_item(
        board_id: {{board.id}}
        item_name: "{{item.name}}"
        group_id: "{{group.id}}"
        column_values: "{{columns}}"
        create_labels_if_missing: true
    ) {
        id
    }
}

*/}, {
    board: {
        id: boardid
    },
    group: {
        id: groupid
    },
    item: {
        name: itemName,
        description: itemDescription,
    },
    // date: date,
    columns: columns
});

fetch(url, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': api
    },
    body: JSON.stringify({
        query: query
    })
})
    .then(res => res.json())
    .then(res => {
        if (!res.errors) {
            console.log("Item created.");
            if (res.data) console.log(res.data.create_item.id);
            else console.log(res);
            if (args.callback) args.callback(res);
        }
        else {
            console.log("Errors creating item.");
            console.log(res.errors);
        }
    })
    .catch(err => console.error('Error:', err));
}

function getworkspaces() {
const url = 'https://api.monday.com/v2';

const query = multiline(function () {/* 
    query {
        workspaces {
            id
            name
            kind
            description
        }
    }
*/});

fetch(url, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': api
    },
    body: JSON.stringify({ query })
})
    .then(res => res.json())
    .then(res => {
        const workspaces = res.data.workspaces;
        console.log(workspaces);
    })
    .catch(err => console.error('Error:', err));
}

function getallboards() {
const url = 'https://api.monday.com/v2';
let cursor = null;

const query = multiline(function () {/* 
    query {
        boards(limit: 500, page: 1) {
            id
            name
            workspace {
            id
            name
            }
        }
    }

*/});

fetch(url, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': api
    },
    body: JSON.stringify({ query })
})
    .then(res => res.json())
    .then(res => {
        if (res.errors) {
            console.log(res.errors);
            return;
        }
        const boards = res.data.boards;
        console.log("Cursor: " + boards.cursor);
        var workspaces = [];

        // Organize boards by workspace
        const boardsByWorkspace = boards.reduce((acc, board) => {
            const workspaceId = board.workspace.id;
            const workspaceName = board.workspace.name;
            if (workspaces.indexOf(workspaceName) == -1) workspaces.push(workspaceName);

            if (!acc[workspaceId]) {
                acc[workspaceId] = {
                    boards: []
                };
            }
            acc[workspaceId].name = workspaceName;
            acc[workspaceId].boards.push({
                workspace: workspaceName,
                id: board.id,
                name: board.name
            });
            return acc;
        }, {});

        heading("Boards")
        console.log(boardsByWorkspace);
    })
    .catch(err => console.error('Error:', err));

}

function getallgroups(args) {
if (!args) return;

const boardid = args.board || "6055647087";

const url = 'https://api.monday.com/v2';
let cursor = null;

const query = multiline(function () {/* 
query {
    boards(ids: {{board.id}}) {
        groups {
            title
            id
            position
        }
    }
}

*/}, {
    board: {
        id: boardid
    }
});

fetch(url, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': api
    },
    body: JSON.stringify({ query })
})
    .then(res => res.json())
    .then(res => {
        const groups = res.data.boards[0].groups;
        heading("Groups");
        console.log(groups);
    })
    .catch(err => console.error('Error:', err));
}

function getallcolumns(args) {
if (!args) return;

const boardid = args.board || "6055647087";

const url = 'https://api.monday.com/v2';
let cursor = null;

/*
Column types reference:
-----------------------
https://developer.monday.com/api-reference/reference/link
*/
const query = multiline(function () {/* 
    query {
        boards(ids: {{board.id}}) {
            columns {
            id
            title
            type
            }
        }
    }

*/}, {
    board: {
        id: boardid
    }
});

fetch(url, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': api
    },
    body: JSON.stringify({ query })
})
    .then(res => res.json())
    .then(res => {
        const columns = res.data.boards[0].columns;
        heading("Columns");
        console.log(columns);
    })
    .catch(err => console.error('Error:', err));
}

function getitems(args) {
var boardid = args.board;
const url = 'https://api.monday.com/v2';
let cursor = null;

const query = multiline(function () {/* 
    query {
    boards(ids: "{{board.id}}", limit: 1) {
        id
        items_page(limit: 100) {
        cursor
        items {
            id
            name
            state
            url
            email

            column_values {
            column {
                id
                title
            }
            id
            type
            value
            }
        }
        }
    }
    }
*/}, {
    board: {
        id: boardid
    }
});

fetch(url, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': api
    },
    body: JSON.stringify({ query })
})
    .then(res => res.json())
    .then(res => {
        if (res.errors) {
            console.log(res.errors);
            return;
        }

        var items = res.data.boards[0].items_page.items;
        var cursor = res.data.boards[0].items_page.cursor;
        heading("Items");
        console.log(items);
    })
    .catch(err => console.error('Error:', err));

}

// Send ping to the helpdesk-mailer backend file
function server_ping() {
$.ajax({
    type: 'GET',
    url: '/helpdesk/helpdesk-mailer/?ping',
    success: function (response) {
        var response = Excavator.extractAndParseJson(response);

        if (response.status == "success") {
            // Do nothing
        }
        else {
            $('#busy_popup').popup('hide');
            $('#error_popup').popup({
                scrolllock: true,
                transition: 'all 0.1s'
            });
            $('#error_popup').popup('show');

            $('#error_popup').find(".title").html("⚠️ Backend error!")
            if (response.code == "ping") {
                $('#error_popup').find(".message").html("The helpdesk backend is experiencing an issue.<!–- [et_pb_br_holder] -–>Please reach out <a href='mailto:dinsmore@ufl.edu'>Mark Dinsmore</a>.");
            }
            else {
                $('#error_popup').find(".message").text("Something unknown error occured. Please try again.");
            }
        }
        console.log(response);

    },
    error: function (xhr, textStatus, errorThrown) {
        var response = Excavator.extractAndParseJson(xhr.responseText);
        console.log('Error: ' + textStatus); // Display error message

        $('#busy_popup').popup('hide');
        $('#error_popup').popup({
            scrolllock: true,
            transition: 'all 0.1s'
        });
        $('#error_popup').popup('show');
        if (response.code == "ping") {
            $('#error_popup').find(".message").html("The helpdesk backend is experiencing an issue.<!–- [et_pb_br_holder] -–>Please reach out <a href='mailto:dinsmore@ufl.edu'>Mark Dinsmore</a>.");
        }
        else {
            $('#error_popup').find(".message").text("Something unknown error occured. Please try again.");
        }

    }
});
}

function heading(text) {
console.log("\n" + text + "\n" + "----");
}

function generateuuid() {
// Define the character set for digits and uppercase letters
const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

// Initialize an empty string to hold the generated ID
let id = '';

// Generate 6 characters
for (let i = 0; i < 6; i++) {
    // Select a random index within the charset length
    const randomIndex = Math.floor(Math.random() * charset.length);

    // Append the character at the random index to the ID
    id += charset[randomIndex];
}

return id;
}

// https://www.postman.com/matiasdavidson/monday-com-queries-and-mutations/request/v5qayji/upload-a-file-to-a-files-column

// Show line numbers on textarea
function show_line_numbers (element) {
const textarea = element;
const linenumel = $(textarea).parent().find(".lines").get(0);
if (!linenumel) return;

// Copy style
const textareaStyles = window.getComputedStyle(textarea);
[
    'fontFamily',
    'fontSize',
    'fontWeight',
    'letterSpacing',
    'lineHeight',
    'padding',
].forEach((property) => {
    linenumel.style[property] = textareaStyles[property];
});

const parseValue = (v) => v.endsWith('px') ? parseInt(v.slice(0, -2), 10) : 0;

const font = `${textareaStyles.fontSize} ${textareaStyles.fontFamily}`;
const paddingLeft = parseValue(textareaStyles.paddingLeft);
const paddingRight = parseValue(textareaStyles.paddingRight);

const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');
context.font = font;

const calculateNumLines = (str) => {
    const textareaWidth = textarea.getBoundingClientRect().width - paddingLeft - paddingRight;
    const words = str.split(' ');
    let lineCount = 0;
    let currentLine = '';
    for (let i = 0; i < words.length; i++) {
        const wordWidth = context.measureText(words[i] + ' ').width;
        const lineWidth = context.measureText(currentLine).width;

        if (lineWidth + wordWidth > textareaWidth) {
            lineCount++;
            currentLine = words[i] + ' ';
        } else {
            currentLine += words[i] + ' ';
        }
    }

    if (currentLine.trim() !== '') {
        lineCount++;
    }

    return lineCount;
};

const calculateLineNumbers = () => {
    const lines = textarea.value.split('\n');
    const numLines = lines.map((line) => calculateNumLines(line));

    let lineNumbers = [];
    let i = 1;
    while (numLines.length > 0) {
        const numLinesOfSentence = numLines.shift();
        lineNumbers.push(i);
        if (numLinesOfSentence > 1) {
            Array(numLinesOfSentence - 1)
                .fill('')
                .forEach((_) => lineNumbers.push(''));
        }
        i++;
    }

    return lineNumbers;
};

const displayLineNumbers = () => {
    const lineNumbers = calculateLineNumbers();
    linenumel.innerHTML = Array.from({
        length: lineNumbers.length
    }, (_, i) => `<div>${lineNumbers[i] || ' '}</div>`).join('');
};

displayLineNumbers();
$(textarea).off("input").on('input', function() {
    displayLineNumbers();
});

const ro = new ResizeObserver(() => {
    const rect = textarea.getBoundingClientRect();
    linenumel.style.height = `${rect.height}px`;
    displayLineNumbers();
});
ro.observe(textarea);

$(linenumel).off("scroll").on('scroll', function(e) {
    $(textarea).scrollTop($(this).scrollTop());
});

$(textarea).off("scroll").on('scroll', function() {
    $(linenumel).scrollTop($(this).scrollTop());
});
}

function auto_grow(element) {

// Autogrow element height
element.style.height = (element.scrollHeight) + "px";
}

function check_char_count(element, event) {
var tagname = element.tagName.toLowerCase();
var maxLength = $(element).attr("char-limit") || 2000;
var currentLength = $(element).val().length;
var charcountel = $(element).parent().next().hasClass("char-count") ? $(element).parent().next() : null;

if (currentLength >= maxLength) {
    // event.preventDefault();
    
    // Curtail text
    $(element).val($(element).val().substring(0, maxLength));

    if (tagname == "textarea" && charcountel) $(element).parent().css({"border": "2px solid crimson"});
    else $(element).css({"border": "2px solid crimson"});
    
    if (charcountel) {
        charcountel.css({"color": "crimson"});
        charcountel.text(multiline(function () {/* 
            ⛔ {{charcount}}/{{charlimit}}
        */}, {
            charcount: maxLength.toString(),
            charlimit: maxLength.toString()
        }));
    }

    return false;
}
else {
    if (tagname == "textarea" &&  charcountel) $(element).parent().css({"border": "1px solid #CCCCCC"});
    else $(element).css({"border": "1px solid #CCCCCC"});
    
    if (charcountel) {
        charcountel.css({"color": "unset"});
        charcountel.text(multiline(function () {/* 
            🖊️ {{charcount}}/{{charlimit}}
        */}, {
            charcount: Math.min(currentLength, maxLength).toString(),
            charlimit: maxLength.toString()
        }));
    }

    return true;
}
}

function uploadtomonday(args) {
var item_id = args.item;
var files = args.files;
var column = args.column;

for (var i = 0; i < files.length; i++) {
    var filedata = files[i];

    var formData = new FormData();
    formData.append('query', `
        mutation ($file: File!) {
            add_file_to_column ( file: $file, item_id: ${item_id}, column_id: "${column}") {
                id
            }
        }
    `);
    formData.append('variables[file]', filedata);

    $.ajax({
        url: 'https://api.monday.com/v2/',
        type: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        headers: {
            'Authorization': api
        },
        success: function (response) {
            console.log('File uploaded successfully:', response);
        },
        error: function (xhr, status, error) {
            console.error('Error uploading file:', error);
        }
    });
}
}