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

    // Remove all special characters except spaces
    let formattedName = name.replace(/[^a-zA-Z\s]/g, ''); // Keep only letters and spaces
    formattedName = formattedName.trim().toLowerCase().replace(/\b(\w)/g, function(match) {
        return match.toUpperCase();
    });
    formattedName = formattedName.replace(/\s+/g, ' ');
    formattedName = formattedName.replace(/\(/g, ' (');

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
