frappe.ui.form.on('Project', {
    onload: function(frm) {
        if (frm.is_new()) {
            console.log("Form is new. Initializing custom_automate.");
            frm.set_value('custom_automate', 0); // Disable custom_automate for new forms
        }
    },

    project_name: function(frm) {
        if (!frm.doc.custom_automate) {
            console.log("Projetc name trigger activated and custom_automate is disabled");
            check_automation_enabled(frm, function(is_enabled) {
                console.log("Automation check result:", is_enabled);
                if (is_enabled) {
                    const formatted_name = format_name(frm.doc.project_name);
                    console.log("Formatted Name:", formatted_name);
                    frm.set_value('project_name', formatted_name);
                }
            });
        } else {
            console.log("custom_automate is enabled. Skipping Project Name trigger.");
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

    // Remove all characters except letters, spaces, hyphens, and slashes
    let formattedName = name.replace(/[^a-zA-Z\s\-\//]/g, ''); // Keep letters, spaces, hyphens, and slashes

    // Trim, lowercase, capitalize the first letter of each word, and remove extra spaces
    formattedName = formattedName.trim().toLowerCase().replace(/\b(\w)/g, function(match) {
        return match.toUpperCase();
    });

    // Remove any extra spaces between words
    formattedName = formattedName.replace(/\s+/g, ' ');

    console.log("Formatted name:", formattedName);

    return formattedName;
}

function check_automation_enabled(frm, callback) {
    console.log("Checking automation enabled status");
    frappe.call({
        method: 'frappe.client.get_value',
        args: {
            doctype: 'Automation Settings',
            fieldname: 'project'
        },
        callback: function(response) {
            console.log("Automation Settings response:", response);
            const is_enabled = response.message ? response.message.project : false;
            callback(is_enabled);
        }
    });
}


frappe.ui.form.on("Project", {

    onload: function(frm) {
        if (frm.is_new()) {
            console.log("script loaded")
            frm.set_value('custom_automate', 0); // Set custom_automate to 0 for new forms
        }

        if (!frm.doc.custom_automate) {
            checkAutomationEnabled(frm, function(is_enabled) {
                if (is_enabled) {
                    applyTitleCorrections(frm);
                }
            });
        }
    },

    // Triggered when the termsfield is changed
    project_type: function(frm) {
        // Check if the dialog has been shown already
        if (!frm.dialog_shown) {
            frappe.confirm(
                'Do you want to create a new dictionary entry for project name?',
                function() {
                    // If user confirms, show the custom dialog box for adding a dictionary entry
                    const dialog = new frappe.ui.Dialog({
                        title: 'Edit or Add Dictionary Entry',
                        fields: [
                            {
                                fieldtype: 'Data',
                                fieldname: 'found_word',
                                label: 'Found Word',
                                reqd: 1,
                            },
                            {
                                fieldtype: 'Data',
                                fieldname: 'actual_word',
                                label: 'Actual Word',
                                reqd: 1,
                            }
                        ],
                        primary_action_label: 'Save',
                        primary_action(values) {
                            frappe.call({
                                method: 'frappe.client.insert',
                                args: {
                                    doc: {
                                        doctype: 'Dictionary',
                                        found_word: values.found_word,
                                        actual_word: values.actual_word,
                                    }
                                },
                                callback: function(response) {
                                    if (response.message) {
                                        frappe.msgprint('Dictionary entry saved successfully!');
                                        dialog.hide();
                                    }
                                }
                            });
                        }
                    });
                    dialog.show();

                    // Set flag to ensure the dialog is not shown again
                    frm.dialog_shown = true;
                },
                function() {
                    // If user declines, log or perform another action
                    console.log("User declined to add a dictionary entry.");
                }
            );
        }
    },

    // When the form is saved, apply the dictionary corrections to the title field
    save: function(frm) {
        if (!frm.doc.custom_automate) {
            checkAutomationEnabled(frm, function(is_enabled) {
                if (is_enabled) {
                    applyTitleCorrections(frm);

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

    project_name: function(frm) {
        if (!frm.doc.custom_automate) {
            checkAutomationEnabled(frm, function(is_enabled) {
                if (is_enabled) {
                    applyTitleCorrections(frm);
                }
            });
        }
    }
});

function applyTitleCorrections(frm) {
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
                    const field = "project_name";
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
            fieldname: 'project',
        },
        callback: function(response) {
            const is_enabled = response.message ? response.message.projetc: false;
            callback(is_enabled);
        }
    });
}


// add Dictionary button

frappe.ui.form.on('Project', {
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
