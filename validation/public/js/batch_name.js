frappe.ui.form.on('Batch', {
  
    batch_id: function(frm) {
        if (frm.doc.batch_id) {
            
           
            let corrected_batch_id = frm.doc.batch_id
                .toUpperCase()  
                .replace(/[^A-Z0-9\-\/]/g, '') 
                .slice(0, 16); 
            
            frm.set_value('batch_id', corrected_batch_id);
            console.log("batch_id:",corrected_batch_id)
        }
    }
});
