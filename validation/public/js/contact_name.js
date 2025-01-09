frappe.ui.form.on('Contact', {
    before_save: function (frm) {
        check_automation_enabled(frm, function (is_enabled) {
            if (is_enabled === 1) {  // Proceed only if automation is enabled
                console.log("Automation enabled. Proceeding with before_save logic.");
                if (frm.is_new() && !frm.doc.custom_automate) {
                    console.log("Before Save: Initializing custom_automate to 0 for new records.");
                    frm.set_value('custom_automate', 0); // Initialize custom_automate
                }

                if (!frm.doc.custom_automate) {
                    if (frm.doc.first_name) frm.set_value('first_name', format_name(frm.doc.first_name));
                    if (frm.doc.middle_name) frm.set_value('middle_name', format_name(frm.doc.middle_name));
                    if (frm.doc.last_name) frm.set_value('last_name', format_name(frm.doc.last_name));
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
                                    <b>First Name, Middle Name, Last Name</b>
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

                        ['first_name', 'middle_name', 'last_name'].forEach((field) => {
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
            fieldname: 'contact',
        },
        callback: function(response) {
            console.log("Automation Settings Response:", response);
            const is_enabled = response.message && response.message.contact ? parseInt(response.message.contact, 10) : 0; // Ensure numeric value
            callback(is_enabled);
        },
    });
}

function format_name(name) {
    if (!name) return '';

    // List of salutations to remove
    const salutations = ["mr", "mrs", "miss", "ms", "dr", "prof", "sir", "madam", "rev"];
    const salutationRegex = new RegExp(`\\b(${salutations.join('|')})\\.?\\s`, 'i');
    
    // Remove salutations
    formattedName = name.replace(salutationRegex, '');

    // Remove all special characters except letters and spaces
    formattedName = name.replace(/[^a-zA-Z\s]/g, ''); // Keep only letters and spaces

    // Trim, lowercase, capitalize first letter of each word, and remove extra spaces
    formattedName = formattedName.trim().toLowerCase().replace(/\b(\w)/g, function(match) {
        return match.toUpperCase();
    });
    formattedName = formattedName.replace(/\s+/g, ' '); // Replace multiple spaces with a single space
    formattedName = formattedName.replace(/\(/g, ' ('); // Ensure space before parentheses

    return formattedName;
}


// add Dictionary button

frappe.ui.form.on('Contact', {
    refresh: function (frm) {
     
        // Add "Dictionary" under the "View" button
        frm.add_custom_button(__('Dictionary'), function () {
            // Navigate to the Dictionary List View
            frappe.set_route('List', 'Dictionary');
        }, __('View')); // Nest under "View"

    }
});

