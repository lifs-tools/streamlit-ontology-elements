# streamlit-ontology-elements

Streamlit component that wraps the ontology elements to query, edit and autocomplete ontology-based terms.

## Installation instructions 

```sh
pip install streamlit-ontology-elements
```

## Usage instructions

```python
import streamlit as st

from st_ontology_elements import st_ontology_elements

value = st_ontology_elements()

st.write(value)
