frappe.ui.form.on('Item Group', {
    onload: function(frm) {
        if (frm.is_new()) {
            console.log("Form is new. Initializing custom_automate.");
            frm.set_value('custom_automate', 0); // Disable custom_automate for new forms
        }
    },

    item_group_name: function(frm) {
        if (!frm.doc.custom_automate) {
            console.log("Item Group Name trigger activated and custom_automate is disabled");
            check_automation_enabled(frm, function(is_enabled) {
                console.log("Automation check result:", is_enabled);
                if (is_enabled) {
                    const formatted_name = format_name(frm.doc.item_group_name);
                    console.log("Formatted Name:", formatted_name);
                    frm.set_value('item_group_name', formatted_name);
                }
            });
        } else {
            console.log("custom_automate is enabled. Skipping Item Group Name trigger.");
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

    let formattedName = name.replace(/[\.-\/,0-9]/g, '');
    formattedName = formattedName.trim().toLowerCase().replace(/\b(\w)/g, function(match) {
        return match.toUpperCase();
    });
    formattedName = formattedName.replace(/\s+/g, ' ');
    formattedName = formattedName.replace(/\(/g, ' (');

    return formattedName;
}

function check_automation_enabled(frm, callback) {
    console.log("Checking automation enabled status");
    frappe.call({
        method: 'frappe.client.get_value',
        args: {
            doctype: 'Automation Settings',
            fieldname: 'item_group'
        },
        callback: function(response) {
            console.log("Automation Settings response:", response);
            const is_enabled = response.message ? response.message.item_group: false;
            callback(is_enabled);
        }
    });
}


// suggestions from Dictionary

frappe.ui.form.on("Item Group", {
   
    onload: function(frm) {
        if (frm.is_new()) {
            console.log("Script Loaded");
            frm.set_value('custom_automate', 0); // Set custom_automate to 0 for new forms
        }

        if (!frm.doc.custom_automate) {
            checkAutomationEnabled(frm, function(is_enabled) {
                if (is_enabled) {
                    applyItemGroupCorrections(frm);
                }
            });
        }
    },

    // Triggered when the parent_item_group field is changed
    parent_item_group: function(frm) {
        frappe.confirm(
            'Do you want to create a new dictionary entry for Item Group Name?',
            function() {
                // If user clicks 'Yes', show the custom dialog box for creating dictionary entry
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
                // If user clicks 'No', do nothing
                console.log("User declined to add a dictionary entry.");
            }
        );
    },

    // When the form is saved, apply the dictionary corrections to item_group_name field
    save: function(frm) {
        if (!frm.doc.custom_automate) {
            checkAutomationEnabled(frm, function(is_enabled) {
                if (is_enabled) {
                    applyItemGroupCorrections(frm);

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

    // If item_group_name is changed manually, reapply corrections
    item_group_name: function(frm) {
        if (!frm.doc.custom_automate) {
            checkAutomationEnabled(frm, function(is_enabled) {
                if (is_enabled) {
                    applyItemGroupCorrections(frm);
                }
            });
        }
    }
});

// Function to apply the corrections from the Dictionary to item_group_name
function applyItemGroupCorrections(frm) {
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
                    const field = "item_group_name";
                    if (frm.doc[field]) {
                        let updated_item_group = frm.doc[field];
                        for (const [incorrect, corrected] of Object.entries(corrections)) {
                            updated_item_group = updated_item_group.replace(incorrect, corrected);
                        }
                        frm.set_value(field, updated_item_group);
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
            fieldname: 'item_group',
        },
        callback: function(response) {
            const is_enabled = response.message ? response.message.item_group: false;
            callback(is_enabled);
        }
    });
}



// create Dictionary button

frappe.ui.form.on('Item Group', {
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
