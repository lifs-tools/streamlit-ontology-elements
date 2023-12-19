from pathlib import Path
from typing import Optional

import streamlit as st
import streamlit.components.v1 as components

# Tell streamlit that there is a component called st_semlookp_widgets,
# and that the code to display that component is in the "frontend" folder
frontend_dir = (Path(__file__).parent / "frontend").absolute()
_component_func = components.declare_component(
	"semlookp_autocomplete", path=str(frontend_dir)
)

# Create the python function that will be called
def semlookp_autocomplete(
    value: Optional[str] = None,
    key: Optional[str] = None,
    ontologies: Optional[str] = None,
    collection: Optional[str] = None,
    entity_type: Optional[str] = None,
    allow_custom_terms: Optional[bool] = False,
    has_short_selected_label: Optional[bool] = True,
    field_list: Optional[str] = None,
    rows: Optional[int] = 10,
    default: Optional[str] = None,
):
    """
    Add a descriptive docstring
    """
    component_value = _component_func(
        value=value,
        key=key,
        ontologies=ontologies,
        collection=collection,
        entity_type=entity_type,
        allow_custom_terms=allow_custom_terms,
        has_short_selected_label=has_short_selected_label,
        field_list=field_list,
        rows=rows,
        default=default
    )

    return component_value
