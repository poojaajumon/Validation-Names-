frappe.ui.form.on('Address', {
    onload: function(frm) {
        if (frm.is_new()) {
            console.log("Form is new. Initializing custom_automate.");
            frm.set_value('custom_automate', 0); // Disable custom_automate for new forms
        }

        check_automation_enabled(frm, function(is_enabled) {
            console.log("Script loaded, Automation enabled:", is_enabled);
        });
    },

    address_line1: function(frm) {
        if (!frm.doc.custom_automate) {
            check_automation_enabled(frm, function(is_enabled) {
                if (is_enabled) {
                    frm.set_value('address_line1', format_name(frm.doc.address_line1));
                }
            });
        } else {
            console.log("custom_automate is enabled. Skipping address_line1 trigger.");
        }
    },

    city: function(frm) {
        if (!frm.doc.custom_automate) {
            check_automation_enabled(frm, function(is_enabled) {
                if (is_enabled) {
                    frm.set_value('city', format_name(frm.doc.city));
                }
            });
        } else {
            console.log("custom_automate is enabled. Skipping city trigger.");
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

    // Remove all special characters except spaces, letters, numbers, hyphens, and slashes
    let formattedName = name.replace(/[^a-zA-Z0-9\s\-\/]/g, ''); 
    formattedName = formattedName.trim()
        .toLowerCase()
        .replace(/\b(\w)/g, function(match) {
            return match.toUpperCase(); // Capitalize the first letter of each word
        });
    formattedName = formattedName.replace(/\s+/g, ' '); // Replace multiple spaces with a single space
    formattedName = formattedName.replace(/\(/g, ' ('); // Ensure space before parentheses if needed

    return formattedName;
}

function check_automation_enabled(frm, callback) {
    frappe.call({
        method: 'frappe.client.get_value',
        args: {
            doctype: 'Automation Settings',
            fieldname: 'enable_address_automation'
        },
        callback: function(response) {
            const is_enabled = response.message ? response.message.enable_address_automation : false;
            callback(is_enabled);
        }
    });
}


// suggesstions from Dictionary

frappe.ui.form.on("Address", {
    
    onload: function(frm) {
        if (frm.is_new()) {
            console.log("Script Loaded")
            frm.set_value('custom_automate', 0); // Set custom_automate to 0 for new forms
        }

        if (!frm.doc.custom_automate) {
            checkAutomationEnabled(frm, function(is_enabled) {
                if (is_enabled) {
                    console.log("Automation Enabled")
                    applyAddressCorrections(frm);
                }
            });
        }
    },

    tax_category: function(frm) {
        frappe.confirm(
            'Do you want to create a new dictionary entry for Address Line 1?',
            function() {
                // Redirect to Dictionary doctype if user clicks 'Yes'
                frappe.set_route('Form', 'Dictionary', 'new');
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
                    applyAddressCorrections(frm);

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

    address_line1: function(frm) {
        if (!frm.doc.custom_automate) {
            checkAutomationEnabled(frm, function(is_enabled) {
                if (is_enabled) {
                    applyAddressCorrections(frm);
                }
            });
        }
    }
});

// Function to apply the corrections from the Dictionary to supplier_name
function applyAddressCorrections(frm) {
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
                    const field = "address_line1";
                    if (frm.doc[field]) {
                        let updated_address = frm.doc[field];
                        for (const [incorrect, corrected] of Object.entries(corrections)) {
                            updated_address = updated_address.replace(incorrect, corrected);
                        }
                        frm.set_value(field, updated_address);
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
            fieldname: 'enable_address_automation',
        },
        callback: function(response) {
            const is_enabled = response.message ? response.message.enable_address_automation : false;
            callback(is_enabled);
        }
    });
}

