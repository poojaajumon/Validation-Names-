
frappe.ui.form.on('Employee', {
    before_save: function(frm) {
        if (!frm.doc.current_address) {
            frappe.msgprint({
                title: 'Missing Current Address',
                message: 'Please fill the current address.',
                primary_action: {
                    label: 'OK',
                    action: function() {
                        frappe.hide_msgprint();

                        if (frm.dialog_open) return;
                        frm.dialog_open = true;

                        let dialog = new frappe.ui.Dialog({
                            title: 'Enter Current Address Details',
                            fields: [
                                {
                                    label: 'Country',
                                    fieldname: 'country',
                                    fieldtype: 'Data',
                                    onchange: function() {
                                        let country = dialog.get_value('country');
                                        if (country.toLowerCase() === 'india') {
                                            dialog.set_df_property('pincode', 'reqd', 1);
                                        } else {
                                            dialog.set_df_property('pincode', 'reqd', 0);
                                        }
                                    }
                                },
                                  
                                {
                                    label: 'Pincode',
                                    fieldname: 'pincode',
                                    fieldtype: 'Data',
                                    onchange: function() {
                                        let pincode = dialog.get_value('pincode');

                                        if (pincode.length === 6) {
                                            if (frm.fetch_in_progress) return;
                                            frm.fetch_in_progress = true;

                                            const api_url = `https://api.postalpincode.in/pincode/${pincode}`;

                                            fetch(api_url)
                                                .then(response => response.json())
                                                .then(data => {
                                                    frm.fetch_in_progress = false;
                                                    if (data && data[0].Status === "Success") {
                                                        const post_offices = data[0].PostOffice;

                                                        if (post_offices.length > 1) {
                                                            let options = post_offices.map(po => po.Name);

                                                            if (frm.post_office_dialog) {
                                                                frm.post_office_dialog.show();
                                                            } else {
                                                                frm.post_office_dialog = new frappe.ui.Dialog({
                                                                    title: __('Select Post Office'),
                                                                    fields: [
                                                                        {
                                                                            label: __('Post Office'),
                                                                            fieldname: 'post_office',
                                                                            fieldtype: 'Select',
                                                                            options: options
                                                                        }
                                                                    ],
                                                                    primary_action_label: __('Select'),
                                                                    primary_action(values) {
                                                                        let selected_po = post_offices.find(po => po.Name === values.post_office);
                                                                        dialog.set_value('post_office', selected_po.Name);
                                                                        dialog.set_value('taluk', selected_po.Block);
                                                                        dialog.set_value('district', selected_po.District);
                                                                        dialog.set_value('state', selected_po.State);

                                                                        frm.post_office_dialog.hide();
                                                                        frm.post_office_dialog = null;
                                                                    }
                                                                });

                                                                frm.post_office_dialog.show();
                                                            }
                                                        } else if (post_offices.length === 1) {
                                                            let post_office = post_offices[0];
                                                            dialog.set_value('post_office', post_office.Name);
                                                            dialog.set_value('taluk', post_office.Block);
                                                            dialog.set_value('district', post_office.District);
                                                            dialog.set_value('state', post_office.State);
                                                        }
                                                    } else {
                                                        frappe.msgprint(__('No details found for the entered pincode'));
                                                    }
                                                })
                                                .catch(error => {
                                                    frm.fetch_in_progress = false;
                                                    console.error('Error fetching post office details:', error);
                                                    frappe.msgprint(__('Unable to fetch post office details. Please try again.'));
                                                });
                                        }
                                    },  
        

                                },
                                {
                                    label: 'Door No, Building/House Name, Street, Lane',
                                    fieldname: 'location',
                                    fieldtype: 'Data'
                                },
                                {
                                    label: 'City',
                                    fieldname: 'city',
                                    fieldtype: 'Data'
                                },
                              
                                {
                                    label: 'Post Office',
                                    fieldname: 'post_office',
                                    fieldtype: 'Data',
                                    read_only: 1,
                                    hidden: 1
                                },
                                {
                                    label: 'Taluk',
                                    fieldname: 'taluk',
                                    fieldtype: 'Data',
                                    read_only: 1,
                                    hidden: 1
                                },
                                {
                                    label: 'District',
                                    fieldname: 'district',
                                    fieldtype: 'Data',
                                    read_only: 1,
                                    hidden: 1
                                },
                                {
                                    label: 'State',
                                    fieldname: 'state',
                                    fieldtype: 'Data',
                                    read_only: 1,
                                    hidden: 1
                                }
                            ],
                            primary_action_label: 'Submit',
                            primary_action: function(data) {
                                if (!data.country || (data.country.toLowerCase() === 'india' && !data.pincode)) {
                                    frappe.msgprint('Pincode is required if Country is India.');
                                    return;
                                }

                                let current_address = format_address(data);
                                frm.set_value('current_address', current_address);
                                dialog.hide();
                                
                                let accommodation_dialog = new frappe.ui.Dialog({
                                    title: 'Is the Current Address: (Rented/Owned)?',
                                    fields: [
                                        {
                                            label: 'Select Accommodation Type',
                                            fieldname: 'accommodation_type',
                                            fieldtype: 'Select',
                                            options: [
                                                { value: '', label: 'Select' },
                                                { value: 'Rented', label: 'Rented' },
                                                { value: 'Owned', label: 'Owned' }
                                            ],
                                            reqd: 1
                                        }
                                    ],
                                    primary_action_label: 'Submit',
                                    primary_action: function(data) {
                                        if (!data.accommodation_type) {
                                            frappe.msgprint('Please select if the current address is Rented or Owned.');
                                            return;
                                        }

                                        frm.set_value('current_accommodation_type', data.accommodation_type);
                                        accommodation_dialog.hide();

                                frappe.confirm(
                                    'Is this your Permanent Address?',
                                    function() {
                                        frm.set_value('permanent_address', current_address);
                                        frm.save();
                                    },
                                    function() {
                                        let perm_dialog = new frappe.ui.Dialog({
                                            title: 'Enter Permanent Address Details',
                                            fields: [
                                                {
                                                    label: 'Country',
                                                    fieldname: 'perm_country',
                                                    fieldtype: 'Data',
                                                    onchange: function() {
                                                        let country = perm_dialog.get_value('perm_country');
                                                        if (country.toLowerCase() === 'india') {
                                                            perm_dialog.set_df_property('perm_pincode', 'reqd', 1);
                                                        } else {
                                                            perm_dialog.set_df_property('perm_pincode', 'reqd', 0);
                                                        }
                                                    }
                                                },
                                                
                                                {
                                                    label: 'Pincode',
                                                    fieldname: 'perm_pincode',
                                                    fieldtype: 'Data',
                                                    onchange: function() {
                                                      let pincode = perm_dialog.get_value('perm_pincode');
        
                                                             // Check if the pincode is exactly 6 digits
                                                            if (pincode.length === 6) {
                                                                        if (frm.fetch_in_progress) return;
                                                                     frm.fetch_in_progress = true;

                                                        const api_url = `https://api.postalpincode.in/pincode/${pincode}`;

                                                         fetch(api_url)
                                                              .then(response => response.json())
                                                                      .then(data => {
                                                                            frm.fetch_in_progress = false;
                                                                if (data && data[0].Status === "Success") {
                                                          const post_offices = data[0].PostOffice;

                        if (post_offices.length > 1) {
                            let options = post_offices.map(po => po.Name);

                            if (frm.perm_post_office_dialog) {
                                frm.perm_post_office_dialog.show();
                            } else {
                                frm.perm_post_office_dialog = new frappe.ui.Dialog({
                                    title: __('Select Post Office'),
                                    fields: [
                                        {
                                            label: __('Post Office'),
                                            fieldname: 'post_office',
                                            fieldtype: 'Select',
                                            options: options
                                        }
                                    ],
                                    primary_action_label: __('Select'),
                                    primary_action(values) {
                                        let selected_po = post_offices.find(po => po.Name === values.post_office);
                                        perm_dialog.set_value('perm_post_office', selected_po.Name);
                                        perm_dialog.set_value('perm_taluk', selected_po.Block);
                                        perm_dialog.set_value('perm_district', selected_po.District);
                                        perm_dialog.set_value('perm_state', selected_po.State);

                                        frm.perm_post_office_dialog.hide();
                                        frm.perm_post_office_dialog = null;
                                    }
                                });

                                frm.perm_post_office_dialog.show();
                            }
                        } else if (post_offices.length === 1) {
                            let post_office = post_offices[0];
                            perm_dialog.set_value('perm_post_office', post_office.Name);
                            perm_dialog.set_value('perm_taluk', post_office.Block);
                            perm_dialog.set_value('perm_district', post_office.District);
                            perm_dialog.set_value('perm_state', post_office.State);
                                                 }
                                                 } else {
                                              frappe.msgprint(__('No details found for the entered pincode'));
                                                      }
                                                  })
                                          .catch(error => {
                                            frm.fetch_in_progress = false;
                                              console.error('Error fetching post office details:', error);
                                                  frappe.msgprint(__('Unable to fetch post office details. Please try again.'));
                                                     });
                                              
                                                      }
                                                    }, 
                                                },
                                                {
                                                     label: 'Door No, Building/House Name, Street, Lane',
                                                     fieldname: 'perm_location',
                                                     fieldtype: 'Data'
                                                  },
                                                  {
                                                     label: 'City',
                                                     fieldname: 'perm_city',
                                                     fieldtype: 'Data'
                                                  },
                                                
                                                
                                                {
                                                    label: 'Post Office',
                                                    fieldname: 'perm_post_office',
                                                    fieldtype: 'Data',
                                                    read_only: 1,
                                                    hidden: 1
                                                },
                                                {
                                                    label: 'Taluk',
                                                    fieldname: 'perm_taluk',
                                                    fieldtype: 'Data',
                                                    read_only: 1,
                                                    hidden: 1
                                                },
                                                {
                                                    label: 'District',
                                                    fieldname: 'perm_district',
                                                    fieldtype: 'Data',
                                                    read_only: 1,
                                                    hidden: 1
                                                },
                                                {
                                                    label: 'State',
                                                    fieldname: 'perm_state',
                                                    fieldtype: 'Data',
                                                    read_only: 1,
                                                    hidden: 1
                                                }
                                            ],
                                            primary_action_label: 'Submit',
                                            primary_action: function(data) {
                                                if (!data.perm_country || (data.perm_country.toLowerCase() === 'india' && !data.perm_pincode)) {
                                                    frappe.msgprint('Pincode is required if Country is India.');
                                                    return;
                                                }

                                                let permanent_address = format_address(data, 'perm_');
                                                frm.set_value('permanent_address', permanent_address);
                                                perm_dialog.hide();
                                                
                                                let perm_accommodation_dialog = new frappe.ui.Dialog({
                                                    title: 'Is the Permanent Address: (Rented/Owned)?',
                                                    fields: [
                                                        {
                                                            label: 'Select Accommodation Type',
                                                            fieldname: 'accommodation_type',
                                                            fieldtype: 'Select',
                                                            options: [
                                                                { value: '', label: 'Select' },
                                                                { value: 'Rented', label: 'Rented' },
                                                                { value: 'Owned', label: 'Owned' }
                                                            ],
                                                            reqd: 1
                                                        }
                                                    ],
                                                    primary_action_label: 'Submit',
                                                    primary_action: function(data) {
                                                        if (!data.accommodation_type) {
                                                            frappe.msgprint('Please select if the permanent address is Rented or Owned.');
                                                            return;
                                                        }

                                                        frm.set_value('permanent_accommodation_type', data.accommodation_type);
                                                        perm_accommodation_dialog.hide();
                                                        
                                                frm.save();
                                                    }
                                                });

                                                perm_accommodation_dialog.show();
                                            }
                                        });

                                        perm_dialog.show();
                                    }
                                );
                            }
                        });
                        accommodation_dialog.show();
                            }
                        });

                        dialog.show();
                    }
                }
            });
            frappe.validated = false;  
        }
    }
});

