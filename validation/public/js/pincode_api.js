let taluk_changes = []; // Global array to store dictionary entries
let last_fetched_taluk = null; // Track the last fetched value
let taluk_timeout = null; // Timeout variable for debouncing

frappe.ui.form.on('Address', {
    pincode: function(frm) {
        console.log("Pincode entered:", frm.doc.pincode);

        if (frm.doc.pincode && frm.doc.pincode.length === 6) {
            console.log("Valid 6-digit pincode entered:", frm.doc.pincode);

            // Clear previous values before fetching new data
            frm.set_value('custom_post_office', null);
            frm.set_value('custom_taluk', null);
            frm.set_value('county', null);
            frm.set_value('state', null);

            const api_url = `https://api.postalpincode.in/pincode/${frm.doc.pincode}`;
            console.log("API URL:", api_url);

            fetch(api_url)
                .then(response => {
                    console.log("API Response received:", response);
                    return response.json();
                })
                .then(data => {
                    console.log("Parsed API Data:", data);

                    if (data && data[0].Status === "Success") {
                        const post_offices = data[0].PostOffice;
                        console.log("Post Offices Found:", post_offices);

                        if (post_offices.length > 1) {
                            let options = post_offices.map(po => po.Name);
                            console.log("Multiple post offices found. Options:", options);

                            let dialog = new frappe.ui.Dialog({
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
                                    console.log("Post Office selected from dialog:", values.post_office);

                                    let selected_po = post_offices.find(po => po.Name === values.post_office);
                                    console.log("Selected Post Office Details:", selected_po);

                                    frm.set_value('custom_post_office', selected_po.Name);
                                    frm.set_value('custom_taluk', selected_po.Block);
                                    frm.set_value('county', selected_po.District);
                                    frm.set_value('state', selected_po.State);

                                    // Set the fetched taluk to track it
                                    last_fetched_taluk = selected_po.Block;
                                    console.log("Last fetched taluk set to:", last_fetched_taluk);

                                    dialog.hide();
                                }
                            });

                            dialog.show();
                        } else if (post_offices.length === 1) {
                            console.log("Only one post office found. Setting details directly.");
                            let post_office = post_offices[0];
                            frm.set_value('custom_post_office', post_office.Name);
                            frm.set_value('custom_taluk', post_office.Block);
                            frm.set_value('county', post_office.District);
                            frm.set_value('state', post_office.State);

                            // Set the fetched taluk to track it
                            last_fetched_taluk = post_office.Block;
                            console.log("Last fetched taluk set to:", last_fetched_taluk);
                        }
                    } else {
                        console.log("No details found for the entered pincode");
                        frappe.msgprint(__('No details found for the entered pincode'));
                    }
                })
                .catch(error => {
                    console.error('Error fetching post office details:', error);
                    frappe.msgprint(__('Unable to fetch post office details. Please try again.'));
                });
        } else {
            console.log("Pincode is not yet 6 digits. Waiting for complete pincode.");
            // Clear fields if pincode is incomplete
            frm.set_value('custom_post_office', null);
            frm.set_value('custom_taluk', null);
            frm.set_value('county', null);
            frm.set_value('state', null);
        }
    },
    custom_taluk: function(frm) {
        // Clear any previous timeout
        if (taluk_timeout) {
            clearTimeout(taluk_timeout);
        }

        // Set a new timeout to delay execution
        taluk_timeout = setTimeout(() => {
            console.log("Custom Taluk field triggered after delay. Current Value:", frm.doc.custom_taluk);

            if (frm.doc.custom_taluk) {
                let found_word = last_fetched_taluk || null; // Use the tracked fetched value
                let actual_word = frm.doc.custom_taluk;
                let pincode = frm.doc.pincode || null;

                console.log("Found Word (Fetched Taluk):", found_word);
                console.log("Actual Word (Manual Entry):", actual_word);
                console.log("Pincode:", pincode);

                if (found_word && found_word !== actual_word) {
                    console.log("Detected a manual change in Taluk. Adding to Dictionary...");

                    // Add entry to Dictionary directly using frappe.db.insert
                    frappe.db.insert({
                        doctype: "Dictionary",
                        pincode: pincode,
                        found_word: found_word,
                        actual_word: actual_word,
                        doctype_name: frm.doc.doctype // Include the doctype name
                    }).then(doc => {
                        console.log("Entry added to Dictionary successfully:", doc);
                        // Update the local array for tracking changes
                        taluk_changes.push({
                            pincode: pincode,
                            found_word: found_word,
                            actual_word: actual_word,
                            doctype_name: frm.doc.doctype // Include the doctype name
                        });
                        console.log("Updated Taluk Changes Array:", taluk_changes);
                    }).catch(error => {
                        console.error("Failed to add entry to Dictionary:", error);
                    });
                } else if (!found_word) {
                    console.log("No fetched taluk exists to compare.");
                } else {
                    console.log("No changes detected. Found Word matches Actual Word.");
                }
            } else {
                console.log("Custom Taluk field is empty. Skipping.");
            }
        }, 2500);
    }
});
