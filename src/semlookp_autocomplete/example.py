import streamlit as st

from semlookp_autocomplete import semlookp_autocomplete

def main():
    st.write("## Streamlit SemlookP Widgets Autocomplete Demo (efo, ms, chebi)")
    value = semlookp_autocomplete(
        "ontology elements", 
        None,
        "ENTER",
        "efo,ms,chebi,ncit",
        None,
        "class",
        True,
        True,
        "iri,label,short_form,obo_id,ontology_name,ontology_prefix,description,type",
        7,
        None
    )
    st.write(value)

if __name__ == "__main__":
    main()
