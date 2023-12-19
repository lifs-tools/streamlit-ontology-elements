// The `Streamlit` object exists because our html file includes
// `streamlit-component-lib.js`.
// If you get an error about "Streamlit" not being defined, that
// means you're missing that file.
// import * from "./ontology-elements/ontology-elements.js"

function sendValue(value) {
  Streamlit.setComponentValue(value)
}

/**
 * The component's render function. This will be called immediately after
 * the component is initially loaded, and then again every time the
 * component gets new data from Python.
 */
function onRender(event) {
  var display_rows = 7
  const {label, value, ontologies, collection, entity_type, allow_custom_terms, has_short_selected_label, field_list, rows} = event.detail.args;
  display_rows = Math.min(display_rows, Math.max(1, rows))
  // Only run the render code the first time the component is loaded.
  if (!window.rendered) {

    parameter_str_arr = []
    if(ontologies) {
      parameter_str_arr.push("ontology="+ontologies)
    }
    if(collection) {
      parameter_str_arr.push("collection="+collection)
    }
    if(entity_type) {
      parameter_str_arr.push("type="+entity_type)
    }
    if(field_list) {
      parameter_str_arr.push("field_list="+field_list)
    }
    if(rows) {
      parameter_str_arr.push("rows="+rows)
    }

    // Create the parameter string from the parameter array
    let parameter = parameter_str_arr.join("&");
    let input = document.getElementById('semlookp_autocomplete');
    window['SemLookPWidgets'].createAutocomplete(
      {
        api: "https://semanticlookup.zbmed.de/ols/api/",
        allowCustomTerms: allow_custom_terms,
        placeholder: "Type to search",
        parameter: parameter,
        hasShortSelectedLabel: has_short_selected_label,
        selectionChangedEvent: function (event) {
          sendValue(event);
        },
      }, input);

    // Set the default value to be what the user specified
    if (value) {
      input.value = value
    }

    // On the mouse click event, send the new value to Python
    input.onclick = event => sendValue({value: value, label: label})
    window.rendered = true
  }
  // Calculation of the height of the component, depending on the number of rows
  var frameHeight = 40+(display_rows*29)+10
  console.log("frameHeight="+frameHeight)
  Streamlit.setFrameHeight(frameHeight)
}

// Render the component whenever python send a "render event"
Streamlit.events.addEventListener(Streamlit.RENDER_EVENT, onRender)
// Tell Streamlit that the component is ready to receive events
Streamlit.setComponentReady()
// Render fixed height, based on autocomplete widget's height, autocompletion popup's height and margin
Streamlit.setFrameHeight(40+29+10)
