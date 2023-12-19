# streamlit-ontology-elements

Streamlit component that wraps the ontology elements to query, edit and autocomplete ontology-based terms.

## Installation instructions 

```sh
pip install streamlit-ontology-elements
```

## Usage instructions

```python
import streamlit as st

from semlookp_autocomplete import semlookp_autocomplete

value = semlookp_autocomplete()

st.write(value)
