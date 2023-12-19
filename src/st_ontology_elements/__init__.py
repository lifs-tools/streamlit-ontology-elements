from pathlib import Path
from typing import Optional

import streamlit as st
import streamlit.components.v1 as components

# Tell streamlit that there is a component called streamlit_ontology_elements,
# and that the code to display that component is in the "frontend" folder
frontend_dir = (Path(__file__).parent / "frontend").absolute()
_component_func = components.declare_component(
	"st_ontology_elements", path=str(frontend_dir)
)

# Create the python function that will be called
def st_ontology_elements(
    label: str,
    value: Optional[str] = "",
    key: Optional[str] = None,
    ontologies: Optional[str] = None,
    default: Optional[str] = None,
):
    """
    Add a descriptive docstring
    """
    component_value = _component_func(
        label=label,
        value=value,
        key=key,
        ontologies=ontologies,
        default=default
    )

    return component_value

def main():
    st.write("## Streamlit Ontology Elements Autocomplete Demo (efo, ms, chebi)")
    value = st_ontology_elements(
        "ontology elements", 
        None,
        "ENTER",
        "efo,ms,chebi",
        None
    )

    st.write(value)

if __name__ == "__main__":
    main()
