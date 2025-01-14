import frappe
import re

@frappe.whitelist()
def before_save(doc, method):
    try:
        automation_settings = frappe.get_value("Automation Settings", None, "customer")
        if not automation_settings or int(automation_settings) != 1:
            return  

        if doc.get("custom_automate") != 0:
            return  # Exit if custom automation is not disabled

        # Log that the function has started
        frappe.log_error("before_save function started ", "before_save Log")

        # Fetch dictionary entries for corrections
        corrections = {}
        dictionary_entries = frappe.get_all("Dictionary", fields=["found_word", "actual_word"])

        for entry in dictionary_entries:
            corrections[entry["found_word"]] = entry["actual_word"]

        # Fields to check and correct
        fields_to_check = ["supplier_name"]

        for field in fields_to_check:
            field_value = doc.get(field)
            if field_value:
                updated_value = field_value
                for incorrect, corrected in corrections.items():
                    updated_value = re.sub(r'\b' + re.escape(incorrect) + r'\b', corrected, updated_value)
                doc.set(field, updated_value)

        # Log the changes made
        frappe.log_error(f"Updated fields: {fields_to_check}", "before_save Log")

    except Exception as e:
        # Log any errors that occur during the process
        frappe.log_error(f"Error in before_save method: {str(e)}", "before_save Error")