function format_address(data, prefix = '') {
    let post_office = data[prefix + 'post_office'] || '';
    let city = data[prefix + 'city'] || '';
    let district = data[prefix + 'district'] || '';
    let location = data[prefix + 'location'] || '';
    let state = data[prefix + 'state'] || '';
    let country = data[prefix + 'country'] || '';
    let pincode = data[prefix + 'pincode'] || '';

    // Function to capitalize the first letter of each word
    function capitalize(str) {
        return str
            .toLowerCase()
            .replace(/\b\w/g, char => char.toUpperCase());
    }
     // Capitalize all relevant fields
    location = capitalize(location);
    city = capitalize(city);
    country = capitalize(country);

    // Function to add a space before a bracket if present
    function format_post_office(post_office) {
        return post_office.replace(/(\S)\(/g, '$1 (');
    }

    // Format post office name
    post_office = format_post_office(post_office);
    
    // Check if city and district are the same
    if (city.toLowerCase() === district.toLowerCase()) {
        return `${location}, ${city}, ${state}, ${country} - ${pincode}`;
    }

    // Check if post_office, city, and district are the same
    if (post_office.toLowerCase() === city.toLowerCase() && post_office.toLowerCase() === district.toLowerCase()) {
        // Display city only if all three are the same
        return `${location}, ${city}, ${state}, ${country} - ${pincode}`;
    }
      // Extract the name inside the brackets from the post office
    let post_office_name_in_bracket = post_office.match(/\(([^)]+)\)/);
    post_office_name_in_bracket = post_office_name_in_bracket ? post_office_name_in_bracket[1].toLowerCase() : '';

    // Check if post_office and city are the same, but district is different
    if (post_office.toLowerCase() === city.toLowerCase()) {
        return `${location}, ${city}, ${district}, ${state}, ${country} - ${pincode}`;
    }

    // Check if post_office and district are the same
    if (post_office.toLowerCase() === district.toLowerCase()) {
        return `${location}, ${post_office}, ${state}, ${country} - ${pincode}`;
    }
    if (post_office_name_in_bracket === district.toLowerCase()) {
        return `${location}, ${post_office}, ${city}, ${state}, ${country} - ${pincode}`;
    }

    // Default case where post_office, city, and district are different
    return `${location}, ${post_office}, ${city}, ${district}, ${state}, ${country} - ${pincode}`;
}



