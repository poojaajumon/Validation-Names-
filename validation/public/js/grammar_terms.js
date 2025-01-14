frappe.ui.form.on('Terms and Conditions', {
    terms: function(frm) {
        
        frappe.call({
            method: 'frappe.client.get_value',
            args: { doctype : "Terms and Conditions",
                fieldname :"terms",
                filters:{name:frm.doc.name}
             },
            callback: function(response) {
                let text= response.message.terms;
                frappe.call({
                    method:"validation.events.grammar_terms.correct_grammar",
                    args: {text:text},
                    callback: function(r){
                        if (r.message){
                            frm.set_value('terms',r.message.corrected_text);
                        }
                    }
                });
            }
});
    }
});
