frappe.ui.form.on('Contact', {
    onload: function(frm) {
        if (frm.is_new()) {
            console.log("Form is new. Initializing custom_automate.");
            frm.set_value('custom_automate', 0); // Set custom_automate to disabled for new forms
        }

        check_automation_enabled(frm, function(is_enabled) {
            console.log("Automation enabled:", is_enabled);
        });
    },

    first_name: function(frm) {
        if (!frm.doc.custom_automate) {
            console.log("First Name trigger executed");
            check_automation_enabled(frm, function(is_enabled) {
                if (is_enabled) {
                    frm.set_value('first_name', format_name(frm.doc.first_name));
                    update_full_name(frm);
                }
            });
        } else {
            console.log("custom_automate is enabled. Skipping First Name trigger.");
        }
    },

    middle_name: function(frm) {
        if (!frm.doc.custom_automate) {
            check_automation_enabled(frm, function(is_enabled) {
                if (is_enabled) {
                    frm.set_value('middle_name', format_name(frm.doc.middle_name));
                    update_full_name(frm);
                }
            });
        } else {
            console.log("custom_automate is enabled. Skipping Middle Name trigger.");
        }
    },

    last_name: function(frm) {
        if (!frm.doc.custom_automate) {
            check_automation_enabled(frm, function(is_enabled) {
                if (is_enabled) {
                    frm.set_value('last_name', format_name(frm.doc.last_name));
                    update_full_name(frm);
                }
            });
        } else {
            console.log("custom_automate is enabled. Skipping Last Name trigger.");
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

    // Remove all special characters except spaces
    let formattedName = name.replace(/[^a-zA-Z\s]/g, ''); // Keep only letters and spaces

    // Trim, lowercase, capitalize first letter of each word, and remove extra spaces
    formattedName = formattedName.trim().toLowerCase().replace(/\b(\w)/g, function(match) {
        return match.toUpperCase();
    });
    formattedName = formattedName.replace(/\s+/g, ' ');
    formattedName = formattedName.replace(/\(/g, ' (');

    return formattedName;
}

function update_full_name(frm) {
    let full_name = [frm.doc.first_name, frm.doc.middle_name, frm.doc.last_name]
        .filter(name => name) // Remove undefined or null values
        .join(' ');
    frm.set_value('full_name', full_name);
}

function check_automation_enabled(frm, callback) {
    frappe.call({
        method: 'frappe.client.get_value',
        args: {
            doctype: 'Automation Settings',
            fieldname: 'contact'
        },
        callback: function(response) {
            const is_enabled = response.message ? response.message.contact : false;
            callback(is_enabled);
        }
    });
}


// suggestions from Dictionary

frappe.ui.form.on("Contact", {
    onload: function(frm) {
        if (frm.is_new()) {
            console.log("Script Loaded");
            frm.set_value('custom_automate', 0); // Set custom_automate to 0 for new forms
        }

        if (!frm.doc.custom_automate) {
            checkAutomationEnabled(frm, function(is_enabled) {
                if (is_enabled) {
                    applyContactNameCorrections(frm);
                }
            });
        }
    },

    address: function(frm) {
        frappe.confirm(
            'Do you want to create a new dictionary entry for name?',
            function() {
                // Open a dialog instead of redirecting
                openDictionaryDialog(frm);
            },
            function() {
                // User clicked 'No', do nothing
            }
        );
    },

    save: function(frm) {
        if (!frm.doc.custom_automate) {
            checkAutomationEnabled(frm, function(is_enabled) {
                if (is_enabled) {
                    applyContactNameCorrections(frm);

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

    first_name: function(frm) {
        if (!frm.doc.custom_automate) {
            checkAutomationEnabled(frm, function(is_enabled) {
                if (is_enabled) {
                    applyContactNameCorrections(frm);
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

// Function to apply corrections from the Dictionary to the first_name field
function applyContactNameCorrections(frm) {
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
                    const field = "first_name";
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
            fieldname: 'contact',
        },
        callback: function(response) {
            const is_enabled = response.message ? response.message.contact : false;
            callback(is_enabled);
        }
    });
}


// add Dictionary button

frappe.ui.form.on('Contact', {
    refresh: function (frm) {
     
        // Add "Dictionary" under the "View" button
        frm.add_custom_button(__('Dictionary'), function () {
            // Navigate to the Dictionary List View
            frappe.set_route('List', 'Dictionary');
        }, __('View')); // Nest under "View"

        // Button to create a new Dictionary
        frm.add_custom_button(__('Create Dictionary'), function () {
            // Open a new Dictionary document form
            frappe.new_doc('Dictionary');
        });
    }
});
