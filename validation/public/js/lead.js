
let debounceTimers = {};
let field_modifications = [];
let message_shown = {}; 
frappe.ui.form.on('Lead', {
    onload: function(frm) {
        check_automation_enabled(frm, function (is_enabled) {
            if (is_enabled === 1) {  // Proceed only if automation is enabled
                console.log("Automation enabled. Proceeding with onload logic.");
                if (frm.is_new() && !frm.doc.custom_automate) {
                    console.log("Initializing custom_automate to 0 for new records.");
                    frm.set_value('custom_automate', 0); // Initialize custom_automate
                }
            } else {
                console.log("Automation not enabled. Skipping before_save logic.");
            }
        });
    },

    first_name: function(frm) {
        console.log("Checking first_name trigger...");

        if (frm.doc.custom_automate === 0) {
            console.log("custom_automate is 0, proceeding with automation check...");

            // Call check_automation_enabled with a callback function for the trigger check
            check_automation_enabled(frm, function(is_enabled) {
                console.log("Automation settings value inside first_name function:", is_enabled);
                console.log("Custom automate value inside first_name function:", frm.doc.custom_automate);

                if (is_enabled === 1) {
                    console.log("Automation is enabled, updating first_name.");
                    validate_and_update_field(frm, 'first_name', format_name);
                } else {
                    console.log("Automation is not enabled. Skipping first_name trigger.");
                }
            });
        } else {
            console.log("Automation is not enabled. Skipping first_name trigger.");
        }
    },

    middle_name: function(frm) {
        // Similar logic for other fields like middle_name
        if (frm.doc.custom_automate === 0) {
            check_automation_enabled(frm, function(is_enabled) {
                if (is_enabled === 1) {
                    console.log("Automation is enabled, updating middle_name.");
                    validate_and_update_field(frm, 'middle_name', format_name);
                } else {
                    console.log("Automation is not enabled. Skipping middle_name trigger.");
                }
            });
        } else {
            console.log("custom_automate is enabled. Skipping middle_name trigger.");
        }
    },

    last_name: function(frm) {
        // Similar logic for other fields like last_name
        if (frm.doc.custom_automate === 0) {
            check_automation_enabled(frm, function(is_enabled) {
                if (is_enabled === 1) {
                    console.log("Automation is enabled, updating last_name.");
                    validate_and_update_field(frm, 'last_name', format_name);
                } else {
                    console.log("Automation is not enabled. Skipping last_name trigger.");
                }
            });
        } else {
            console.log("custom_automate is enabled. Skipping last_name trigger.");
        }
    },

    job_title: function(frm) {
        // Similar logic for other fields like job_title
        if (frm.doc.custom_automate === 0) {
            check_automation_enabled(frm, function(is_enabled) {
                if (is_enabled === 1) {
                    console.log("Automation is enabled, updating job_title.");
                    validate_and_update_field(frm, 'job_title', format_name);
                } else {
                    console.log("Automation is not enabled. Skipping job_title trigger.");
                }
            });
        } else {
            console.log("custom_automate is enabled. Skipping job_title trigger.");
        }
    },

    company_name: function(frm) {
        // Similar logic for other fields like company_name
        if (frm.doc.custom_automate === 0) {
            check_automation_enabled(frm, function(is_enabled) {
                if (is_enabled === 1) {
                    console.log("Automation is enabled, updating company_name.");
                    validate_and_update_field(frm, 'company_name', format_company_name);
                } else {
                    console.log("Automation is not enabled. Skipping company_name trigger.");
                }
            });
        } else {
            console.log("custom_automate is enabled. Skipping company_name trigger.");
        }
    },

    phone: function(frm) {
        // Similar logic for other fields like phone
        if (frm.doc.custom_automate === 0) {
            check_automation_enabled(frm, function(is_enabled) {
                if (is_enabled === 1) {
                    console.log("Automation is enabled, updating phone.");
                    validate_and_update_field(frm, 'phone', format_landline_number);
                } else {
                    console.log("Automation is not enabled. Skipping phone trigger.");
                }
            });
        } else {
            console.log("custom_automate is enabled. Skipping phone trigger.");
        }
    },

    mobile_no: function(frm) {
        // Similar logic for other fields like mobile_no
        if (frm.doc.custom_automate === 0) {
            check_automation_enabled(frm, function(is_enabled) {
                if (is_enabled === 1) {
                    console.log("Automation is enabled, updating mobile_no.");
                    validate_and_update_field(frm, 'mobile_no', format_phone_number);
                } else {
                    console.log("Automation is not enabled. Skipping mobile_no trigger.");
                }
            });
        } else {
            console.log("custom_automate is enabled. Skipping mobile_no trigger.");
        }
    },

    website: function(frm) {
        // Similar logic for other fields like website
        if (frm.doc.custom_automate === 0) {
            check_automation_enabled(frm, function(is_enabled) {
                if (is_enabled === 1) {
                    console.log("Automation is enabled, updating website.");
                    validate_and_update_field(frm, 'website', format_website);
                } else {
                    console.log("Automation is not enabled. Skipping website trigger.");
                }
            });
        } else {
            console.log("custom_automate is enabled. Skipping website trigger.");
        }
    },

    email_id: function(frm) {
        // Similar logic for other fields like email_id
        if (frm.doc.custom_automate === 0) {
            check_automation_enabled(frm, function(is_enabled) {
                if (is_enabled === 1) {
                    console.log("Automation is enabled, updating email_id.");
                    validate_and_update_field(frm, 'email_id', format_email);
                } else {
                    console.log("Automation is not enabled. Skipping email_id trigger.");
                }
            });
        } else {
            console.log("custom_automate is enabled. Skipping email_id trigger.");
        }
    },

    
    after_save: function (frm) {
        // Display popup only if automation is enabled and custom_automate is 0
        check_automation_enabled(frm, function (is_enabled) {
            if (is_enabled === 1 ) {
                // Check if the popup has already been shown for this document
                if (!message_shown[frm.doc.name]) {
                    // Show popup dialog
                    let dialog = new frappe.ui.Dialog({
                        title: __('Information'),
                        fields: [
                            {
                                fieldtype: 'HTML',
                                options: __('Now you can edit the following fields manually: <br><b>First Name, Middle Name, Last Name, Company Name.</b>')
                            }
                        ],
                        primary_action_label: __('OK'),
                        primary_action: function () {
                            dialog.hide();
                        }
                    });

                    dialog.show();

                    // Mark this document as having shown the message
                    message_shown[frm.doc.name] = true;

                    // Update custom_automate to 1 after showing the popup
                    frm.set_value('custom_automate', 1);
                    frm.save();
                }
            }
        });
    },

    onload_post_render: function(frm) {
        if (!frm.is_new()) {
            frm.set_value('custom_automate', 1);
            console.log("Preventing custom_automate reset on page refresh.");
            // Retain custom_automate value even after page refresh
        }
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

                        ['first_name', 'middle_name', 'last_name', 'company_name'].forEach((field) => {
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
    }
    
});

// Utility: Validate and update fields
function validate_and_update_field(frm, fieldname, format_function) {
    // Skip formatting if custom_automate is set to 1
    if (frm.doc.custom_automate === 1) {
        console.log(`Skipping formatting for ${fieldname} as custom_automate is 1.`);
        return;
    }

    clearTimeout(debounceTimers[fieldname]);
    debounceTimers[fieldname] = setTimeout(() => {
        const formatted_value = format_function(frm.doc[fieldname]);
        if (frm.doc[fieldname] !== formatted_value) {
            frm.set_value(fieldname, formatted_value);
        }
    }, 4000); // Debounce delay
}

// Formatting Functions (same as previous implementation)
function format_name(value) {
    // Check if value is null or undefined
    if (!value) {
        return ''; // Return an empty string or handle it accordingly
    }
    value = value.replace(/[^a-zA-Z\s]/g, '').trim();
    value = value.replace(/\s+/g, ' ');
    value = value.toLowerCase();
    value = value.replace(/\b\w/g, char => char.toUpperCase());
    return value;
}


function format_company_name(value) {
    // Check if value is null or undefined
    if (!value) {
        return ''; // Return an empty string or handle it accordingly
    }

    // Remove characters except letters, spaces, hyphens, and allowed punctuation
    value = value.replace(/[^a-zA-Z\s\-.,!?\(\)'\"]+/g, '').trim();

    // Remove spaces before punctuation marks and closing brackets
    value = value.replace(/\s([.,!?)]|$)/g, '$1');

    // Remove spaces after opening brackets
    value = value.replace(/([[(])\s+/g, '$1');

    // Trim, lowercase, capitalize the first letter of each word, and remove extra spaces
    value = value.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());

    // Remove any extra spaces between words
    value = value.replace(/\s+/g, ' ');

    // Retain the trailing space if it exists
    if (value.endsWith(' ')) {
        return value;
    } else {
        return value.trim();
    }
}



function format_email(value) {
    value = value.toLowerCase().trim();
    const email_regex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/;
    if (email_regex.test(value)) {
        return value;
    } else {
        frappe.msgprint(__('Please enter a valid email address.'));
        return '';
    }
}

function format_phone_number(value) {
    // Remove all non-numeric characters
    let cleanNumber = value.replace(/[^0-9]/g, '');

    // Check if the number starts with +91 or 91, if not, assume it's a domestic number
    if (cleanNumber.startsWith('91')) {
        cleanNumber = cleanNumber.substring(2);
    }

    // Validate Indian mobile number (10 digits starting with 6-9)
    const indianMobileRegex = /^[6-9]\d{9}$/;

    if (!indianMobileRegex.test(cleanNumber)) {
        frappe.msgprint(__('Invalid Indian mobile number. Please enter a valid 10-digit mobile number.'));
        return ''; // Return an empty value if invalid
    }

    // Format as per Indian standard: +91 XXXXX XXXXX
    const formattedNumber = `+91 ${cleanNumber.substring(0, 5)} ${cleanNumber.substring(5)}`;

    return formattedNumber;
}

function format_landline_number(value) {
    // Remove all non-numeric characters
    let cleanNumber = value.replace(/[^0-9]/g, '');

    // Validate Indian landline number (2-4 digit area code and 6-8 digit local number)
    const indianLandlineRegex = /^(?:\d{2,4})\d{6,8}$/;

    // Check if the landline number matches the pattern
    if (!indianLandlineRegex.test(cleanNumber)) {
        frappe.msgprint(__('Invalid Indian landline number. Please enter a valid landline number.'));
        return ''; // Return an empty value if invalid
    }

    // Format the number with a typical area code
    let formattedLandlineNumber = '';

    // If the area code has 2-4 digits, format it as: 0480 2899983 (remove parentheses)
    if (cleanNumber.length === 10 && cleanNumber.startsWith('0')) {
        formattedLandlineNumber = `${cleanNumber.substring(0, 4)} ${cleanNumber.substring(4)}`;
    } 
    // If the area code has 3 or 4 digits, format it as: 0480 2899983
    else if (cleanNumber.length === 11 || cleanNumber.length === 12) {
        formattedLandlineNumber = `${cleanNumber.substring(0, 4)} ${cleanNumber.substring(4)}`;
    }

    return formattedLandlineNumber;
}


function format_website(value) {
        const website = frm.doc.website;
    if (!website) return;

    // Regex to check if the website starts with "http://" or "https://" (optional), followed by a valid domain
    const regex = /^(https?:\/\/)?[a-zA-Z0-9.-]+(\.[a-zA-Z]{2,})?(\/.*)?$/;

    // If the website does not match the regex pattern, clear it
    if (!regex.test(website)) {
        frappe.msgprint(__('Invalid website URL format. Ensure it contains a valid domain.'));
        frm.set_value('website', '');
    }
}


function check_automation_enabled(frm, callback) {
    frappe.call({
        method: 'frappe.client.get_value',
        args: {
            doctype: 'Automation Settings',
            fieldname: 'lead'
        },
        callback: function(response) {
            console.log("Full response:", response);
            if (response.message && response.message.lead !== undefined) {
                const automationSetting = parseInt(response.message.lead, 10);
                console.log("Parsed automation setting:", automationSetting);
                callback(automationSetting === 1 ? 1 : 0);
            } else {
                console.error("Invalid response or 'lead' field missing.");
                callback(0); // Default to not enabled
            }
        }
    });
}


// add Dictionary button

frappe.ui.form.on('Lead', {
    refresh: function (frm) {
       
        frm.add_custom_button(__('Dictionary'), function () {
            
            frappe.set_route('List', 'Dictionary');
        }, __('View'));

        
    }
});




