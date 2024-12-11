frappe.ui.form.on('Supplier', {
    onload: function(frm) {
        if (frm.is_new()) {
            console.log("Form is new. Initializing custom_automate.");
            frm.set_value('custom_automate', 0); // Disable custom_automate for new forms
        }
    },

    supplier_name: function(frm) {
        if (!frm.doc.custom_automate) {
            console.log("Supplier Name trigger activated and custom_automate is disabled");
            check_automation_enabled(frm, function(is_enabled) {
                console.log("Automation check result:", is_enabled);
                if (is_enabled) {
                    const formatted_name = format_name(frm.doc.supplier_name);
                    console.log("Formatted Name:", formatted_name);
                    frm.set_value('supplier_name', formatted_name);
                }
            });
        } else {
            console.log("custom_automate is enabled. Skipping Supplier Name trigger.");
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

    // Remove all characters except letters, spaces, and hyphens
    let formattedName = name.replace(/[^a-zA-Z\s\-]/g, ''); // Keep letters, spaces, and hyphens

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
            fieldname: 'enable_supplier_automation'
        },
        callback: function(response) {
            console.log("Automation Settings response:", response);
            const is_enabled = response.message ? response.message.enable_supplier_automation : false;
            callback(is_enabled);
        }
    });
}


// suggestions from Dictionary to supplier_name

frappe.ui.form.on("Supplier", {

    onload: function(frm) {
        if (frm.is_new()) {
            console.log("script loaded")
            frm.set_value('custom_automate', 0); // Set custom_automate to 0 for new forms
        }

        if (!frm.doc.custom_automate) {
            checkAutomationEnabled(frm, function(is_enabled) {
                if (is_enabled) {
                    applySupplierNameCorrections(frm);
                }
            });
        }
    },

    // Triggered when the supplier_group field is changed
    supplier_group: function(frm) {
        frappe.confirm(
            'Do you want to create a new dictionary entry for supplier name?',
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
            },
            function() {
                // If user declines, log or perform another action
                console.log("User declined to add a dictionary entry.");
            }
        );
    },

    // When the form is saved, apply the dictionary corrections to the supplier_name field
    save: function(frm) {
        if (!frm.doc.custom_automate) {
            checkAutomationEnabled(frm, function(is_enabled) {
                if (is_enabled) {
                    applySupplierNameCorrections(frm);

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

    // If supplier_name is changed manually, reapply corrections
    supplier_name: function(frm) {
        if (!frm.doc.custom_automate) {
            checkAutomationEnabled(frm, function(is_enabled) {
                if (is_enabled) {
                    applySupplierNameCorrections(frm);
                }
            });
        }
    }
});

// Function to apply the corrections from the Dictionary to supplier_name
function applySupplierNameCorrections(frm) {
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
                    const field = "supplier_name";
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
            fieldname: 'enable_supplier_automation',
        },
        callback: function(response) {
            const is_enabled = response.message ? response.message.enable_supplier_automation : false;
            callback(is_enabled);
        }
    });
}
