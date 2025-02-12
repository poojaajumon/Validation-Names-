frappe.ui.form.on('Project', {
    before_save: function (frm) {
        check_automation_enabled(frm, function (is_enabled) {
            if (is_enabled === 1) {  // Proceed only if automation is enabled
                console.log("Automation enabled. Proceeding with before_save logic.");
                if (frm.is_new() && !frm.doc.custom_automate) {
                    console.log("Before Save: Initializing custom_automate to 0 for new records.");
                    frm.set_value('custom_automate', 0); // Initialize custom_automate
                }

                if (!frm.doc.custom_automate) {
                    if (frm.doc.project_name) frm.set_value('project_name', format_name(frm.doc.project_name));
                    if (frm.doc.notes) frm.set_value('notes', format_description(frm.doc.notes));
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
                    frm.save()
                        .then(() => {
                            console.log("custom_automate has been enabled and saved.");
                            frappe.msgprint({
                                title: 'Edit Fields',
                                message: `
                                    <p>Now you can edit the following fields manually:</p>
                                    <b>Project Name</b>
                                `,
                                indicator: 'blue',
                            });
                        })
                        .catch((error) => console.error("Error while saving the form after enabling custom_automate:", error));
                }
            } else {
                console.log("Automation not enabled. Skipping after_save logic.");
            }
        });
    },

    refresh: function (frm) {
        check_automation_enabled(frm, function (is_enabled) {
            if (is_enabled === 1) {  // Proceed only if automation is enabled
                console.log("Automation enabled. Proceeding with refresh logic.");
                if (!frm.is_new()) {
                    frm.add_custom_button('Add to Dictionary', function () {
                        if (frm.has_been_confirmed) {
                            frappe.msgprint({
                                title: 'Info',
                                message: 'Changes have already been added to the Dictionary.',
                                indicator: 'blue',
                            });
                            return;
                        }

                        let modified_fields = [];

                        ['project_name'].forEach((field) => {
                            const formatted_value = format_name(frm.doc[field]);
                            const current_value = frm.doc[field];
                            const original_value = frm.doc.__unsaved_values?.[field] || null;

                            if (formatted_value && formatted_value !== current_value) {
                                modified_fields.push({
                                    fieldname: field,
                                    found_word: original_value || formatted_value,
                                    actual_word: current_value || '',
                                    checked: false
                                });
                            }
                        });

                        if (modified_fields.length === 0) {
                            frappe.msgprint({
                                title: 'No Changes',
                                message: 'No fields have been modified.',
                                indicator: 'red',
                            });
                            return;
                        }

                        let fields_html = modified_fields.map(field => `
                            <div>
                                <input type="checkbox" id="${field.fieldname}" checked="${field.checked}">
                                <label for="${field.fieldname}">${field.fieldname} :</label>
                                <span>Found Word: "${field.found_word}", Actual Word: "${field.actual_word}"</span>
                            </div>`).join('');

                        frappe.confirm(
                            `<div>
                                ${fields_html}
                                <br><br>
                                Do you want to add these changes to the Dictionary?
                            </div>`,
                            function () {
                                modified_fields.forEach(field => {
                                    if (document.getElementById(field.fieldname).checked) {
                                        frappe.call({
                                            method: 'frappe.client.insert',
                                            args: {
                                                doc: {
                                                    doctype: 'Dictionary',
                                                    found_word: field.found_word,
                                                    actual_word: field.actual_word,
                                                    doctype_name: frm.doc.doctype 
                                                },
                                            },
                                            callback: function (response) {
                                                console.log('Dictionary Entry Saved:', response);
                                            },
                                            error: function (error) {
                                                console.error('Error saving to Dictionary:', error);
                                            },
                                        });
                                    }
                                });

                                frappe.msgprint({
                                    title: 'Success',
                                    message: 'Selected changes have been added to Dictionary.',
                                    indicator: 'green',
                                });

                                frm.has_been_confirmed = true;  // Set flag to prevent reappearance
                            },
                            function () {
                                frappe.msgprint({
                                    title: 'Cancelled',
                                    message: 'No changes were added to Dictionary.',
                                    indicator: 'blue',
                                });
                            }
                        );
                    });

                    // Reset the has_been_confirmed flag when a new form is loaded
                    frm.has_been_confirmed = false;
                }
            } else {
                console.log("Automation not enabled. Skipping refresh logic.");
            }
        });
    },
});

function check_automation_enabled(frm, callback) {
    frappe.call({
        method: 'frappe.client.get_value',
        args: {
            doctype: 'Automation Settings',
            fieldname: 'project',
        },
        callback: function(response) {
            console.log("Automation Settings Response:", response);
            const is_enabled = response.message && response.message.project ? parseInt(response.message.project, 10) : 0; // Ensure numeric value
            callback(is_enabled);
        },
    });
}

function format_name(name) {
    if (!name) return '';
    // Check if the name exceeds the character limit
    if (name.length > 30) {
        alert('Project Name length is limited to 30 characters');
        return ''; // Exit the function if the name is too long
    }

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


// add Dictionary button

frappe.ui.form.on('Project', {
    refresh: function (frm) {
     
        // Add "Dictionary" under the "View" button
        frm.add_custom_button(__('Dictionary'), function () {
            // Navigate to the Dictionary List View
            frappe.set_route('List', 'Dictionary');
        }, __('View')); // Nest under "View"
    }
});

