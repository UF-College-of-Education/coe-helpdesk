# coe-helpdesk

This is the code that powers the COE Edugator Helpdesk. It has been gathered into one repo for convenience, but the files are actually implemented in various places. 

## File Locations

The repo has been split into a frontend and backend folder. The contents of the frontend folder will be placed in code modules on the front page of the EduGator Helpdesk site. 

The contents of the backend folder are included in the child theme for the EduGator helpdesk site. Here is the relative filepath for the backend file: /var/www/html/coe-new/wp-content/themes/Divi_CoE_Child/page-953.php

An additional app is used to send tickets via email to their respective platforms. This powered by the mcfeelyfun.php script written by Mark Dinsmore.

## Ticket Creation Flow

Helpdesk tickets are created via non-traditional sequence that is not readily apparent. Here is an overview of the workflow after a user submits the form:

1. A request is sent to the Google reCAPTCHA enterprise endpoint for a token to verify user is not a bot.
2. The Helpform Form collects the ticket data and reCAPTCHA token into a FormData object.
3. The data is sent via an ajax POST request to the /helpdesk/helpdesk-mailer endpoint. This endpoint is controlled by a special page template included in the child theme (page-953.php).
4. The backend sends the token back to the Google reCAPTCHA enterprise endpoint to ensure the message has not been tampered with and it sends back a probability score that the user is a real user between 0 and 1.
5. If the reCAPTCHA check passes, emails are sent to the user and possibly the appropriate support team.
6. Depending on the type of request, tickets can be created in 2 ways:

a. If tickets need to be created in HelpSpot, an email is sent to help@coe.ufl.edu
b. If tickets need to be created in Monday, relevant ticket data is sent to their GraphQL api.

7. The receiving system creates a ticket automatically.

## ReCAPTCHA

We use the enterprise version of Google reCAPTCHA to guard against attacks. Here is the basic reCAPTCHA workflow:

1. Frontend scripts request a reCAPTCHA token from Google by invoking a function that's in an event handler we want to protect (i.e. - Form submit)
2. Google sends a token that expires in 2 mins
3. The token is sent to our own api at /helpdesk-mailer. This controlled by the page-953.php script in a child theme.
4. Our backend sends that token back to google.
5. Google sends us back a score of the likelihood it's a bot. A score of 1 means a 100% probability is a human, and a score of 0 means 0% chance the user is a human.
6. We set a threshold for the minimum score a user needs to complete an action. Currently, this is set to 0.5.

### ReCAPTCHA Management

Set up can be tricky because all of the places different settings are managed. ReCAPTCHA is now managed through Google Cloud Console attached to the education.uf@gmail.com account. You'll need five specific elements for the reCAPTCHA to work properly:

1. [Google Cloud API Key](https://console.cloud.google.com/apis/credentials?project=college-of-educa-1690491796259) - This is different than the reCAPTCHA secret key. This is at the main level of the Google Cloud credentials.
2. [Google reCAPTCHA Key ID](https://console.cloud.google.com/security/recaptcha/6Lf6di0sAAAAAKmzfGT9VbogLr4ekPhBNFfOP-o5/integration?project=college-of-educa-1690491796259)
3. [API Enpoint Url](https://console.cloud.google.com/security/recaptcha/6Lf6di0sAAAAAKmzfGT9VbogLr4ekPhBNFfOP-o5/integration?project=college-of-educa-1690491796259) - In the integration tab, under "Verify the reCAPTCHA token".
4. [ReCAPTCHA Enterprise Script](https://console.cloud.google.com/security/recaptcha/6Lf6di0sAAAAAKmzfGT9VbogLr4ekPhBNFfOP-o5/integration?project=college-of-educa-1690491796259) - In the integration tab, under "Add reCAPTCHA to your website".
5. [ReCAPTCHA Execute Function](https://console.cloud.google.com/security/recaptcha/6Lf6di0sAAAAAKmzfGT9VbogLr4ekPhBNFfOP-o5/integration?project=college-of-educa-1690491796259) - The function call should go in an event listener for an action you want to protect.

Each Google Cloud API key can be used with the full range of Google Cloud endpoints by default. For security and to avoid overcharging, we have limited the key being used to only work on the reCAPTCHA endpoint. You can think of it as the key that allows you to access the endpoint.

The Google reCAPTCHA key is different. You can think of it as the place that allows you to add reCAPTCHA to your site. 