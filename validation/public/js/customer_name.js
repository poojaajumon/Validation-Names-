frappe.ui.form.on('Customer', {
    onload: function(frm) {
        if (frm.is_new()) {
            console.log("Form is new. Initializing custom_automate.");
            frm.set_value('custom_automate', 0); // Disable custom_automate for new forms
        }
    },

    customer_name: function(frm) {
        if (!frm.doc.custom_automate) {
            console.log("Customer Name trigger activated and custom_automate is disabled");
            check_automation_enabled(frm, function(is_enabled) {
                console.log("Automation check result:", is_enabled);
                if (is_enabled) {
                    const formatted_name = format_name(frm.doc.customer_name);
                    console.log("Formatted Name:", formatted_name);
                    frm.set_value('customer_name', formatted_name);
                }
            });
        } else {
            console.log("custom_automate is enabled. Skipping Customer Name trigger.");
        }
    },

    after_save: function(frm) {
        if (!frm.doc.custom_automate) {
            console.log("After Save: Enabling custom_automate");
            frm.set_value('custom_automate', 1); // Enable custom_automate after the first save

            // Save the form again to persist the change
            frm.save()
                .then(() => {
                    console.log("custom_automate has been enabled and saved.");
                })
                .catch((error) => {
                    console.error("Error while saving the form after enabling custom_automate:", error);
                });
        }
    }
});

function format_name(name) {
    if (!name) return '';

    console.log("Formatting name:", name);

    // List of salutations to remove
    const salutations = ["mr", "mrs", "miss", "ms", "dr", "prof", "sir", "madam", "rev"];
    const salutationRegex = new RegExp(`\\b(${salutations.join('|')})\\.?\\s`, 'i');

    // Remove salutations
    let formattedName = name.replace(salutationRegex, '');

    // Check if the last character is a space to preserve it
    const lastChar = name.slice(-1);
    const isSpaceAdded = lastChar === ' ';

    // Remove all characters except letters, spaces, and hyphens
    formattedName = formattedName.replace(/[^a-zA-Z\s\-]/g, ''); // Keep letters, spaces, and hyphens

    // Trim, lowercase, capitalize the first letter of each word, and remove extra spaces
    formattedName = formattedName.trim().toLowerCase().replace(/\b(\w)/g, function(match) {
        return match.toUpperCase();
    });

    // Remove any extra spaces between words
    formattedName = formattedName.replace(/\s+/g, ' ');

    // Retain the trailing space if it exists
    if (isSpaceAdded) {
        formattedName += ' ';
    }

    console.log("Formatted name:", formattedName);

    return formattedName;
}

function check_automation_enabled(frm, callback) {
    console.log("Checking automation enabled status");
    frappe.call({
        method: 'frappe.client.get_value',
        args: {
            doctype: 'Automation Settings',
            fieldname: 'customer'
        },
        callback: function(response) {
            console.log("Automation Settings response:", response);
            const is_enabled = response.message ? response.message.customer: false;
            callback(is_enabled);
        }
    });
}



// suggestions from Dictionary to customer_name

frappe.ui.form.on("Customer", {
    
    onload: function(frm) {
        if (frm.is_new()) {
            frm.set_value('custom_automate', 0); // Set custom_automate to 0 for new forms
        }

        if (!frm.doc.custom_automate) {
            checkAutomationEnabled(frm, function(is_enabled) {
                if (is_enabled) {
                    applyCustomerNameCorrections(frm);
                }
            });
        }
    },

    // Trigger the prompt when customer_group is clicked
    customer_group: function(frm) {
        frappe.confirm(
            'Do you want to create a new dictionary entry for customer name?',
            function() {
                openDictionaryDialog(frm);
            },
            function() {
                // User clicked 'No', do nothing
            }
        );
    },

    // When the form is saved, apply the dictionary corrections to the customer_name field
    save: function(frm) {
        if (!frm.doc.custom_automate) {
            checkAutomationEnabled(frm, function(is_enabled) {
                if (is_enabled) {
                    applyCustomerNameCorrections(frm);

                    // After applying corrections, set custom_automate to 1
                    frm.set_value('custom_automate', 1);

                    // Save the form to persist changes
                    frm.save()
                        .then(() => {
                            console.log("custom_automate has been enabled and saved.");
                        })
                        .catch((error) => {
                            console.error("Error while saving the form:", error);
                        });
                }
            });
        }
    },

    // If customer_name is changed manually, reapply corrections
    customer_name: function(frm) {
        if (!frm.doc.custom_automate) {
            checkAutomationEnabled(frm, function(is_enabled) {
                if (is_enabled) {
                    applyCustomerNameCorrections(frm);
                }
            });
        }
    }
});

// Function to open the Dictionary dialog
function openDictionaryDialog(frm) {
    const dialog = new frappe.ui.Dialog({
        title: 'Add New Dictionary Entry',
        fields: [
            {
                fieldname: 'found_word',
                label: 'Found Word',
                fieldtype: 'Data',
                reqd: 1
            },
            {
                fieldname: 'actual_word',
                label: 'Actual Word',
                fieldtype: 'Data',
                reqd: 1
            }
        ],
        primary_action_label: 'Save',
        primary_action(values) {
            // Save the dictionary entry
            frappe.call({
                method: 'frappe.client.insert',
                args: {
                    doc: {
                        doctype: 'Dictionary',
                        found_word: values.found_word,
                        actual_word: values.actual_word
                    }
                },
                callback: function(response) {
                    if (response.message) {
                        frappe.msgprint(__('Dictionary entry added successfully.'));
                        dialog.hide();
                    }
                }
            });
        }
    });

    dialog.show();
}

// Function to apply the corrections from the Dictionary to customer_name
function applyCustomerNameCorrections(frm) {
    frappe.call({
        method: "frappe.client.get_list",
        args: {
            doctype: "Dictionary",
            fields: ["found_word", "actual_word"],
        },
        callback: function(response) {
            if (response.message) {
                const corrections = response.message.reduce((acc, d) => {
                    acc[d.found_word] = d.actual_word;
                    return acc;
                }, {});

                if (corrections) {
                    const field = "customer_name";
                    if (frm.doc[field]) {
                        let updated_name = frm.doc[field];
                        for (const [incorrect, corrected] of Object.entries(corrections)) {
                            updated_name = updated_name.replace(incorrect, corrected);
                        }
                        frm.set_value(field, updated_name);
                    }
                }
            }
        },
    });
}

// Function to check if automation is enabled globally
function checkAutomationEnabled(frm, callback) {
    frappe.call({
        method: 'frappe.client.get_value',
        args: {
            doctype: 'Automation Settings', 
            fieldname: 'customer',
        },
        callback: function(response) {
            const is_enabled = response.message ? response.message.customer : false;
            callback(is_enabled);
        }
    });
}


// add Dictionary button

frappe.ui.form.on('Customer', {
    refresh: function (frm) {
       
        frm.add_custom_button(__('Dictionary'), function () {
            
            frappe.set_route('List', 'Dictionary');
        }, __('View'));

        // Add a button to create a new Dictionary in the Create section
        frm.add_custom_button(__('Dictionary'), function () {
            // Open a new Dictionary document form
            frappe.new_doc('Dictionary');
        }, __('Create'));
    }
});