frappe.ui.form.on('Item', {
    onload: function(frm) {
        if (frm.is_new()) {
            console.log("Form is new. Initializing custom_automate.");
            frm.set_value('custom_automate', 0); // Disable custom_automate for new forms
        }
    },

    item_code: function(frm) {
        handleFieldAutomation(frm, 'item_code');
    },

    item_name: function(frm) {
        handleFieldAutomation(frm, 'item_name');
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

// Function to handle automation on item_code and item_name
function handleFieldAutomation(frm, field_name) {
    if (!frm.doc.custom_automate) {
        console.log(`${field_name} trigger activated and custom_automate is disabled`);
        check_automation_enabled(frm, function(is_enabled) {
            console.log("Automation check result:", is_enabled);
            if (is_enabled) {
                const formatted_name = format_name(frm.doc[field_name]);
                console.log("Formatted Name:", formatted_name);
                frm.set_value(field_name, formatted_name);
            }
        });
    } else {
        console.log("custom_automate is enabled. Skipping automation.");
    }
}

// Function to format name
function format_name(name) {
    if (!name) return '';

    console.log("Formatting name:", name);

    let formattedName = name.replace(/[\.-\/,0-9]/g, '');
    formattedName = formattedName.trim().toLowerCase().replace(/\b(\w)/g, function(match) {
        return match.toUpperCase();
    });
    formattedName = formattedName.replace(/\s+/g, ' ');
    formattedName = formattedName.replace(/\(/g, ' (');

    return formattedName;
}

// Function to check if automation is enabled
function check_automation_enabled(frm, callback) {
    console.log("Checking automation enabled status");
    frappe.call({
        method: 'frappe.client.get_value',
        args: {
            doctype: 'Automation Settings',
            fieldname: 'enable_item_automation'
        },
        callback: function(response) {
            console.log("Automation Settings response:", response);
            const is_enabled = response.message ? response.message.enable_item_automation : false;
            callback(is_enabled);
        }
    });
}


//suggestions from Dictionary

frappe.ui.form.on("Item", {
    // Onload: Apply customer_name corrections from Dictionary when the form loads
    onload: function(frm) {
        if (frm.is_new()) {
            console.log("Script Loaded")
            frm.set_value('custom_automate', 0); // Set custom_automate to 0 for new forms
        }

        if (!frm.doc.custom_automate) {
            checkAutomationEnabled(frm, function(is_enabled) {
                if (is_enabled) {
                    applyItemCodeCorrections(frm);
                }
            });
        }
    },

   
    item_group: function(frm) {
        frappe.confirm(
            'Do you want to create a new dictionary entry for Item code?',
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
                    applyItemCodeCorrections(frm);

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
    item_code: function(frm) {
        if (!frm.doc.custom_automate) {
            checkAutomationEnabled(frm, function(is_enabled) {
                if (is_enabled) {
                    applyItemCodeCorrections(frm);
                }
            });
        }
    }
});

// Function to apply the corrections from the Dictionary to customer_name
function applyItemCodeCorrections(frm) {
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
                    const field = "item_code";
                    if (frm.doc[field]) {
                        let updated_item_code = frm.doc[field];
                        for (const [incorrect, corrected] of Object.entries(corrections)) {
                            updated_item_code = updated_item_code.replace(incorrect, corrected);
                        }
                        frm.set_value(field, updated_item_code);
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
            fieldname: 'enable_item_automation',
        },
        callback: function(response) {
            const is_enabled = response.message ? response.message.enable_item_automation : false;
            callback(is_enabled);
        }
    });
}

