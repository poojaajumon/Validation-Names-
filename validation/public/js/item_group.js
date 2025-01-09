frappe.ui.form.on('Item Group', {
    before_save: function (frm) {
        check_automation_enabled(frm, function (is_enabled) {
            if (is_enabled === 1) {  // Proceed only if automation is enabled
                console.log("Automation enabled. Proceeding with before_save logic.");
                if (frm.is_new() && !frm.doc.custom_automate) {
                    console.log("Before Save: Initializing custom_automate to 0 for new records.");
                    frm.set_value('custom_automate', 0); // Initialize custom_automate
                }

                if (!frm.doc.custom_automate) {
                    if (frm.doc.item_group_name) frm.set_value('item_group_name', format_name(frm.doc.item_group_name));
                } else {
                    console.log("custom_automate is enabled. Skipping field formatting.");
                }
            } else {
                console.log("Automation not enabled. Skipping before_save logic.");
            }
        });
    },

    after_save: function (frm) {
        check_automation_enabled(frm, function (is_enabled) {
            if (is_enabled === 1) {  // Proceed only if automation is enabled
                console.log("Automation enabled. Proceeding with after_save logic.");
                if (frm.doc.custom_automate === 0) {
                    console.log("After Save: Enabling custom_automate.");
                    frm.set_value('custom_automate', 1);
                    frm.save();
                }
            } else {
                console.log("Automation not enabled. Skipping after_save logic.");
            }
        });
    }
});



function check_automation_enabled(frm, callback) {
    frappe.call({
        method: 'frappe.client.get_value',
        args: {
            doctype: 'Automation Settings',
            fieldname: 'item_group',
        },
        callback: function(response) {
            console.log("Automation Settings Response:", response);
            const is_enabled = response.message && response.message.item_group ? parseInt(response.message.item_group, 10) : 0; // Ensure numeric value
            callback(is_enabled);
        },
    });
}

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
      
// create Dictionary button

frappe.ui.form.on('Item Group', {
    refresh: function (frm) {
       
        frm.add_custom_button(__('Dictionary'), function () {
            
            frappe.set_route('List', 'Dictionary');
        }, __('View'));
    }
});
