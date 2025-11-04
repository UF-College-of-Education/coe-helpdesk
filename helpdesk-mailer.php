<?php


    // Enable detailed error reporting for debugging purposes
    error_reporting(E_ALL);
    ini_set('display_errors', 1);

    /*
        Ping API
        --------
        This creates a GET REST endpoint that the helpdesk website can call.
        This serves as a check for a syntax-error in this file.
    */
    if ($_SERVER['REQUEST_METHOD'] == 'GET' && strpos($_SERVER['REQUEST_URI'], '?ping') !== false) {
        http_response_code(200);
        echo json_encode(array('message' => 'pong', "status" => "success", "code" => "ping"));
        return true;
    }

    /*
        Get the 'action' and 'recaptcha_response' from the POST request, if they exist 
        --------
        'action': This determines if the form submission needs to be forwarded as an email or
                    whether forwarded to a monday.com board.

        'recaptcha_response': This variable is required to validate the form submission using
                    Google reCAPTCHA.
    */
    $action = isset($_POST['action']) ? $_POST['action'] : null;
    $recaptcha_response = isset($_POST['recaptcha_response']) ? $_POST['recaptcha_response'] : NULL;

    // If no action is provided, return a 400 HTTP response with an error message
    if (!isset($action)) {
        http_response_code(400);
        echo json_encode(array('message' => 'No action provided.', "status" => "error", "code" => "noorder"));
        return;
    }

    // Function to verify the Google reCAPTCHA response
    function verifycaptcha($recaptcha_response, $threshold = 0.5) {

        // If the reCAPTCHA response is null, return false
        if ($recaptcha_response == NULL) return false;

        // Google reCAPTCHA secret key
        $secret = '6Ld7B3UmAAAAAJ4rJ-HwbEO5ooryuXssVOrhL_SP';

        // Prepare the data to be sent to Google's reCAPTCHA verification API
        $url = 'https://www.google.com/recaptcha/api/siteverify';
        $data = array(
            'secret' => $secret,
            'response' => $recaptcha_response
        );

        // Set up the HTTP POST request options
        $options = array(
            'http' => array(
                'header'  => "Content-type: application/x-www-form-urlencoded\r\n",
                'method'  => 'POST',
                'content' => http_build_query($data),
            ),
        );

        // Send the POST request and decode the JSON response from Google
        $context  = stream_context_create($options);
        $response = file_get_contents($url, false, $context);
        
        $result = json_decode($response);

        // Check if reCAPTCHA was successful and the score meets the threshold
        if ($result->success && $result->score >= $threshold) {
            return true;
        } else {
            // Return false if reCAPTCHA verification failed
            return false;
        }
    }

    /*
        Use the MrMcFeely.php file on 'ops' website to send an email
        --------
        MrMcFeely.php is a script written and maintained by Mark Dinsmore (as of 09/13/2024).
        Any alternative email delivery service can be used.  
    */
    function send_mcfeely_request($data) {

        $tos = $data['tos'];
        $requestoridentifier = $data['requestoridentifier'];
        $attachment = $data['attachment'] ?? "";
        $attachment_name = $data['attachment_name'] ?? "";

        $from = $data['from'] ?? "[ETC] <helpdeskform@education.ufl.edu>";
        $subject = $data['subject'] ?? "New Helpdesk Request";
        $message = $data['message'] ?? "No email body provided.";

        $catfood["catfood"]= "helpdeskform" . "|X|$tos|X|$subject|X|$message";
        $catfood["type"]="html";
        
        $catfood["headers"] = "from: $from\r\n" .
            "forward-from: $from\r\n" .
            "reply-to: $from\r\n";

        // Handle attachment
        if(!empty($attachment)) {
            $catfood['attachment'] = curl_file_create($attachment, mime_content_type($attachment), $attachment_name);
        }
        
        // Send a curl request to siteshifter
        $ch = curl_init();
        // $url="https://siteshifter.education.ufl.edu/bocky/mrMcFeely.php";
		$url="https://ops.education.ufl.edu/mrMcFeely.php";
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $catfood);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST,  2);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER,1);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, FALSE);
        
        $sendemout=curl_exec($ch);		error_log("BOCKY::: $sendemout");

        // Check for error response
        if(curl_errno($ch)){
            $fart=curl_error($ch);
            error_log("BOCKY::: '$sendemout' -- $fart");
        }

        curl_close($ch);

        // Return the response code
        return $sendemout;
    }

    // Function to check the attachment size, defaulting to 5 MB
    function check_attachment_size($attachment, $max_size = 5 * 1024 * 1024) {
        if (!empty($attachment)) {
            $fileSize = filesize($attachment);
            
            // Return false if the attachment size exceeds 5 MB/provided max_size
            if ($fileSize > $max_size) { 
                return false;
            }
            return true;
        }
        return true;  // No attachment, so it's valid
    }

    // Main function to handle sending the email
    function newsendemail($data) {

        if (!$data['enable']) return false;  // If sending email is not enabled, return false

        // Initialize attachment variables
        $attachment = '';
        $attachment_name = '';
        
        // Check if a file is uploaded and its upload is error-free
        if(isset($_FILES['file_upload']) && $_FILES['file_upload']['error'] == 0) {
            $attachment = $_FILES['file_upload']['tmp_name'];  // Temp location of the file
            $dummy = mime_content_type ($_FILES['file_upload']['tmp_name']);		// invalid file uploads (like an HTML file) will throw an error
            $attachment_name = $_FILES['file_upload']['name'];  // Original file name
            
            // Check attachment size using the check_attachment_size function
            if (!check_attachment_size($attachment)) {
                // Respond with a 400 error if the file exceeds the size limit
                http_response_code(400);
                echo json_encode(array(
                    'message' => 'Attachment size exceeds the limit of 5 MB.',
                    'status' => 'error',
                    "code" => 'bigchocopie'
                ));
                return false;
            }

            $data['attachment'] = $attachment;
            $data['attachment_name'] = $attachment_name;
        }
        
        // Forward the request to Mr. McFeely
        $errorcode = send_mcfeely_request($data);

        // If the 'send_http_response' flag is true (or not set), send a response
        if ($data['send_http_response'] ?? true) {

            if($errorcode === false || strpos($errorcode, "no love") !== false) {
                // Send a 400 error if something went wrong
                http_response_code(400);
                echo json_encode(array('message' => 'Something went wrong, please try again.', "status" => "error", "code" => $errorcode));
                return false;
            } else {
                // If no error, respond with success
                http_response_code(200);
                echo json_encode(array('message' => 'The form has been successfully submitted.', "status" => "success", "reference-id" => $data['reference_id'], "code" => $errorcode));
                return true;
            }
        }
    }

    // Verify form submission using reCAPTCHA
    $verified = verifycaptcha($recaptcha_response);

    if (!$verified) {
        http_response_code(403);
        echo json_encode(array('message' => 'Your activity has been marked as suspicious by reCAPTCHA. Try again later.', "status" => "error", "code" => "badbaker"));
        return;
    }

    /*
        Check if the action type is form submission
        --------

        Adding a new form category
        --------
        To add a new form category, 
            1. Duplicate an if block and change the conditional statement as needed.
                
                e.g.: For a new category "pto-request"
                    else if ($formcategory == "pto-request") {
                        ....
                    }

            2. Update the postdata form variables list

            3. Construct $helpdesk_email_body and $response_email_body

            4. Ensure the $destination_emails has the correct destination email address(es).
                Seperate each email address using a comma (,).
                e.g.: 
                    help@coe.ufl.edu,pagade@ufl.edu,kentfuchs@ufl.edu

            5. That's it.
    */
    if ($action == "form-email") {

        
        // Get form category
        $formcategory = $_POST['form_category'];
        $reference_id = $_POST['reference_id'];

        /*
            This text will be sent as a "receipt" to the person filling out the form. 
            This text prefaces the form submission data.
        */
        $response_email_preface = "We have received your request. We will get in touch with you shortly.<br>This is an automated email, <u>please do NOT reply to this email</u>.<br/><br/>" .
            "For any updates to your request, please fill out the form again by visiting <a href='https://helpdesk.education.ufl.edu'>COE helpdesk</a> and provide the reference ID mentioned below.<br/>" .
            "Reference ID: <b>" . $reference_id . "</b><br/><br/>" .
            "Your submission details are below.<hr>";

        // Initialize variables
        $destination_emails = "";
        $helpdesk_email_body = "";
        $response_email_body = "";
        $fullname = "";
        $email = "";
        $invalidcategoryflag = false;

        // IT request form
        if ($formcategory == "it-request") {

            // Get post data form variables
            $destination_emails = "help@coe.ufl.edu";
            $email = $_POST['email'];
            $fullname = $_POST['fullname'];
            $department = $_POST['department'];
            $issue_type = $_POST['issue_type'];
            $description = $_POST['description'];
            $urgency = $_POST['urgency'];
            
            // Manage uploaded file
            $attachment = '';
            $attachment_name = '';
            if(isset($_FILES['file_upload']) && $_FILES['file_upload']['error'] == 0) {
                $attachment = $_FILES['file_upload']['tmp_name'];
                $attachment_name = $_FILES['file_upload']['name'];
            }

            // Helpdesk email body (to be sent to the support team)
            $helpdesk_email_body =   "Category: $formcategory<br/>" .
                "Reference #: $reference_id<br/>" .
                "Name: $fullname<br/>" .
                "Email: $email<br/>" .
                "Department: $department<br/>" .
                "Issue Type: $issue_type<br/>" .
                "Description: $description<br/>" .
                "Urgency: $urgency<br/>" .
                "Attachment: " . (isset($_FILES['file_upload']) ? "Yes" : "No");

            // Response email body (to be sent to the form submitter)
            $response_email_body =  $response_email_preface .
                "Category: $formcategory<br/>" .
                "Reference #: $reference_id<br/>" .
                "Name: $fullname<br/>" .
                "Email: $email<br/>" .
                "Department: $department<br/>" .
                "Issue Type: $issue_type<br/>" .
                "Description: $description<br/>" .
                "Urgency: $urgency<br/>" .
                "Attachment: " . (isset($_FILES['file_upload']) ? "Yes" : "No");

        }

        // User management form
        else if ($formcategory == "user-management") {


            // Get post data form variables
            $destination_emails = "help@coe.ufl.edu";
            $fullname = $_POST['fullname'];
            $email = $_POST['email'];
            $issue_type = $_POST['issue_type'];
            $department = $_POST['department'];
            $email_alias = $_POST['email-alias'];
            $email_list = $_POST['email-list'];
            $employee_name = $_POST['employee-name'];
            $employee_id = $_POST['employee-id'];
            $start_date = $_POST['start-date'];
            $termination_date = $_POST['termination-date'];
            $grant_project = $_POST['grant-project'];
            $room_number = $_POST['room-number'];
            $description = $_POST['description'];

            // Helpdesk email body (to be sent to the support team)
            $helpdesk_email_body =   "Category: $formcategory<br/>" .
                "Reference #: $reference_id<br/>" .
                "Name: $fullname<br/>" .
                "Email: $email<br/>" .
                "Issue type: $issue_type<br/>" .
                "Department: $department<br/>" .
                "Description: $description<br/>" .
                "Attachment: " . (isset($_FILES['file_upload']) ? "Yes<br/>" : "None<br/>").
                (empty($employee_name) ? "" : "Employee name: $employee_name<br/>") .
                (empty($employee_id) ? "" : "Employee UFID/ID: $employee_id<br/>") .
                (empty($start_date) ? "" : "Start date: $start_date<br/>") .
                (empty($termination_date) ? "" : "Termination date: $termination_date<br/>") .
                (empty($email_alias) ? "" : "Email alias: $email_alias<br/>") .
                (empty($email_list) ? "" :  "Email list: $email_list<br/>") .
                (empty($grant_project) ? "" : "Grant/Project: $grant_project<br/>") .
                (empty($room_number) ? "" : "Room number: $room_number<br/>");


            // Response email body (to be sent to the form submitter)
            $response_email_body =  $response_email_preface .
                "Category: $formcategory<br/>" .
                "Reference #: $reference_id<br/>" .
                "Name: $fullname<br/>" .
                "Email: $email<br/>" .
                "Issue type: $issue_type<br/>" .
                "Department: $department<br/>" .
                (empty($employee_name) ? "" : "Employee name: $employee_name<br/>") .
                (empty($employee_id) ? "" : "Employee UFID/ID: $employee_id<br/>") .
                (empty($start_date) ? "" : "Start date: $start_date<br/>") .
                (empty($termination_date) ? "" : "Termination date: $termination_date<br/>") .
                "Email alias: $email_alias<br/>" .
                "Email list: $email_list<br/>" .
                (empty($grant_project) ? "" : "Grant/Project: $grant_project<br/>") .
                (empty($room_number) ? "" : "Room number: $room_number<br/>") .
                "Description: $description<br/>" .
                "Attachment: " . (isset($_FILES['file_upload']) ? "Yes" : "None");
        } 
        
        // Course request (Online Canvas support) form
        else if ($formcategory == "course-request") {

            // Get post data form variables
            $destination_emails = "help@coe.ufl.edu";
            $email = $_POST['email'];
            $fullname = $_POST['fullname'];
            $role = $_POST['role'];
            $note = $_POST['note'];
            
            $attachment = '';
            $attachment_name = '';
            if(isset($_FILES['file_upload']) && $_FILES['file_upload']['error'] == 0) {
                $attachment = $_FILES['file_upload']['tmp_name'];
                $attachment_name = $_FILES['file_upload']['name'];
            }

            // Helpdesk email body (to be sent to the support team)
            $helpdesk_email_body =   "Category: $formcategory<br/>" .
                "Reference #: $reference_id<br/>" .
                "Name: $fullname<br/>" .
                "Role: $role<br/>" .
                "Email: $email<br/>" .
                "Note: $note<br/>" .
                "Attachment: " . (isset($_FILES['file_upload']) ? "Yes" : "No");

            // Response email body (to be sent to the form submitter)
            $response_email_body =  $response_email_preface .
                "Category: $formcategory<br/>" .
                "Reference #: $reference_id<br/>" .
                "Name: $fullname<br/>" .
                "Role: $role<br/>" .
                "Email: $email<br/>" .
                "Note: $note<br/>" .
                "Attachment: " . (isset($_FILES['file_upload']) ? "Yes" : "No");
        }
        
        // Photo request form
        else if ($formcategory == "photo-request") {

            // Get post data form variables
            $destination_emails = "coe-photos@coe.ufl.edu";
            $email = $_POST['email'];
            $fullname = $_POST['fullname'];
            $phone = $_POST['phone'];
            $date = $_POST['date'];
            $starttime = $_POST['start_time'];
            $endtime = $_POST['end_time'];
            $location = $_POST['location'];
            $request_type = $_POST['request_type'];
            $other_info = $_POST['other_info'];
            
            // Manage uploaded file
            $attachment = '';
            $attachment_name = '';
            if(isset($_FILES['photo']) && $_FILES['photo']['error'] == 0) {
                $attachment = $_FILES['photo']['tmp_name'];
                $attachment_name = $_FILES['photo']['name'];
            }

            // Helpdesk email body (to be sent to the support team)
            $helpdesk_email_body =   "Category: $formcategory<br/>" .
                "Reference #: $reference_id<br/>" .
                "Name: $fullname<br/>" .
                "Email: $email<br/>" .
                "Phone: $phone<br/>" .
                "Date: $date<br/>" .
                "Start Time: $starttime<br/>" .
                "End Time: $endtime<br/>" .
                "Location: $location<br/>" .
                "Request Type: $request_type<br/>" .
                "Other Information: $other_info<br/>" .
                "Attachment: " . (isset($_FILES['file_upload']) ? "Yes" : "No");

            // Response email body (to be sent to the form submitter)
            $response_email_body =  $response_email_preface .
                "Category: $formcategory<br/>" .
                "Reference #: $reference_id<br/>" .
                "Name: $fullname<br/>" .
                "Email: $email<br/>" .
                "Phone: $phone<br/>" .
                "Date: $date<br/>" .
                "Start Time: $starttime<br/>" .
                "End Time: $endtime<br/>" .
                "Location: $location<br/>" .
                "Request Type: $request_type<br/>" .
                "Other Information: $other_info<br/>" .
                "Attachment: " . (isset($_FILES['file_upload']) ? "Yes" : "No");
        }
        
        // Video studio request form
        else if ($formcategory == "video-studio-request") {

            // Get post data form variables
            $destination_emails = "angela.epps@ufl.edu,iclontz@ufl.edu,jda@coe.ufl.edu,jamie.dale@coe.ufl.edu,kaylasharp@ufl.edu";
            // $recipients_info = "<br/>Also sent to: angela.epps@ufl.edu, iclontz@ufl.edu, jda@coe.ufl.edu, jamie.dale@coe.ufl.edu, kaylasharp@ufl.edu<br/>";
            $fullname = $_POST['fullname'];
            $email = $_POST['email'];
            $faculty_advisor = $_POST['faculty_advisor'];
            $purpose = $_POST['purpose'];
            $on_camera_talent = $_POST['on_camera_talent'];
            $talent_email = $_POST['talent_email'];
            $etc_studio_space = $_POST['etc_studio_space'];
            $alt_location = $_POST['alt_location'];
            $parking_permit = $_POST['parking_permit'];
            $date = $_POST['date'];
            $other_info = $_POST['other_info'];
            
            // Initialize variables for the file upload
            $attachment = '';
            $attachment_name = '';
            if(isset($_FILES['file_upload']) && $_FILES['file_upload']['error'] == 0) {
                $attachment = $_FILES['file_upload']['tmp_name'];
                $attachment_name = $_FILES['file_upload']['name'];
            }

            // Helpdesk email body (to be sent to the support team)
            $helpdesk_email_body =   "Category: $formcategory<br/>" .
                "Reference ID: $reference_id<br/>" .
                "Full Name: $fullname<br/>" .
                "Email: $email<br/>" .
                "Faculty Advisor: $faculty_advisor<br/>" .
                "Purpose: $purpose<br/>" .
                "On-Camera Talent: $on_camera_talent<br/>" .
                "Talent Email: $talent_email<br/>" .
                "ETC Studio Space: $etc_studio_space<br/>" .
                "Alternate Location: $alt_location<br/>" .
                "Parking Permit: $parking_permit<br/>" .
                "Date: $date<br/>" .
                "Other Information: $other_info<br/>" .
                "Attachment: " . (isset($_FILES['file_upload']) ? "Yes" : "No");

            // Response email body (to be sent to the form submitter)
            $response_email_body =  $response_email_preface .
                "Category: $formcategory<br/>" .
                "Reference ID: $reference_id<br/>" .
                "Full Name: $fullname<br/>" .
                "Email: $email<br/>" .
                "Faculty Advisor: $faculty_advisor<br/>" .
                "Purpose: $purpose<br/>" .
                "On-Camera Talent: $on_camera_talent<br/>" .
                "Talent Email: $talent_email<br/>" .
                "ETC Studio Space: $etc_studio_space<br/>" .
                "Alternate Location: $alt_location<br/>" .
                "Parking Permit: $parking_permit<br/>" .
                "Date: $date<br/>" .
                "Other Information: $other_info<br/>" .
                "Attachment: " . (isset($_FILES['file_upload']) ? "Yes" : "No");
        }
        
        // News and communications form
        else if ($formcategory == "news-and-communications") {

            // Get post data form variables
            $destination_emails = "news@coe.ufl.edu";
            $email = $_POST['email'];
            $fullname = $_POST['fullname'];
            $who = $_POST['who'];
            $formcategory = $_POST['form_category'];
            $what = $_POST['what'];
            $when = $_POST['when'];
            $why = $_POST['why'];
            $where = $_POST['where'];
            $link = $_POST['link'];
            $needs = $_POST['needs'];
            
            // Initialize variables for the file upload
            $attachment = '';
            $attachment_name = '';
            if(isset($_FILES['file_upload']) && $_FILES['file_upload']['error'] == 0) {
                $attachment = $_FILES['file_upload']['tmp_name'];
                $attachment_name = $_FILES['file_upload']['name'];
            }

            // Helpdesk email body (to be sent to the support team)
            $helpdesk_email_body =   "Category: $formcategory<br/>" .
                "Reference ID: $reference_id<br/>" .
                "Email: $email<br/>" .
                "Full name: $fullname<br/>" .
                "Who: $who<br/>" .
                "What: $what<br/>" .
                "When: $when<br/>" .
                "Why: $why<br/>" .
                "Where: $where<br/>" .
                "Link: $link<br/>" .
                "Needs: $needs<br/>" .
                "Attachment: " . (isset($_FILES['file_upload']) ? "Yes" : "No");

            // Response email body (to be sent to the form submitter)
            $response_email_body =  $response_email_preface .
                "Category: $formcategory<br/>" .
                "Reference ID: $reference_id<br/>" .
                "Full name: $fullname<br/>" .
                "Email: $email<br/>" .
                "Who: $who<br/>" .
                "What: $what<br/>" .
                "When: $when<br/>" .
                "Why: $why<br/>" .
                "Where: $where<br/>" .
                "Link: $link<br/>" .
                "Needs: $needs<br/>" .
                "Attachment: " . (isset($_FILES['file_upload']) ? "Yes" : "No");

        }
        
        // Invalid/empty form category
        else {
            $invalidcategoryflag = true;
            
            http_response_code(400);
            echo json_encode(array('message' => 'Invalid/empty form category received: ' . $formcategory, "status" => "error", "code" => "noingredients"));
            return;
        }

        /*
            Send emails 
        */
        if (!$invalidcategoryflag) {

            /* 
                An array of all testers' emails.
                -----
                If the form field 'email' is found in the $testers array, the email will be
                sent to the tester only (and not to the helpdesk email).

                Example of $tester array:
                $testers = array("pagade@ufl.edu", "kentfuchs@ufl.edu");
            */
            $testers = array();

            // If the submitter is a tester, send the email to the tester only
            if (in_array($email, $testers)) { 
                $destination_emails = $email;
            }

            // Send email to the helpdesk
            $success = newsendemail([
                'enable' => true,
                'reference_id' => $reference_id,
                'subject' => "Helpdesk request - " . $formcategory,
                'tos' => $destination_emails,
                'message' => $helpdesk_email_body,
                'requestoridentifier' => $fullname,
                'from' => $fullname . " <" . $email . ">",
            ]);

            // Send a confirmation email to the form submitter
            if(!empty($response_email_body)){
				$success = newsendemail([
					'enable' => $success,               // Send this email ONLY if previous step succeeded
					'send_http_response' => false,      // Prevent sending an HTTP response after this email
					'reference_id' => $reference_id,
					'subject' => "Your Helpdesk request has been received",
					'tos' => $email,                    // Email of the form submitter (requestor)
					'message' => $response_email_body,
					'requestoridentifier' => $fullname
				]);
			}
        }
    }

    // Check if the action requires forwarding the https request to monday.com API
    else if ($action == "monday") {

        // Creates a new board item
        function createItem($args) {
            
            if (empty($args)) {
                return false;
            }
        
            $url = 'https://api.monday.com/v2';
        
            $boardId = $args['board'];
            $groupId = $args['group'];
            $itemName = isset($args['item']['name']) ? $args['item']['name'] : "Item name not provided";
            $itemDescription = isset($args['item']['description']) ? $args['item']['description'] : "Item description not provided";
            $columns = json_encode($args['columns']);
        
            $query = "
                mutation {
                    create_item(
                        board_id: $boardId,
                        item_name: \"$itemName\",
                        group_id: \"$groupId\",
                        column_values: $columns,
                        create_labels_if_missing: true
                    ) {
                        id
                    }
                }
            ";
        
            $headers = [
                "Content-Type: application/json",
                "Authorization: " . "eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjM5Njc0MDk4NiwiYWFpIjoxMSwidWlkIjozODYxNjA2NywiaWFkIjoiMjAyNC0wOC0xM1QxOToyMzoxNi40OTJaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6MTQ5MjI4NTksInJnbiI6InVzZTEifQ.9_1Ddg1EntwN8iclPVxvJLk2wDoNBcx4W5AU_gHLxUA"
            ];
        
            $options = [
                'http' => [
                    'header'  => implode("\r\n", $headers),
                    'method'  => 'POST',
                    'content' => json_encode(['query' => $query]),
                ]
            ];
        
            $context  = stream_context_create($options);
            $result = file_get_contents($url, false, $context);
        
            if ($result === FALSE) {
                echo "Error creating item.\n";
                return $result;
            }
        
            $response = json_decode($result, true);
        
            if (isset($response['errors'])) {
                echo "Errors creating item:\n";
                print_r($response['errors']);
            } else {
                if (isset($response['data']['create_item']['id'])) {
                    if (isset($args['callback'])) {
                        call_user_func($args['callback'], $response, true);
                    }
                } 
                
                // On error
                else {
                    // print_r($response["error_message"]);

                    if (isset($args['callback'])) {
                        call_user_func($args['callback'], $response, false);
                    }
                }
            }
        }

        // Uploads a file to an already existing item (identified by the item's ID)
        function uploadToMonday( $token, $item_id, $files_category, $column) {
            // Initialize a cURL session
            $ch = curl_init();
            
            $files = $_FILES[$files_category];
            if ($files == NULL) return false;
        
            // If the $files contain multiple files
            if (is_array($files['tmp_name'])) {

                $success = true;
                foreach ($files['tmp_name'] as $index => $tmp_name) {

                    // Access the file data
                    $file = [
                        'tmp_name' => $files['tmp_name'][$index],
                        'name' => $files['name'][$index],
                        'type' => $files['type'][$index],
                        'error' => $files['error'][$index],
                        'size' => $files['size'][$index],
                    ];

                    // Create the GraphQL mutation query
                    $query = '
                        mutation ($file: File!) {
                            add_file_to_column(file: $file, item_id: ' . $item_id . ', column_id: "' . $column . '") {
                                id
                            }
                        }
                    ';

                    // Prepare the form data
                    $formData = [
                        'query' => $query,
                        'variables[file]' => new CURLFile($file['tmp_name'], $file['type'], $file['name'])
                    ];

                    // Set cURL options
                    curl_setopt($ch, CURLOPT_URL, 'https://api.monday.com/v2/file');
                    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                    curl_setopt($ch, CURLOPT_POST, true);
                    curl_setopt($ch, CURLOPT_POSTFIELDS, $formData);
                    curl_setopt($ch, CURLOPT_HTTPHEADER, [
                        'Authorization: Bearer ' . "eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjM5Njc0MDk4NiwiYWFpIjoxMSwidWlkIjozODYxNjA2NywiaWFkIjoiMjAyNC0wOC0xM1QxOToyMzoxNi40OTJaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6MTQ5MjI4NTksInJnbiI6InVzZTEifQ.9_1Ddg1EntwN8iclPVxvJLk2wDoNBcx4W5AU_gHLxUA",
                        'Content-Type: multipart/form-data'
                    ]);

                    // Execute the cURL request
                    $response = curl_exec($ch);

                    // Check for cURL errors
                    if ($response === false) {
                        $error = curl_error($ch);
                        // echo "Error uploading file: $error\n";
                    } else {
                        // echo "File uploaded successfully.\n";
                    }
                    
                    $success = $success && $response;
                }

                return $success;
            }

            // If only one file is sent
            else {

                // Access the file data
                $file = [
                    'tmp_name' => $files['tmp_name'],
                    'name' => $files['name'],
                    'type' => $files['type'],
                    'error' => $files['error'],
                    'size' => $files['size'],
                ];

                // Create the GraphQL mutation query
                $query = '
                    mutation ($file: File!) {
                        add_file_to_column(file: $file, item_id: ' . $item_id . ', column_id: "' . $column . '") {
                            id
                        }
                    }
                ';

                // Prepare the form data
                $formData = [
                    'query' => $query,
                    'variables[file]' => new CURLFile($file['tmp_name'], $file['type'], $file['name'])
                ];

                // Set cURL options
                curl_setopt($ch, CURLOPT_URL, 'https://api.monday.com/v2/');
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_POST, true);
                curl_setopt($ch, CURLOPT_POSTFIELDS, $formData);
                curl_setopt($ch, CURLOPT_HTTPHEADER, [
                    'Authorization: Bearer ' . "eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjM5Njc0MDk4NiwiYWFpIjoxMSwidWlkIjozODYxNjA2NywiaWFkIjoiMjAyNC0wOC0xM1QxOToyMzoxNi40OTJaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6MTQ5MjI4NTksInJnbiI6InVzZTEifQ.9_1Ddg1EntwN8iclPVxvJLk2wDoNBcx4W5AU_gHLxUA",
                    'Content-Type: multipart/form-data'
                ]);

                // Execute the cURL request
                $response = curl_exec($ch);

                // Check for cURL errors
                if ($response === false) {
                    $error = curl_error($ch);
                    // echo "Error uploading file: $error\n";
                } else {
                    // echo "File uploaded successfully: $response\n";
                }
            }
            
            // Close the cURL session
            curl_close($ch);

            return $response;
        }

        // Check if the file size is under the maximum allowed size
        function fileSizeCheck($files_category) {
            $maxSize = 5 * 1024 * 1024;
            $problemFiles = []; // Array to hold names of files that exceed the max size
            
            if (isset($_FILES[$files_category])) {
                $files = $_FILES[$files_category];
                if ($files == NULL) return ['status' => true]; // Return status as true if no files are found
            
                // If the $files contain multiple files
                if (is_array($files['tmp_name'])) {
                    foreach ($files['tmp_name'] as $index => $tmp_name) {
                        // Access the file data
                        $file = [
                            'tmp_name' => $files['tmp_name'][$index],
                            'name' => $files['name'][$index],
                            'type' => $files['type'][$index],
                            'error' => $files['error'][$index],
                            'size' => $files['size'][$index],
                        ];
            
                        if ($files['size'][$index] > $maxSize) {
                            $problemFiles[] = $file['name']; // Add the name of the file to the problemFiles array
                        }
                    }
                }
                // If only one file is sent
                else {
                    // Access the file data
                    $file = [
                        'tmp_name' => $files['tmp_name'],
                        'name' => $files['name'],
                        'type' => $files['type'],
                        'error' => $files['error'],
                        'size' => $files['size'],
                    ];
                    if ($files['size'] > $maxSize) {
                        $problemFiles[] = $file['name']; // Add the name of the file to the problemFiles array
                    }
                }
            }

            // Return status and names of problematic files
            return ['status' => empty($problemFiles), 'files' => $problemFiles];
        }

        // Get form category
        $formcategory = $_POST['form_category'];
        $reference_id = $_POST['reference_id'];
        $token = "eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjM5Njc0MDk4NiwiYWFpIjoxMSwidWlkIjozODYxNjA2NywiaWFkIjoiMjAyNC0wOC0xM1QxOToyMzoxNi40OTJaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6MTQ5MjI4NTksInJnbiI6InVzZTEifQ.9_1Ddg1EntwN8iclPVxvJLk2wDoNBcx4W5AU_gHLxUA";

        if ($formcategory == "faculty-profile") {
            
            // Collect form data (assuming $_POST is used for form data)
            $boardid = $_POST['board_id'];

            $request_type = $_POST['request_type'];
            $email = $_POST['email'];
            $faculty_name = $_POST['faculty_name'] ?? 'Not Provided';
            $display_name = $_POST['display_name'];
            $title = $_POST['title'];
            $affiliations = $_POST['affiliations'];
            $business_email = $_POST['business_email'];
            $business_phone = $_POST['business_phone'];
            $linkedin = $_POST['linkedin'];
            $twitter = $_POST['twitter'];
            $business_address = $_POST['business_address'];
            $video_profile = $_POST['video_profile'];
            $bio = $_POST['bio'];
            $primary_research_interests = strlen($_POST['primary_research_interests']) > 0 ? explode(",", $_POST['primary_research_interests']) : NULL;
            $primary_3_interests = strlen($_POST['primary_3_interests']) > 0 ? explode(",", $_POST['primary_3_interests']) : NULL;
            $education_certifications = $_POST['education_certifications'];
            $appointments_affiliations = $_POST['appointments_affiliations'];
            $activities_honors = $_POST['activities_honors'];
            $selected_grants = $_POST['selected_grants'];
            $publications_books = $_POST['publications_books'];
            $publications_articles = $_POST['publications_articles'];
            $publications_other = $_POST['publications_other'];
            $selected_presentations = $_POST['selected_presentations'];
            $selected_links = $_POST['selected_links'];
            $website_url = $_POST['website_url'];

            // Handle file uploads
            $cv_file_upload = isset($_POST['cv_file_upload']) ? $_POST['cv_file_upload'] : null;
            $supporting_file_upload = isset($_FILES['supporting_file_upload']) ? $_FILES['supporting_file_upload'] : null;

            // Enforce file size limit
            $cv_file_info = fileSizeCheck('cv_file_upload');
            $supporting_files_info = fileSizeCheck('supporting_file_upload');

            // Create item in Monday.com
            if ($cv_file_info["status"] && $supporting_files_info["status"]) {
                createItem([
                    'board' => $boardid,
                    'group' => "topics",
                    'item' => [
                        'name' => $reference_id . ": " . $email
                    ],
                    'columns' => json_encode([
                        "text_mks9zd09" => $faculty_name,
                        "short_text__1" => $display_name,
                        "short_text2__1" => $title,
                        "short_text5__1" => $affiliations,
                        "short_text6__1" => $business_address,
                        "long_text3__1" => $bio,
                        "long_text4__1" => $education_certifications,
                        "long_text1__1" => $appointments_affiliations,
                        "long_text7__1" => $activities_honors,
                        "long_text9__1" => $publications_books,
                        "long_text43__1" => $publications_articles,
                        "long_text37__1" => $publications_other,
                        "long_text41__1" => $selected_presentations,
                        "long_text6__1" => $selected_links,
                        "long_text76__1" => $selected_grants,
                        "phone__1" => [
                            "phone" => $business_phone,
                            "countryShortName" => "US"
                        ],
                        "single_select__1" => [
                            "label" => $request_type
                        ],
                        "multi_select__1" => [
                            "labels" => $primary_research_interests
                        ],
                        "dropdown__1" => [
                            "labels" => $primary_3_interests
                        ],
                        "link__1" => [
                            "url" => $linkedin,
                            "text" => $linkedin,
                        ],
                        "link5__1" => [
                            "url" => $twitter,
                            "text" => $twitter,
                        ],
                        "link3__1" => [
                            "url" => $video_profile,
                            "text" => $video_profile,
                        ],
                        "link0__1" => [
                            "url" => $website_url,
                            "text" => $website_url,
                        ],
                        "email__1" => [
                            "email" => $email,
                            "text" => $email
                        ],
                    ]),
                    'callback' => function($res, $success) use ($token, $reference_id, $cv_file_upload, $supporting_file_upload) {
                        
                        if ($success) echo json_encode(array('message' => 'The request has been submitted.', "reference-id" => $reference_id, "status" => "success", "code" => "cookiepie"));
                        else echo json_encode(array('message' => 'There was an error. Please try again.', 'error' => $res, "reference-id" => $reference_id, "status" => "error", "code" => "cookiebadpie"));
                        if ($success && isset($_FILES['cv_file_upload'])) uploadToMonday($token, $res['data']['create_item']['id'], "cv_file_upload", 'upload_file__1');
                        if ($success && isset($_FILES['supporting_file_upload'])) uploadToMonday($token, $res['data']['create_item']['id'], "supporting_file_upload", 'files__1');
                    }
                ]);
            }
            else {
                $exceeding_file_list = (!$cv_file_info["status"] ? implode($cv_file_info["files"]) : "") . (!$supporting_files_info["status"] ? implode($supporting_files_info["files"]) : "") .
                http_response_code(400);
                echo json_encode(array(
                    'message' => 'File size exceeds the limit of 5 MB: ' . $exceeding_file_list,
                    'files' => $exceeding_file_list,
                    'status' => 'error',
                    "code" => 'bigchocopie'
                ));
            }
        }
        
        else if ($formcategory == "website-edits") {

            // Collect form data (assuming $_POST is used for form data)
            $boardid = $_POST['board_id'];

            $email = $_POST['email'];
            $name = $_POST['fullname'];
            $description = $_POST['description'];
            $subject = $_POST['subject'];
            $website_url = $_POST['website_url'];
            $date = $_POST['date'];
            
            // Handle file uploads
            $file_upload = isset($_FILES['file_upload']) ? $_FILES['file_upload'] : null;

            // Enforce file size limit
            $file_upload_info = fileSizeCheck('file_upload');

            // Create item in Monday.com
            if ($file_upload_info["status"]) {

                // Create item in Monday.com
                createItem([
                    'board' => $boardid,
                    'group' => "topics",
                    'item' => [
                        'name' => $reference_id . ": " . $subject,
                        'description' => $description,
                    ],
                    'columns' => json_encode([
                        "name" => $subject,
                        "text" => $name,
                        "email" => [
                            "email" => $email,
                            "text" => $email
                        ],
                        "link" => [
                            "url" => $website_url,
                            "text" => $website_url,
                        ],
                        "long_text" => $description,
                        "date" => $date
                    ]),
                    'callback' => function($res, $success) use ($token, $reference_id, $file_upload) {
                        
                        if ($success) echo json_encode(array('message' => 'The request has been submitted.', "reference-id" => $reference_id, "status" => "success", "code" => "cookiepie"));
                        else echo json_encode(array('message' => 'There was an error. Please try again.', 'error' => $res, "reference-id" => $reference_id, "status" => "error", "code" => "cookiebadpie"));
                        if ($success && isset($_FILES['file_upload'])) uploadToMonday($token, $res['data']['create_item']['id'], "file_upload", 'file');
                    }
                ]);
            }
            else {
                $exceeding_file_list = (!$file_upload_info["status"] ? implode($file_upload_info["files"]) : "") .
                http_response_code(400);
                echo json_encode(array(
                    'message' => 'File size exceeds the limit of 5 MB: ' . $exceeding_file_list,
                    'files' => $exceeding_file_list,
                    'status' => 'error',
                    "code" => 'bigchocopie'
                ));
            }
        }
        
        else if ($formcategory == "marketing-and-design") {

            // Collect form data (assuming $_POST is used for form data)
            $boardid = $_POST['board_id'];

            $email = $_POST['email'];
            $name = $_POST['fullname'];
            $project_name = $_POST['project_name'];
            $subject = $_POST['subject'];
            $project_description = $_POST['project_description'];
            $request_type = $_POST['request_type'];
            $project_link = $_POST['project_link'];
            $due_date = $_POST['due_date'];
            $content_assistance = $_POST['content_assistance'];
            
            // Handle file uploads
            $file_upload = isset($_FILES['file_upload']) ? $_FILES['file_upload'] : null;

            // Enforce file size limit
            $file_upload_info = fileSizeCheck('file_upload');

            // Create item in Monday.com
            if ($file_upload_info["status"]) {

                createItem([
                    'board' => $boardid,
                    'group' => "topics",
                    'item' => [
                        'name' => $reference_id . ": " . $subject,
                        'description' => $project_description,
                    ],
                    'columns' => json_encode([
                        "date4" => $due_date,
                        "name" => $request_type,
                        "multi_select" => [
                            "labels" => explode(",", $request_type)
                        ],
                        "short_text" => $name,
                        "long_text" => $project_description,
                        "single_select" => [
                            "label" => $content_assistance
                        ],
                        "link" => [
                            "url" => $project_link,
                            "text" => $project_link,
                        ],
                        "email" => [
                            "email" => $email,
                            "text" => $email
                        ],
                    ]),
                    'callback' => function($res, $success) use ($token, $reference_id, $file_upload, $request_type) {
                        
                        if ($success) echo json_encode(array('type' => $request_type, 'message' => 'The request has been submitted.', "reference-id" => $reference_id, "status" => "success", "code" => "cookiepie"));
                        else echo json_encode(array('message' => 'There was an error. Please try again.', 'error' => $res, "reference-id" => $reference_id, "status" => "error", "code" => "cookiebadpie"));

                        if ($success && isset($_FILES['file_upload'])) uploadToMonday($token, $res['data']['create_item']['id'], "file_upload", 'file');
                    }
                ]);
            }
            else {
                $exceeding_file_list = (!$file_upload_info["status"] ? implode($file_upload_info["files"]) : "") .
                http_response_code(400);
                echo json_encode(array(
                    'message' => 'File size exceeds the limit of 5 MB: ' . $exceeding_file_list,
                    'files' => $exceeding_file_list,
                    'status' => 'error',
                    "code" => 'bigchocopie'
                ));
            }
        }

        else {
            echo json_encode(array('message' => 'There was an error. Category not found: ' . $formcategory, "reference-id" => $reference_id, "status" => "error", "code" => "cookiebadpie"));
        }
    }

    else {
        echo json_encode(array('message' => 'There was an error. Invalid action.', "reference-id" => $reference_id, "status" => "error", "code" => "cookiebadpie"));
    }
?>
