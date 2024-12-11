frappe.ui.form.on('Employee', {
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
                    update_employee_name(frm);
                }
            });
        } else {
            console.log("custom_automate is enabled. Skipping First Name trigger.");
        }
    },

    middle_name: function(frm) {
        if (!frm.doc.custom_automate) {
            console.log("Middle Name trigger executed");
            check_automation_enabled(frm, function(is_enabled) {
                if (is_enabled) {
                    frm.set_value('middle_name', format_name(frm.doc.middle_name));
                    update_employee_name(frm);
                }
            });
        } else {
            console.log("custom_automate is enabled. Skipping Middle Name trigger.");
        }
    },

    last_name: function(frm) {
        if (!frm.doc.custom_automate) {
            console.log("Last Name trigger executed");
            check_automation_enabled(frm, function(is_enabled) {
                if (is_enabled) {
                    frm.set_value('last_name', format_name(frm.doc.last_name));
                    update_employee_name(frm);
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
    formattedName = formattedName.replace(/\s+/g, ' '); // Remove extra spaces
    formattedName = formattedName.replace(/\(/g, ' ('); // Optional specific formatting

    return formattedName;
}


function update_employee_name(frm) {
    let employee_name = [frm.doc.first_name, frm.doc.middle_name, frm.doc.last_name]
        .filter(name => name) // Remove undefined or null values
        .join(' ');
    frm.set_value('employee_name', employee_name);
}

function check_automation_enabled(frm, callback) {
    frappe.call({
        method: 'frappe.client.get_value',
        args: {
            doctype: 'Automation Settings',
            fieldname: 'enable_employee_automation'
        },
        callback: function(response) {
            const is_enabled = response.message ? response.message.enable_employee_automation : false;
            callback(is_enabled);
        }
    });
}


// suggestions from Dictionary

frappe.ui.form.on("Employee", {
   
    onload: function(frm) {
        if (frm.is_new()) {
            console.log("Script Loaded")
            frm.set_value('custom_automate', 0); // Set custom_automate to 0 for new forms
        }

        if (!frm.doc.custom_automate) {
            checkAutomationEnabled(frm, function(is_enabled) {
                if (is_enabled) {
                    applyEmployeeNameCorrections(frm);
                }
            });
        }
    },

    // Triggered when the gender field is changed
    gender: function(frm) {
        frappe.confirm(
            'Do you want to create a new dictionary entry for Employee first name?',
            function() {
                // If user confirms, show the custom dialog box
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
            },
            function() {
                // If user declines, log or perform another action
                console.log("User declined to add a dictionary entry.");
            }
        );
    },

    // When the form is saved, apply the dictionary corrections to the customer_name field
    save: function(frm) {
        if (!frm.doc.custom_automate) {
            checkAutomationEnabled(frm, function(is_enabled) {
                if (is_enabled) {
                    applyEmployeeNameCorrections(frm);

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

    // If first_name is changed manually, reapply corrections
    first_name: function(frm) {
        if (!frm.doc.custom_automate) {
            checkAutomationEnabled(frm, function(is_enabled) {
                if (is_enabled) {
                    applyEmployeeNameCorrections(frm);
                }
            });
        }
    }
});

// Function to apply the corrections from the Dictionary to first_name
function applyEmployeeNameCorrections(frm) {
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
            doctype: 'Automation Settings', // Replace with the correct doctype name for your settings
            fieldname: 'enable_employee_automation',
        },
        callback: function(response) {
            const is_enabled = response.message ? response.message.enable_employee_automation : false;
            callback(is_enabled);
        }
    });
}


