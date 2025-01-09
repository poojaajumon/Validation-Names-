frappe.ui.form.on('Terms and Conditions', {
    before_save: function (frm) {
        check_automation_enabled(frm, function (is_enabled) {
            if (is_enabled === 1) {  // Proceed only if automation is enabled
                console.log("Automation enabled. Proceeding with before_save logic.");
                if (frm.is_new() && !frm.doc.custom_automate) {
                    console.log("Before Save: Initializing custom_automate to 0 for new records.");
                    frm.set_value('custom_automate', 0); // Initialize custom_automate
                }

                if (!frm.doc.custom_automate) {
                    if (frm.doc.title) frm.set_value('title', format_name(frm.doc.title));
                    if (frm.doc.terms) frm.set_value('terms', format_description(frm.doc.terms));
                } else {
                    console.log("custom_automate is enabled. Skipping field formatting.");
                }
            } else {
                console.log("Automation not enabled. Skipping before_save logic.");
            }
        });
    },

    after_save: function (frm) {
        check_automation_enabled(frm, function (is_enabled) {
            if (is_enabled === 1) {  // Proceed only if automation is enabled
                console.log("Automation enabled. Proceeding with after_save logic.");
                if (frm.doc.custom_automate === 0) {
                    console.log("After Save: Enabling custom_automate.");
                    frm.set_value('custom_automate', 1);
                    frm.save();
                }
            } else {
                console.log("Automation not enabled. Skipping after_save logic.");
            }
        });
    }
});



function check_automation_enabled(frm, callback) {
    frappe.call({
        method: 'frappe.client.get_value',
        args: {
            doctype: 'Automation Settings',
            fieldname: 'terms_and_conditions',
        },
        callback: function(response) {
            console.log("Automation Settings Response:", response);
            const is_enabled = response.message && response.message.terms_and_conditions ? parseInt(response.message.terms_and_conditions, 10) : 0; // Ensure numeric value
            callback(is_enabled);
        },
    });
}
function format_name(name) {
    if (!name) return '';

    // Remove all special characters except letters, digits, hyphen, underscore, comma, brackets, and slashes
    let formattedName = name.replace(/[^a-zA-Z0-9\s\-,_\(\)\[\]\/\\]/g, ''); // Allow letters, digits, space, hyphen, underscore, comma, brackets, and slashes

    // Trim leading/trailing spaces and normalize multiple spaces between words
    formattedName = formattedName.trim().replace(/\s+/g, ' ');

    // Handle spaces before and after punctuation and brackets
    formattedName = formattedName.replace(/\s*(?=\()|\s*(?=\[)/g, '');   // Remove space before opening brackets
    formattedName = formattedName.replace(/\s*(?=\))|\s*(?=\])/g, '');   // Remove space after closing brackets
    formattedName = formattedName.replace(/\s*(?=\,)/g, '');             // Remove space before commas

    // Capitalize the first letter of each word and keep the other letters in lowercase
    formattedName = formattedName.toLowerCase().replace(/\b(\w)/g, function(match) {
        return match.toUpperCase(); // Capitalize first letter of each word
    });

    // Return the formatted name
    return formattedName;
}


// Function to format notes
function format_description(description) {
    if (!description) {
        console.log("No description provided for formatting.");
        return '';
    }

    // Log the original description for debugging
    console.log("Original description:", description);

    // Strip HTML content and trim spaces
    let strippedDescription = description.replace(/<\/?[^>]+(>|$)/g, "").trim(); // Remove HTML tags

    if (!strippedDescription) {
        console.log("No text content found after stripping HTML.");
        return description; // Return the original description if it's empty after stripping
    }

    // Convert to sentence case
    let formattedDescription = strippedDescription.toLowerCase();
    formattedDescription =
        formattedDescription.charAt(0).toUpperCase() + formattedDescription.slice(1); // Capitalize the first letter

    // Log the formatted description
    console.log("Formatted description:", formattedDescription);

    // Return the formatted description, re-wrapped in the same HTML format as the original
    return `<div class="ql-editor read-mode"><p>${formattedDescription}</p></div>`;
}


// create Dictionary button 

frappe.ui.form.on('Terms and Conditions', {
    refresh: function (frm) {
       
        frm.add_custom_button(__('Dictionary'), function () {
            
            frappe.set_route('List', 'Dictionary');
        }, __('View'));
    }
});


// for selecting only one check box at a time

frappe.ui.form.on('Terms and Conditions', {
    refresh: function(frm) {
        // When the form is refreshed, ensure no checkbox is selected if more than one checkbox is selected
        frm.fields_dict['selling'].input.onchange = function() {
            validateSelection(frm);
        };
        frm.fields_dict['buying'].input.onchange = function() {
            validateSelection(frm);
        };
        frm.fields_dict['hr'].input.onchange = function() {
            validateSelection(frm);
        };
    }
});

// Function to validate only one checkbox is selected
function validateSelection(frm) {
    let selling = frm.doc.selling;
    let buying = frm.doc.buying;
    let hr = frm.doc.hr;

    // Log current checkbox states
    console.log("Checkbox states - Selling:", selling, "Buying:", buying, "HR:", hr);

    // Check if more than one checkbox is selected
    if (selling + buying + hr > 1) {
        console.log("More than one checkbox selected. Resetting selections.");

        // Show a popup to inform the user
        frappe.msgprint({
            title: __('Invalid Selection'),
            message: __('Only one module can be selected at a time.'),
            indicator: 'red'
        });

        // Reset all checkboxes
        if (selling) frm.set_value('selling', 0);
        if (buying) frm.set_value('buying', 0);
        if (hr) frm.set_value('hr', 0);
    } else {
        console.log("Only one checkbox selected, keeping selection.");
    }
}