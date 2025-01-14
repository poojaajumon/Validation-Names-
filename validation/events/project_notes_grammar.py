import frappe
import language_tool_python

def correct_grammar(doc, method):
    if doc.notes:
        try:
            # Initialize the language tool
            tool = language_tool_python.LanguageTool('en-US')
            
            # Check grammar and generate corrections
            matches = tool.check(doc.notes)
            corrected_text = language_tool_python.utils.correct(doc.notes, matches)
            
            # # Debug messages
            # frappe.msgprint(f"Original: {doc.notes}")
            # frappe.msgprint(f"Corrected: {corrected_text}")
            
            # Apply corrections if there are changes
            if corrected_text != doc.notes:
                doc.notes = corrected_text
                # frappe.msgprint("Grammar corrected successfully.")
        except Exception as e:
            # Handle and display any errors
            frappe.msgprint(f"An error occurred: {str(e)}")
