import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { EuiLoadingSpinner, EuiText, EuiFlexItem, EuiLink, EuiBadge, EuiIconTip, EuiPanel, EuiFlexGroup, EuiTreeView, EuiTabbedContent, euiPaletteColorBlind, euiPaletteColorBlindBehindText, EuiComboBox, EuiHealth, EuiHighlight, EuiButton, EuiCard, EuiButtonIcon, EuiBasicTable, EuiSuggest, EuiTitle, EuiSpacer, EuiFormRow, EuiSelectable, EuiButtonEmpty, EuiSwitch, EuiHorizontalRule, EuiTablePagination } from '@elastic/eui';
import axios from 'axios';
import { css } from '@emotion/react';

const DEFAULT_SEARCH_RESULTS_PER_PAGE = 10;
class OlsApi {
    axiosInstance;
    constructor(api) {
        this.axiosInstance = axios.create({
            baseURL: api,
            headers: {
                Accept: "application/json",
                Content_Type: "application/json",
            },
        });
    }
    buildParamsForGet(paginationParams, sortingParams, contentParams, parameter) {
        if (sortingParams) {
            return { ...paginationParams, sort: `${sortingParams.sortField},${sortingParams.sortDir}`, ...contentParams, ...this.buildOtherParams(parameter) };
        }
        return { ...paginationParams, ...contentParams, ...this.buildOtherParams(parameter) };
    }
    buildPaginationParams(paginationParams) {
        const params = {
            rows: paginationParams?.size,
        };
        if (paginationParams?.page) {
            if (paginationParams.size) {
                params.start = (+paginationParams.page * +paginationParams.size).toString();
            }
            else {
                params.start = (+paginationParams.page * DEFAULT_SEARCH_RESULTS_PER_PAGE).toString();
            }
        }
        return params;
    }
    buildParamsForSearch(queryParams, paginationParams, contentParams, parameter) {
        const params = {
            q: queryParams.query,
            exact: queryParams.exactMatch,
            obsoletes: queryParams.showObsoleteTerms,
        };
        if (queryParams.groupByIri) {
            params.groupField = queryParams.groupByIri;
        }
        if (queryParams.types) {
            params.type = queryParams.types;
        }
        if (queryParams.ontology) {
            params.ontology = queryParams.ontology;
        }
        return { ...params, ...this.buildPaginationParams(paginationParams), ...contentParams, ...this.buildOtherParams(parameter) };
    }
    /**
     * Function for creating an object from string of parameters for axios input params
     * @param parameter
     * @private
     */
    buildOtherParams(parameter) {
        const result = {};
        if (parameter) {
            const paramsSplitted = parameter.split("&");
            paramsSplitted.forEach((param) => {
                const key = param.split("=")[0];
                const value = param.split("=")[1];
                result[key] = value;
            });
        }
        return result;
    }
    buildParamsForSelect(queryParams, paginationParams, contentParams, parameters) {
        const params = {
            q: queryParams.query,
        };
        return { ...params, ...this.buildPaginationParams(paginationParams), ...contentParams, ...this.buildOtherParams(parameters) };
    }
    buildParamsForSuggest(queryParams, paginationParams, contentParams, parameters) {
        const params = {
            q: queryParams.query,
        };
        return { ...params, ...this.buildPaginationParams(paginationParams), ...contentParams, ...this.buildOtherParams(parameters) };
    }
    check_for_errors(response) {
        // resource not found/illegal argument exception in semanticlookup
        if (response["error"]) {
            throw Error(response["status"] + " " + response["error"] + " - " + response["message"] + " - " + response["exception"] + " at " + response["path"]);
        }
        // empty response - can be caught if this is expected, e.g. for fetching instances
        if (response["page"] !== undefined && response["page"]["totalElements"] === 0) {
            throw Error("Response contains 0 elements");
        }
        return response;
    }
    getOntologies = async (paginationParams, sortingParams, contentParams, parameter) => {
        const response = (await this.axiosInstance.get("ontologies", { params: this.buildParamsForGet(paginationParams, sortingParams, contentParams, parameter) })).data;
        return this.check_for_errors(response);
    };
    getTerms = async (paginationParams, sortingParams, contentParams) => {
        const response = (await this.axiosInstance.get("terms", { params: this.buildParamsForGet(paginationParams, sortingParams, contentParams) })).data;
        return this.check_for_errors(response);
    };
    getProperties = async (paginationParams, sortingParams, contentParams) => {
        const response = (await this.axiosInstance.get("properties", { params: this.buildParamsForGet(paginationParams, sortingParams, contentParams) })).data;
        return this.check_for_errors(response);
    };
    getIndividuals = async (paginationParams, sortingParams, contentParams) => {
        const response = (await this.axiosInstance.get("individuals", { params: this.buildParamsForGet(paginationParams, sortingParams, contentParams) })).data;
        return this.check_for_errors(response);
    };
    getOntology = async (paginationParams, sortingParams, contentParams, parameter) => {
        const response = (await this.axiosInstance.get("ontologies/" + contentParams?.ontologyId, { params: this.buildOtherParams(parameter) })).data;
        return this.check_for_errors(response);
    };
    /**
     * getTerm, getProperty, getIndividual:
     * These methods always require the respective object IRI in contentParams to be set
     * If ontologyId is undefined in contentParams, the object will be queried from all ontologies, containing a list of results
     * If an ontologyId is provided in contentParams, the returned list will only contain the object from that specific ontology
     */
    getTerm = async (paginationParams, sortingParams, contentParams, parameter) => {
        const queryPrefix = contentParams?.ontologyId ? "ontologies/" + contentParams?.ontologyId + "/" : "";
        const response = (await this.axiosInstance.get(queryPrefix + "terms", { params: { iri: contentParams?.termIri, parameter: this.buildOtherParams(parameter) } })).data;
        return this.check_for_errors(response);
    };
    getProperty = async (paginationParams, sortingParams, contentParams, parameter) => {
        const queryPrefix = contentParams?.ontologyId ? "ontologies/" + contentParams?.ontologyId + "/" : "";
        const response = (await this.axiosInstance.get(queryPrefix + "properties", { params: { iri: contentParams?.propertyIri, parameter: this.buildOtherParams(parameter) } })).data;
        return this.check_for_errors(response);
    };
    getIndividual = async (paginationParams, sortingParams, contentParams, parameter) => {
        const queryPrefix = contentParams?.ontologyId ? "ontologies/" + contentParams?.ontologyId + "/" : "";
        const response = (await this.axiosInstance.get(queryPrefix + "individuals", { params: { iri: contentParams?.individualIri, parameter: this.buildOtherParams(parameter) } })).data;
        return this.check_for_errors(response);
    };
    search = async (queryParams, paginationParams, contentParams, parameter, abortSignal) => {
        return (await this.axiosInstance.get("search", { params: this.buildParamsForSearch(queryParams, paginationParams, contentParams, parameter), signal: abortSignal })).data;
    };
    select = async (queryParams, paginationParams, contentParams, parameter) => {
        return (await this.axiosInstance.get("select", { params: this.buildParamsForSelect(queryParams, paginationParams, contentParams, parameter) })).data;
    };
    suggest = async (queryParams, paginationParams, contentParams, parameter) => {
        return (await this.axiosInstance.get("suggest", { params: this.buildParamsForSuggest(queryParams, paginationParams, contentParams, parameter) })).data;
    };
    /**
     * getTermTree:
     * This method always requires an ontologyId in contentParams
     * 1) If no termIri is defined in contentParams, the ontology roots will be queried
     * 2) If a termIri is defined but no child in jsTreeParams, the hierarchy containing that term will be queried
     * 3) If a termIri is defined and also a child in jsTreeParams, the subhierarchy of that child will be queried
     */
    getTermTree = async (contentParams, treeParams, paginationParams, sortingParams) => {
        let baseRequest = "ontologies/" + contentParams?.ontologyId + "/terms";
        if (!contentParams.termIri)
            return (await this.axiosInstance.get(baseRequest + "/roots")).data; //1)
        baseRequest = baseRequest + "/" + encodeURIComponent(encodeURIComponent(contentParams?.termIri)) + "/jstree";
        if (treeParams.child)
            return (await this.axiosInstance.get(baseRequest + "/children/" + treeParams.child)).data; //3)
        else
            return (await this.axiosInstance.get(baseRequest, { params: treeParams })).data; //2)
    };
    getTermRelations = async (contentParams, paginationParams, sortingParams) => {
        let baseRequest = "ontologies/" + contentParams?.ontologyId + "/terms";
        if (!contentParams.termIri)
            return (await this.axiosInstance.get(baseRequest + "/roots")).data; //1)
        baseRequest = baseRequest + "/" + encodeURIComponent(encodeURIComponent(contentParams?.termIri)) + "/graph";
    };
}

const NO_DESCRIPTION = "No description available.";
async function getDescription(olsApi, entityType, ontologyId, iri, parameter) {
    if (entityType == "ontology") {
        if (!ontologyId) {
            throw Error("ontology id has to be provided");
        }
        else {
            const response = await olsApi.getOntology(undefined, undefined, {
                ontologyId: ontologyId
            }, parameter);
            return {
                description: response?.config.description || NO_DESCRIPTION
            };
        }
    }
    if (entityType === "term" || entityType === "property" || entityType === "individual") {
        if (!iri) {
            throw Error("iri has to be provided");
        }
        else {
            const response = await getPreferredOntologyJSON(olsApi, entityType, ontologyId, iri, parameter);
            return {
                description: response['description'] || NO_DESCRIPTION,
                inDefiningOntology: response['is_defining_ontology'],
                ontology: response['ontology_name']
            };
        }
    }
    //unacceptable object type
    throw Error("Unexpected entity type. Should be one of 'ontology', 'term', 'class', 'individual', 'property'");
}
function DescriptionWidget(props) {
    const { api, ontologyId, iri, descText, entityType, parameter, ...rest } = props;
    const fixedEntityType = entityType == "class" ? "term" : entityType;
    const olsApi = new OlsApi(api);
    const { data: response, isLoading, isError, isSuccess, error, } = useQuery([api, "description", fixedEntityType, ontologyId, iri, parameter], () => { return getDescription(olsApi, fixedEntityType, ontologyId, iri, parameter); });
    // TODO: Should DescriptionWidget show the following info message if defining ontology is not available (placed inside isSuccess span)?
    /*{
      !props.ontologyId && !descText && !response.inDefiningOntology && fixedEntityType !== "ontology" &&
      <EuiFlexItem>
        <EuiText>
          <i>Defining ontology not available. Showing occurrence inside {response.ontology} instead.</i>
        </EuiText>
      </EuiFlexItem>
    }*/
    return (React.createElement(React.Fragment, null,
        isLoading && React.createElement(EuiLoadingSpinner, { size: "s" }),
        isSuccess &&
            React.createElement(React.Fragment, null,
                React.createElement(EuiText, { ...rest }, descText || response.description)),
        isError && React.createElement(EuiText, null, getErrorMessageToDisplay(error, "description"))));
}

function IriWidget(props) {
    const { iri, iriText, color } = props;
    return (React.createElement(EuiFlexItem, { grow: false },
        React.createElement("div", null,
            React.createElement(EuiLink, { href: iri, target: "_blank", color: color }, iriText ? iriText : iri))));
}

function BreadcrumbWidget(props) {
    const { api, ontologyId, iri, entityType, colorFirst, colorSecond, parameter } = props;
    const fixedEntityType = entityType == "class" ? "term" : entityType;
    const olsApi = new OlsApi(api);
    const { data: ontologyJSON, isLoading: isLoading, isSuccess: isSuccess, isError: isError, error: error, } = useQuery([api, "short_form", fixedEntityType, ontologyId, iri, parameter], () => { return getPreferredOntologyJSON(olsApi, fixedEntityType, ontologyId, iri, parameter); });
    return (React.createElement(React.Fragment, null,
        isLoading &&
            React.createElement("span", null,
                React.createElement(EuiBadge, { color: colorFirst || ((props.ontologyId) ? "primary" : "warning") }, props.ontologyId?.toUpperCase() || React.createElement(EuiLoadingSpinner, { size: "s" })),
                " > ",
                React.createElement(EuiBadge, { color: colorSecond || "warning" }, React.createElement(EuiLoadingSpinner, { size: "s" }))),
        isSuccess &&
            React.createElement("span", null,
                !props.ontologyId && !ontologyJSON["is_defining_ontology"] &&
                    React.createElement(EuiFlexItem, null,
                        React.createElement(EuiText, { size: "s" },
                            React.createElement("i", null, "Defining ontology not available "),
                            React.createElement(EuiIconTip, { type: "iInCircle", color: "subdued", content: `Showing occurence inside ${ontologyJSON["ontology_name"]} instead.` }))),
                React.createElement(EuiBadge, { color: colorFirst || "primary" }, ontologyJSON['ontology_name'].toUpperCase()),
                " > ",
                React.createElement(EuiBadge, { color: colorSecond || "success" }, ontologyJSON['short_form'] ? ontologyJSON['short_form'].toUpperCase() : "No short form available")),
        isError &&
            React.createElement("span", null,
                React.createElement(EuiBadge, { color: colorFirst || ((props.ontologyId || (ontologyJSON && ontologyJSON['ontology_name'])) ? "primary" : "danger") }, props.ontologyId?.toUpperCase() || (ontologyJSON && ontologyJSON['ontology_name']?.toUpperCase()) || getErrorMessageToDisplay(error, "ontology")),
                " > ",
                React.createElement(EuiBadge, { color: colorSecond || ((ontologyJSON && ontologyJSON['short_form']) ? "success" : "danger") }, (ontologyJSON && ontologyJSON['short_form']) ? ontologyJSON['short_form'].toUpperCase() : getErrorMessageToDisplay(error, "short form")))));
}

function AlternativeNameTabWidget(props) {
    const { iri, api, parameter, entityType, ontologyId } = props;
    const olsApi = new OlsApi(api);
    const { data: ontologyJSON, isLoading: isLoading, isSuccess: isSuccess, isError: isError, error: error, } = useQuery([api, iri, ontologyId, entityType, parameter, "entityInfo"], () => {
        return getPreferredOntologyJSON(olsApi, entityType, ontologyId, iri, parameter);
    });
    function renderAltLabel() {
        if (ontologyJSON['synonyms'] && ontologyJSON['synonyms'].length > 0) {
            return ontologyJSON['synonyms'].map((value, index) => (React.createElement(EuiFlexItem, { key: value + index }, value)));
        }
        return React.createElement(EuiText, null, "No alternative names exist.");
    }
    // TODO: Should AlternativeNameTabWidget show the following info message if defining ontology is not available (placed inside EuiPanel span)?
    /*{
        isSuccess && !props.ontologyId && !ontologyJSON["is_defining_ontology"] &&
        <EuiFlexItem>
            <EuiText>
                <i>Defining ontology not available. Showing occurrence inside {ontologyJSON["ontology_name"]} instead.</i>
            </EuiText>
            <EuiSpacer size={"s"}></EuiSpacer>
        </EuiFlexItem>
    }*/
    return (React.createElement(EuiPanel, null,
        React.createElement(EuiFlexGroup, { style: { padding: 10 }, direction: "column" },
            isSuccess && renderAltLabel(),
            isLoading && React.createElement(EuiLoadingSpinner, null),
            isError && React.createElement(EuiText, null, getErrorMessageToDisplay(error, "alternative names")))));
}

function getCrossRefs(response) {
    if (response && response['obo_xref']) {
        return {
            crossrefs: response['obo_xref'],
        };
    }
    else {
        return {
            crossrefs: [],
        };
    }
}
function CrossRefTabWidget(props) {
    const { iri, api, parameter, entityType, ontologyId } = props;
    const olsApi = new OlsApi(api);
    const { data: ontologyJSON, isLoading, isSuccess, isError, error, } = useQuery([api, iri, ontologyId, entityType, parameter, "entityInfo"], () => {
        return getPreferredOntologyJSON(olsApi, entityType, ontologyId, iri, parameter);
    });
    function renderCrossRefs(data) {
        if (data?.crossrefs && data.crossrefs.length > 0) {
            return data?.crossrefs.map((item, index) => (React.createElement(EuiFlexItem, { key: index }, item.database ? (item.url ? (React.createElement(EuiLink, { href: item.url, external: true, target: "_blank" },
                item.database,
                ":",
                item.id)) : (`${item.database}:${item.id}`)) : ( //just show the ID if there is no value for the database
            item.url ? (React.createElement(EuiLink, { href: item.url, external: true, target: "_blank" }, item.id)) : (`${item.id}`)))));
        }
        return React.createElement(EuiText, null, "No cross references exist.");
    }
    // TODO: Should CrossRefTabWidget show the following info message if defining ontology is not available (placed inside EuiPanel span)?
    /*{
        isSuccess && !props.ontologyId && !ontologyJSON["is_defining_ontology"] &&
        <EuiFlexItem>
            <EuiText>
                <i>Defining ontology not available. Showing occurrence inside {ontologyJSON["ontology_name"]} instead.</i>
            </EuiText>
            <EuiSpacer size={"s"}></EuiSpacer>
        </EuiFlexItem>
    }*/
    return (React.createElement(EuiPanel, null,
        React.createElement(React.Fragment, null,
            React.createElement(EuiFlexGroup, { style: { padding: 7 }, direction: "column" },
                isSuccess && renderCrossRefs(getCrossRefs(ontologyJSON)),
                isLoading && React.createElement(EuiLoadingSpinner, null),
                isError && React.createElement(EuiText, null, getErrorMessageToDisplay(error, "cross references"))))));
}

const fetch_data = (url) => {
    return (fetch(url, {
        method: "GET",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
    })
        .then((res) => res.json())
        // eslint-disable-next-line node/handle-callback-err
        .catch((err) => {
        return [];
    }));
};
/**
 *
 * @param url Get url with http or https protocol
 * @returns concatinate s to http
 */
const fix_url = (url) => {
    if (url.substr(0, 5) === "http:") {
        return url.replace("http", "https");
    }
    else {
        return url;
    }
};
/**
 *
 * @param url
 * @returns return url from https to /terms
 */
const get_url_prefix = (url) => {
    if (url === undefined)
        return "";
    return fix_url(url.substring(0, url.search("/terms") + 7));
};

class HierarchyTree {
    url;
    iri;
    label;
    id;
    isExpanded = true;
    children = [];
    icon = (React.createElement(React.Fragment, null, "+"));
    iconWhenExpanded = (React.createElement(React.Fragment, null, "-"));
    constructor(label, id, url, iri) {
        this.label = label;
        this.id = id;
        this.iri = iri;
        this.url = url;
    }
    setchild(child) {
        this.children.push(child);
        if (this.children.length > 0) {
            this.icon = React.createElement(React.Fragment, null, "+");
        }
    }
    is_root() {
        return this.id === "#";
    }
    to_string() {
        return (this.label + "[ " + this.children.map((value) => value.to_string()) + " ]");
    }
    callback() {
        if (this.isExpanded)
            return "";
        const api_data_onclick = this.url +
            encodeURIComponent(encodeURIComponent(this.iri)) +
            "/jstree/children/" +
            this.id;
        fetch_data(api_data_onclick).then((res) => {
            this.children = [];
            create_tree(this, res, this.url);
        });
        return "";
    }
}
const create_tree = (tree, arr, url) => {
    arr
        .filter((value) => value.parent === tree.id)
        .forEach((value) => {
        tree.setchild(new HierarchyTree(value.text, value.id, url, value.iri));
    });
    tree.children.map((value) => create_tree(value, arr, url));
};
async function getTree(olsApi, ontologyId, iri) {
    const response = await olsApi.getTermTree({ ontologyId: ontologyId, termIri: iri }, { viewMode: "All", siblings: false }, undefined, undefined)
        .catch((error) => console.log(error));
    if (iri)
        return response;
    else { //roots have been queried, and the response needs restructuring to become SemanticResponse
        return response._embedded.terms.map((x, i) => ({ id: (++i).toString(), parent: '#', iri: x.iri, text: x.label, children: x.has_children }));
    }
}
const HierarchyWidget = (props) => {
    const { iri, ontologyId, api } = props;
    const [treeItems, setTreeItems] = useState();
    const olsApi = new OlsApi(api);
    const linkToSelf = api + "ontologies/" + ontologyId + "/terms/";
    //initial tree query
    useQuery([api, "getTermTree", ontologyId, iri], () => {
        return getTree(olsApi, ontologyId, iri)
            .then((res) => {
            const root = new HierarchyTree("#", "#", "", "");
            if (res)
                create_tree(root, res, get_url_prefix(linkToSelf));
            setTreeItems(root.children);
            return res;
        });
    });
    return (React.createElement(EuiPanel, null, treeItems && (React.createElement(EuiTreeView, { expandByDefault: true, "aria-label": "HierarchyTab", items: treeItems }))));
};

function TabWidget(props) {
    const { iri, api, ontologyId, entityType, parameter, ...rest } = props;
    const fixedEntityType = entityType == "class" ? "term" : entityType;
    const olsApi = new OlsApi(api);
    const { data: ontologyJSON, isLoading: isLoading, isSuccess: isSuccess, isError: isError, error: error, } = useQuery([
        api,
        "tab-widget",
        fixedEntityType,
        ontologyId,
        iri,
        parameter
    ], () => { return getPreferredOntologyJSON(olsApi, fixedEntityType, ontologyId, iri, parameter); });
    return (React.createElement(React.Fragment, null,
        isSuccess && !props.ontologyId && ontologyJSON && !ontologyJSON["is_defining_ontology"] &&
            React.createElement(EuiFlexItem, null,
                React.createElement(EuiText, null,
                    React.createElement("i", null,
                        "Defining ontology not available. Showing occurrence inside ",
                        ontologyJSON["ontology_name"],
                        " instead."))),
        React.createElement("div", null,
            React.createElement(EuiFlexItem, null,
                React.createElement(EuiTabbedContent, { size: "s", tabs: [
                        {
                            content: React.createElement(AlternativeNameTabWidget, { api: api, iri: iri, ontologyId: props.ontologyId || ((ontologyJSON && ontologyJSON['ontology_name']) ? ontologyJSON['ontology_name'] : ""), entityType: entityType }),
                            id: "tab1",
                            name: "Alternative Names",
                        },
                        {
                            content: (React.createElement(HierarchyWidget, { api: api, iri: iri, ontologyId: props.ontologyId || ((ontologyJSON && ontologyJSON['ontology_name']) ? ontologyJSON['ontology_name'] : "") })),
                            id: "tab2",
                            name: "Hierarchy",
                        },
                        {
                            content: React.createElement(CrossRefTabWidget, { api: api, iri: iri, ontologyId: props.ontologyId || ((ontologyJSON && ontologyJSON['ontology_name']) ? ontologyJSON['ontology_name'] : ""), entityType: entityType }),
                            id: "tab3",
                            name: "Cross references",
                        },
                    ] })))));
}

const NO_TITLE = "No title available.";
async function getTitle(olsApi, entityType, ontologyId, iri, parameter, default_value) {
    if (entityType === "ontology") {
        if (!ontologyId) {
            throw Error("ontology id has to be provided");
        }
        else {
            const response = await olsApi.getOntology(undefined, undefined, {
                ontologyId: ontologyId
            }, parameter);
            return {
                title: response?.config.title || default_value || NO_TITLE
            };
        }
    }
    if (entityType === "term" || entityType === "property" || entityType === "individual") {
        if (!iri) {
            throw Error("iri has to be provided");
        }
        else {
            const response = await getPreferredOntologyJSON(olsApi, entityType, ontologyId, iri, parameter);
            return {
                title: response['label'] || default_value || NO_TITLE,
                inDefiningOntology: response['is_defining_ontology'],
                ontology: response['ontology_name']
            };
        }
    }
    //unacceptable object type
    throw Error("Unexpected entity type. Should be one of 'ontology', 'term', 'class', 'individual', 'property'");
}
function TitleWidget(props) {
    const { iri, ontologyId, api, titleText, entityType, parameter, default_value } = props;
    const fixedEntityType = entityType == "class" ? "term" : entityType;
    const olsApi = new OlsApi(api);
    const { data: response, isLoading, isSuccess, isError, error, } = useQuery([api, "getTitle", fixedEntityType, ontologyId, iri, parameter], () => {
        return getTitle(olsApi, fixedEntityType, ontologyId, iri, parameter, default_value);
    });
    // TODO: Should TitleWidget show the following info message if defining ontology is not available (placed inside isSuccess span)?
    /*{
        !props.ontologyId && !titleText && !response.inDefiningOntology && fixedEntityType !== "ontology" &&
        <EuiFlexItem>
            <EuiText>
                <i>Defining ontology not available. Showing occurrence inside {response.ontology} instead.</i>
            </EuiText>
        </EuiFlexItem>
    }*/
    return (React.createElement(React.Fragment, null,
        isLoading && React.createElement(EuiLoadingSpinner, { size: "s" }),
        isSuccess &&
            React.createElement(React.Fragment, null,
                React.createElement(EuiText, null, titleText || response.title)),
        isError && React.createElement(EuiText, null, getErrorMessageToDisplay(error, "title"))));
}

function MetadataWidget(props) {
    const { iri, api, ontologyId, entityType, parameter } = props;
    const olsApi = new OlsApi(api);
    const { data: ontologyJSON, isLoading: isLoadingOntologyId, isSuccess: isSuccessOntologyId, isError: isErrorOntologyId, error: errorOntologyId } = useQuery([
        "ontologyId",
        iri,
        api,
        entityType,
        parameter,
        props.ontologyId
    ], async () => {
        return getPreferredOntologyJSON(olsApi, entityType, ontologyId, iri, parameter);
    }, {});
    return (React.createElement(React.Fragment, null,
        isLoadingOntologyId && React.createElement(EuiLoadingSpinner, { size: "s" }),
        (props.ontologyId || isSuccessOntologyId) &&
            React.createElement(EuiFlexGroup, { direction: "column", style: { maxWidth: 600 } },
                !props.ontologyId && !ontologyJSON["is_defining_ontology"] &&
                    React.createElement(EuiFlexItem, null,
                        React.createElement(EuiText, null,
                            React.createElement("i", null,
                                "Defining ontology not available. Showing occurrence inside ",
                                ontologyJSON["ontology_name"],
                                " instead."))),
                React.createElement(EuiFlexItem, { grow: false },
                    React.createElement("span", null,
                        React.createElement(BreadcrumbWidget, { api: api, iri: iri, entityType: entityType, ontologyId: props.ontologyId ? props.ontologyId : ontologyJSON["ontology_name"], parameter: parameter }))),
                React.createElement(EuiFlexItem, null,
                    React.createElement(EuiFlexGroup, { direction: "column" },
                        React.createElement(EuiFlexItem, null,
                            React.createElement(EuiFlexGroup, null,
                                React.createElement(EuiFlexItem, { grow: false },
                                    React.createElement(IriWidget, { iri: iri, parameter: parameter })))),
                        React.createElement(EuiFlexItem, { grow: false },
                            React.createElement(TitleWidget, { iri: iri, api: api, ontologyId: props.ontologyId ? props.ontologyId : ontologyJSON["ontology_name"], entityType: entityType, parameter: parameter })))),
                React.createElement(EuiFlexItem, null,
                    React.createElement(DescriptionWidget, { iri: iri, api: api, ontologyId: props.ontologyId ? props.ontologyId : ontologyJSON["ontology_name"], entityType: entityType, parameter: parameter })),
                React.createElement(EuiFlexItem, null,
                    React.createElement(TabWidget, { iri: iri, ontologyId: props.ontologyId ? props.ontologyId : ontologyJSON["ontology_name"], api: api, parameter: parameter, entityType: entityType })))));
}

/**
 * returns JSON of specified ontology or, if not provided, of defining ontology or of first ontology if defining ontology is not found
 */
async function getPreferredOntologyJSON(olsApi, entityType, ontologyId, iri, parameter) {
    if (entityType === "term" || entityType === "class") {
        const response = await olsApi.getTerm(undefined, undefined, { ontologyId: ontologyId, termIri: iri }, parameter)
            .catch((error) => console.log(error));
        const definingOntologyArr = response["_embedded"]["terms"].filter((term) => { return term["is_defining_ontology"]; });
        if (definingOntologyArr.length > 0)
            return definingOntologyArr[0];
        else
            return response["_embedded"]["terms"][0];
    }
    else if (entityType === "property") {
        const response = await olsApi.getProperty(undefined, undefined, { ontologyId: ontologyId, propertyIri: iri }, parameter)
            .catch((error) => console.log(error));
        const definingOntologyArr = response["_embedded"]["properties"].filter((term) => { return term["is_defining_ontology"]; });
        if (definingOntologyArr.length > 0)
            return definingOntologyArr[0];
        else
            return response["_embedded"]["properties"][0];
    }
    else if (entityType === "individual") {
        const response = await olsApi.getIndividual(undefined, undefined, { ontologyId: ontologyId, individualIri: iri }, parameter)
            .catch((error) => console.log(error));
        const definingOntologyArr = response["_embedded"]["individuals"].filter((term) => { return term["is_defining_ontology"]; });
        if (definingOntologyArr.length > 0)
            return definingOntologyArr[0];
        else
            return response["_embedded"]["individuals"][0];
    }
    else {
        console.error(Error("Unexpected entity type. Should be one of: 'term', 'class', 'property', 'individual'"));
        return undefined;
    }
}

/**
 * A React component to provide Autosuggestion based on SemLookP.
 */
function AutocompleteWidget(props) {
    const { api, parameter, hasShortSelectedLabel, ...rest } = props;
    const olsApi = new OlsApi(api);
    const visColors = euiPaletteColorBlind();
    const visColorsBehindText = euiPaletteColorBlindBehindText();
    /**
     * The current search value
     */
    const [searchValue, setSearchValue] = useState("");
    /**
     * The set of available options.s
     */
    const [options, setOptions] = useState([]);
    /**
     * Store current set of select Options. A subset of options.
     */
    const [selectedOptions, setSelectedOptions] = useState([]);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const renderOption = (option, searchValue) => {
        const { label, value } = option;
        if (props.allowCustomTerms && value.iri == "") { // if we have a custom term, just show the label
            return label;
        }
        else { // otherwise can we can use the semantic information to show some context information like ontology name
            let color = "";
            if (value.type === "class") {
                color = visColorsBehindText[5];
            }
            else if (value.type === "individual") {
                color = visColorsBehindText[3];
            }
            else if (value.type === "property") {
                color = visColorsBehindText[1];
            }
            const dotColor = visColors[visColorsBehindText.indexOf(color)];
            if (value.type === "ontology") {
                return (React.createElement(EuiHealth, { title: value.type, color: dotColor },
                    React.createElement("span", null,
                        React.createElement(EuiHighlight, { search: searchValue }, value.label))));
            }
            return (React.createElement(EuiHealth, { title: value.type, color: dotColor },
                React.createElement("span", null,
                    React.createElement(EuiHighlight, { search: searchValue }, value.label),
                    "\u00A0\u00A0\u00A0\u00A0\u00A0",
                    React.createElement(BreadcrumbWidget, { api: api, entityType: value.type, ontologyId: value.ontology_name, iri: value.iri, colorFirst: "primary", colorSecond: "success", parameter: value.parameter }))));
        }
    };
    /**
     * on mount: fetches term for selectOption and sets it's label or sets a given label if no iri is provided or the given iri cannot be resolved only if allowCustomTerms is true
     */
    const { isLoading: isLoadingOnMount } = useQuery([
        "onMount",
        props.selectOption
    ], async () => {
        if (props.selectOption?.iri && props.selectOption?.iri.startsWith("http")) {
            olsApi.select({ query: props.selectOption?.iri }, undefined, undefined, parameter).then((response) => {
                if (response.response && response.response.docs) {
                    response.response.docs.map((selection) => {
                        if (props.selectOption?.iri === selection.iri) {
                            setOptions([
                                {
                                    // label to display within the combobox either raw value or generated one
                                    // #renderOption() is used to display during selection.
                                    label: hasShortSelectedLabel ? selection.label : generateDisplayLabel(selection),
                                    value: {
                                        iri: selection.iri,
                                        label: selection.label,
                                        ontology_name: selection.ontology_name,
                                        type: selection.type,
                                        short_form: selection.short_form,
                                    },
                                },
                            ]);
                            setSelectedOptions([
                                {
                                    // label to display within the combobox either raw value or generated one
                                    // #renderOption() is used to display during selection.
                                    label: hasShortSelectedLabel ? selection.label : generateDisplayLabel(selection),
                                    value: {
                                        iri: selection.iri,
                                        label: selection.label,
                                        ontology_name: selection.ontology_name,
                                        type: selection.type,
                                        short_form: selection.short_form,
                                    },
                                },
                            ]);
                        }
                    });
                }
            });
        }
        else if (props.selectOption?.label && props.allowCustomTerms) { // when a custom term is passed
            setOptions([
                {
                    label: props.selectOption?.label,
                    value: {
                        iri: "",
                        label: "",
                        ontology_name: "",
                        type: "",
                        short_form: "",
                    }
                },
            ]);
            setSelectedOptions([
                {
                    label: props.selectOption?.label,
                    value: {
                        iri: "",
                        label: "",
                        ontology_name: "",
                        type: "",
                        short_form: "",
                    }
                },
            ]);
        }
    });
    /**
     * fetches new options when searchValue changes
     */
    const { isLoading: isLoadingTerms } = useQuery([
        "onSearchChange",
        searchValue
    ], async () => {
        if (searchValue.length > 0) {
            return olsApi.select({ query: searchValue }, undefined, undefined, parameter).then((response) => {
                if (response.response && response.response.docs) {
                    setOptions(response.response.docs.map((selection) => ({
                        // label to display within the combobox either raw value or generated one
                        // #renderOption() is used to display during selection.
                        label: hasShortSelectedLabel ? selection.label : generateDisplayLabel(selection),
                        // values to pass to clients
                        value: {
                            iri: selection.iri,
                            label: selection.label,
                            ontology_name: selection.ontology_name,
                            type: selection.type,
                            short_form: selection.short_form,
                        },
                    })));
                    setSelectedOptions([]);
                }
            });
        }
    });
    /**
     * Once the set of selected options changes, pass the event by invoking the passed function.
     */
    useEffect(() => {
        if (selectedOptions.length >= 1) {
            props.selectionChangedEvent(selectedOptions.map((x) => {
                // return the value object with the raw values from OLS to a client
                if (props.allowCustomTerms && x.value.iri == "") {
                    return {
                        iri: "",
                        label: x.label,
                        ontology_name: "",
                        type: ""
                    };
                }
                else {
                    return {
                        iri: x.value.iri,
                        label: x.value.label,
                        ontology_name: x.value.ontology_name,
                        type: x.value.type
                    };
                }
            })[0]);
        }
    }, [selectedOptions]);
    function generateDisplayLabel(item) {
        return (item.label +
            " (" +
            item.ontology_name.toUpperCase() +
            " " +
            item.short_form +
            ")");
    }
    function onChangeHandler(options) {
        setSelectedOptions(options);
    }
    function onCreateOptionHandler(searchValue) {
        const newOption = {
            label: searchValue,
            value: {
                iri: "",
                label: "",
                ontology_name: "",
                type: "",
                short_form: "",
            }
        };
        setOptions([...options, newOption]);
        setSelectedOptions([...selectedOptions, newOption]);
    }
    if (props.allowCustomTerms) {
        return (React.createElement(EuiComboBox, { isClearable: true, "aria-label": "searchBar", fullWidth: true, ...rest, async: true, isLoading: isLoadingTerms || isLoadingOnMount, singleSelection: { asPlainText: true }, placeholder: props.placeholder ? props.placeholder : "Search for a Concept", options: options, selectedOptions: selectedOptions, onSearchChange: setSearchValue, onChange: onChangeHandler, renderOption: renderOption, onCreateOption: onCreateOptionHandler }));
    }
    else {
        return (React.createElement(EuiComboBox, { isClearable: true, "aria-label": "searchBar", fullWidth: true, ...rest, async: true, isLoading: isLoadingTerms || isLoadingOnMount, singleSelection: { asPlainText: true }, placeholder: props.placeholder ? props.placeholder : "Search for a Concept", options: options, selectedOptions: selectedOptions, onSearchChange: setSearchValue, onChange: onChangeHandler, renderOption: renderOption }));
    }
}

function JsonApiWidget(props) {
    const { apiQuery, buttonText, buttonSize } = props;
    return (React.createElement(EuiButton, { href: apiQuery, target: "_blank", size: buttonSize || "m" }, buttonText));
}

const NOT_AVAILABLE = "n/a";
async function getTotalAmountOfTerms(apiCall, parameter) {
    const response = await apiCall({ size: "500" }, undefined, undefined, parameter);
    if (response.page.totalElements != null && response._embedded && response._embedded.ontologies) {
        let totalAmount = 0;
        for (const ontology of response._embedded.ontologies) {
            totalAmount += ontology.numberOfTerms;
        }
        return totalAmount;
    }
    else {
        throw new Error("Unexpected API response");
    }
}
async function getTotalAmountOfProperties(apiCall, parameter) {
    const response = await apiCall({ size: "500" }, undefined, undefined, parameter);
    if (response.page.totalElements != null && response._embedded && response._embedded.ontologies) {
        let totalAmount = 0;
        for (const ontology of response._embedded.ontologies) {
            totalAmount += ontology.numberOfProperties;
        }
        return totalAmount;
    }
    else {
        throw new Error("Unexpected API response");
    }
}
async function getTotalAmountOfIndividuals(apiCall, parameter) {
    const response = await apiCall({ size: "500" }, undefined, undefined, parameter);
    if (response.page.totalElements != null && response._embedded && response._embedded.ontologies) {
        let totalAmount = 0;
        for (const ontology of response._embedded.ontologies) {
            totalAmount += ontology.numberOfIndividuals;
        }
        return totalAmount;
    }
    else {
        throw new Error("Unexpected API response");
    }
}
function DataContentWidget(props) {
    const { api, parameter, ...rest } = props;
    const olsApi = new OlsApi(api);
    const [totalOntologies, setTotalOntologies] = useState(0);
    const { data: getOntologies, isLoading: isLoadingOntologies, isError: isErrorOntologies, error: errorOntologies, dataUpdatedAt: dataUpdatedAtOntologies } = useQuery([
        api,
        "ontologiesMetadata",
        parameter,
    ], async () => {
        return olsApi
            .getOntologies({
            size: "500",
        }, undefined, undefined, props.parameter)
            .then((response) => {
            if (response.page.totalElements != null &&
                response._embedded &&
                response._embedded.ontologies) {
                // TODO Refactor (code duplication, possibly reuse getTotalElements from DataContentWidget?)
                setTotalOntologies(response.page.totalElements);
                return response._embedded.ontologies;
            }
            else {
                throw new Error("Unexpected API response");
            }
        });
    });
    const { data: totalTerms, isLoading: isLoadingTerms, isError: isErrorTerms, error: errorTerms, } = useQuery([api, "getTerms", parameter], () => { return getTotalAmountOfTerms(olsApi.getOntologies, props.parameter); });
    const { data: totalProperties, isLoading: isLoadingProperties, isError: isErrorProperties, error: errorProperties, } = useQuery([api, "getProperties", parameter], () => { return getTotalAmountOfProperties(olsApi.getOntologies, props.parameter); });
    const { data: totalIndividuals, isLoading: isLoadingIndividuals, isError: isErrorIndividuals, error: errorIndividuals, } = useQuery([api, "getIndividuals", parameter], () => { return getTotalAmountOfIndividuals(olsApi.getOntologies, props.parameter); });
    return (React.createElement(React.Fragment, null,
        React.createElement(EuiCard, { title: "Data Content", description: dataUpdatedAtOntologies ? `Updated ${new Date(dataUpdatedAtOntologies).toLocaleString()}` : '', layout: "horizontal" },
            React.createElement(EuiText, { ...rest }, (isErrorIndividuals || isErrorProperties || isErrorOntologies || isErrorTerms) ?
                React.createElement(EuiText, null, "No data content available") :
                React.createElement("ul", null,
                    React.createElement("li", null,
                        isLoadingOntologies ? React.createElement(EuiLoadingSpinner, { size: "s" }) : (totalOntologies ? totalOntologies.toLocaleString() : NOT_AVAILABLE),
                        " ontologies and terminologies"),
                    React.createElement("li", null,
                        isLoadingTerms ? React.createElement(EuiLoadingSpinner, { size: "s" }) : (totalTerms ? totalTerms.toLocaleString() : NOT_AVAILABLE),
                        " terms"),
                    React.createElement("li", null,
                        isLoadingProperties ? React.createElement(EuiLoadingSpinner, { size: "s" }) : (totalProperties ? totalProperties.toLocaleString() : NOT_AVAILABLE),
                        " properties"),
                    React.createElement("li", null,
                        isLoadingIndividuals ? React.createElement(EuiLoadingSpinner, { size: "s" }) : (totalIndividuals ? totalIndividuals.toLocaleString() : NOT_AVAILABLE),
                        " individuals"),
                    " ")))));
}

const DEFAULT_INITIAL_ENTRIES_PER_PAGE = 10;
const DEFAULT_PAGE_SIZE_OPTIONS$1 = [10, 25, 50, 100];
const DEFAULT_INITIAL_SORT_FIELD = "config.preferredPrefix";
const DEFAULT_INITIAL_SORT_DIR = "asc";
function ResourcesWidget(props) {
    const { api, initialEntriesPerPage = DEFAULT_INITIAL_ENTRIES_PER_PAGE, pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS$1, initialSortField = DEFAULT_INITIAL_SORT_FIELD, initialSortDir = DEFAULT_INITIAL_SORT_DIR, targetLink, parameter, } = props;
    const olsApi = new OlsApi(api);
    const [pageIndex, setPageIndex] = useState(0);
    const [entriesPerPage, setEntriesPerPage] = useState(initialEntriesPerPage);
    const [sortField, setSortField] = useState(initialSortField);
    const [sortDirection, setSortDirection] = useState(initialSortDir);
    const [totalOntologies, setTotalOntologies] = useState(0);
    const columns = [
        {
            name: "Resource Name",
            field: "config.title",
            width: "15%",
            sortable: true,
        },
        {
            name: "Short Name",
            field: "config.preferredPrefix",
            render: (value) => (targetLink ? React.createElement(EuiLink, { href: targetLink + "ontologies/" + value.toLowerCase() + "/" }, value) : value),
            width: "10%",
            sortable: true,
        },
        {
            name: "Description",
            field: "config.description",
            width: "30%",
            css: css `
        display: block;
        max-height: 200px;
        overflow: auto;
      `,
        },
        {
            name: "Version",
            field: "config.version",
            width: "7.5%",
        },
        {
            name: "Loaded on",
            field: "loaded",
            width: "10%",
            dataType: "date",
            sortable: true,
        },
        {
            name: "Terms",
            field: "numberOfTerms",
            render: (value) => React.createElement(React.Fragment, null, value.toLocaleString()),
            width: "7.5%",
            sortable: true,
        },
        {
            name: "Properties",
            field: "numberOfProperties",
            render: (value) => React.createElement(React.Fragment, null, value.toLocaleString()),
            width: "7.5%",
            sortable: true,
        },
        {
            name: "Individuals",
            field: "numberOfIndividuals",
            render: (value) => React.createElement(React.Fragment, null, value.toLocaleString()),
            width: "7.5%",
            sortable: true,
        },
        {
            width: "5%",
            actions: [
                ...(props.actions || []),
                {
                    render: (item) => (React.createElement(EuiButtonIcon, { href: item.config.fileLocation, iconType: "download", "aria-label": "Download", isDisabled: !item.config.allowDownload ||
                            item.config.fileLocation.startsWith("file://") })),
                },
            ],
        },
    ];
    const pagination = {
        pageIndex: pageIndex,
        pageSize: entriesPerPage,
        totalItemCount: totalOntologies,
        pageSizeOptions: pageSizeOptions,
    };
    const sorting = {
        sort: {
            field: sortField,
            direction: sortDirection,
        },
    };
    const onTableChange = ({ page, sort, }) => {
        const { index: pageIndex, size: entriesPerPage } = page;
        setPageIndex(pageIndex);
        setEntriesPerPage(entriesPerPage);
        if (sort) {
            const { field: sortField, direction: sortDirection } = sort;
            setSortField(sortField);
            setSortDirection(sortDirection);
        }
    };
    const { data: ontologies, isSuccess, isLoading, isError, error, } = useQuery([
        api,
        "ontologiesMetadata",
        entriesPerPage,
        pageIndex,
        sortField,
        sortDirection,
        parameter,
    ], async () => {
        return olsApi
            .getOntologies({
            size: entriesPerPage.toString(),
            page: pageIndex.toString(),
        }, {
            sortField: sortField,
            sortDir: sortDirection,
        }, undefined, props.parameter)
            .then((response) => {
            if (response.page.totalElements != null &&
                response._embedded &&
                response._embedded.ontologies) {
                // TODO Refactor (code duplication, possibly reuse getTotalElements from DataContentWidget?)
                setTotalOntologies(response.page.totalElements);
                return response._embedded.ontologies;
            }
            else {
                throw new Error("Unexpected API response");
            }
        });
    });
    return (React.createElement(React.Fragment, null,
        isSuccess &&
            React.createElement(EuiBasicTable, { columns: columns, items: ontologies, onChange: onTableChange, pagination: pagination, sorting: sorting }),
        isLoading &&
            React.createElement(EuiBasicTable, { columns: columns, items: [], onChange: onTableChange, pagination: pagination, sorting: sorting, loading: true }),
        isError &&
            React.createElement(EuiBasicTable, { columns: columns, items: [], onChange: onTableChange, pagination: pagination, sorting: sorting, error: getErrorMessageToDisplay(error, "resources") })));
}

async function getOntoData(apiCall, ontologyId, parameter) {
    const response = await apiCall(undefined, undefined, { ontologyId: ontologyId }, parameter);
    return {
        iri: response.config.id,
        id: response.ontologyId,
        version: response.config.version,
        termNum: response.numberOfTerms,
        lastLoad: response.loaded,
        annotations: response.config.annotations ? response.config.annotations : [],
    };
}
function OntologyInfoWidget(props) {
    const { ontologyId, api, parameter } = props;
    const olsApi = new OlsApi(api);
    const infoItemStyle = {
        marginLeft: "9px"
    };
    const isAvailable = (item) => {
        return item != undefined && item != "" && item != [];
    };
    const { data: ontologyInfo, isLoading, isError, error, } = useQuery([api, "getOntology", ontologyId, parameter], () => { return getOntoData(olsApi.getOntology, ontologyId, parameter); });
    return (React.createElement(EuiFlexGroup, { direction: "column", style: { maxWidth: 600 } },
        React.createElement(EuiFlexItem, null,
            React.createElement(EuiFlexGroup, { direction: "column" },
                React.createElement(EuiFlexItem, { grow: false },
                    React.createElement("b", null, "Ontology IRI:"),
                    React.createElement("p", { style: infoItemStyle }, isLoading ? React.createElement(EuiLoadingSpinner, { size: "s" }) : (!isError && ontologyInfo && isAvailable(ontologyInfo.iri) ? ontologyInfo.iri.toLocaleString() : "-"))),
                React.createElement(EuiFlexItem, { grow: false },
                    React.createElement("b", null, "Ontology ID:"),
                    React.createElement("p", { style: infoItemStyle }, isLoading ? React.createElement(EuiLoadingSpinner, { size: "s" }) : (!isError && ontologyInfo && isAvailable(ontologyInfo.id) ? ontologyInfo.id.toLocaleString() : "-"))),
                React.createElement(EuiFlexItem, { grow: false },
                    React.createElement("b", null, "Version:"),
                    React.createElement("p", { style: infoItemStyle }, isLoading ? React.createElement(EuiLoadingSpinner, { size: "s" }) : (!isError && ontologyInfo && isAvailable(ontologyInfo.version) ? ontologyInfo.version.toLocaleString() : "-"))),
                React.createElement(EuiFlexItem, { grow: false },
                    React.createElement("b", null, "Number of terms:"),
                    React.createElement("p", { style: infoItemStyle }, isLoading ? React.createElement(EuiLoadingSpinner, { size: "s" }) : (!isError && ontologyInfo && isAvailable(ontologyInfo.termNum) ? ontologyInfo.termNum.toLocaleString() : "-"))),
                React.createElement(EuiFlexItem, { grow: false },
                    React.createElement("b", null, "Last loaded:"),
                    React.createElement("p", { style: infoItemStyle }, isLoading ? React.createElement(EuiLoadingSpinner, { size: "s" }) : (!isError && ontologyInfo && isAvailable(ontologyInfo.lastLoad) ? new Date(ontologyInfo.lastLoad).toLocaleString() : "-"))),
                ontologyInfo ? (Object.entries(ontologyInfo.annotations).map(([annoKey, annoVal]) => ( /*TODO clickable annoKey*/React.createElement(EuiFlexItem, { grow: false, key: annoKey },
                    React.createElement("b", null,
                        annoKey,
                        ":"),
                    React.createElement("p", { style: infoItemStyle }, isAvailable(annoVal) ? annoVal.toLocaleString() : "-"))))) : ''))));
}

function SearchBarWidget(props) {
    const { api, query, onSearchValueChange, ...rest } = props;
    const olsApi = new OlsApi(api);
    const [searchValue, setSearchValue] = useState(query);
    const [suggestions, setSuggestions] = useState([]);
    useEffect(() => {
        setSearchValue(query);
    }, [query]);
    useEffect(() => {
        onSearchValueChange(searchValue);
    }, [searchValue]);
    /**
     * fetches suggestions when searchValue changes (setSearchValue is passed as EuiSuggest onChange)
     */
    useQuery([
        "onChange",
        searchValue
    ], async () => {
        return olsApi.suggest({
            query: searchValue,
        }, undefined, undefined, props.parameter).then((response) => {
            if (response.response && response.response.docs) {
                setSuggestions(response.response.docs.map((suggestion) => ({
                    label: suggestion.autosuggest,
                    type: { color: "tint1", iconType: "" },
                })));
            }
        });
    });
    function onItemClick(item) {
        setSearchValue(item.label);
    }
    return (React.createElement(React.Fragment, null,
        React.createElement(EuiSuggest, { "aria-label": "Search for Concept", placeholder: "Search for Concept", isClearable: true, ...rest, suggestions: suggestions, onChange: setSearchValue, onItemClick: onItemClick, value: searchValue })));
}

function switchEntityType(entityType) {
    switch (entityType) {
        case 'class':
            return 'terms';
        case 'property':
            return 'properties';
        case 'individual':
            return 'individuals';
        default:
            return 'terms';
    }
}

function MetadataCompact(props) {
    const { api, result, targetLink, ...rest } = props;
    return (React.createElement(EuiCard, { textAlign: "left", ...rest, href: targetLink ?
            (result.type != "ontology" ?
                targetLink + "ontologies/" + result.ontology_name + "/" + switchEntityType(result.type) + "?iri=" + result.iri
                : targetLink + "ontologies/" + result.ontology_name)
            : undefined, title: React.createElement(EuiFlexGroup, null,
            React.createElement(EuiFlexItem, { grow: false },
                React.createElement(EuiTitle, null,
                    React.createElement("h2", null, result.label))),
            React.createElement(EuiFlexItem, null, result.type != "ontology" && React.createElement(BreadcrumbWidget, { api: api, iri: result.iri, entityType: result.type, ontologyId: result.ontology_name }))), children: React.createElement(React.Fragment, null,
            result.type != "ontology" ? React.createElement(IriWidget, { iri: result.iri }) : undefined,
            React.createElement(EuiSpacer, { size: "s" }),
            React.createElement(DescriptionWidget, { api: api, ontologyId: result.ontology_name, iri: result.iri, entityType: result.type })) }));
}

const DEFAULT_INITIAL_ITEMS_PER_PAGE = 10;
const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
function SearchResultsListWidget(props) {
    const { api, query, parameter, initialItemsPerPage = DEFAULT_INITIAL_ITEMS_PER_PAGE, itemsPerPageOptions = DEFAULT_PAGE_SIZE_OPTIONS, targetLink, ...rest } = props;
    const olsApi = new OlsApi(api);
    const [searchValue, setSearchValue] = useState(query);
    const [activePage, setActivePage] = useState(0);
    const [pageCount, setPageCount] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);
    const [totalItems, setTotalItems] = useState(0);
    const [exactMatch, setExactMatch] = useState(false);
    const [showObsoleteTerms, setShowObsoleteTerms] = useState(false);
    const [filterByTypeOptions, setFilterByTypeOptions] = useState([]);
    const [filterByOntologyOptions, setFilterByOntologyOptions] = useState([]);
    useEffect(() => {
        setSearchValue(query);
    }, [query]);
    function updateFilterOptions(currentOptions, optionCounts, setOptions, render) {
        if (currentOptions.length == 0) {
            setOptions(optionCounts.reduce((accumulator, currentValue, currentIndex, array) => {
                if (currentIndex % 2 === 0) {
                    accumulator.push({
                        label: render ? render(currentValue) : currentValue,
                        key: currentValue,
                        append: "(" + array[currentIndex + 1] + ")",
                        disabled: array[currentIndex + 1] == 0,
                        data: { totalCount: array[currentIndex + 1] },
                    });
                }
                return accumulator;
            }, []));
        }
        else {
            const newOptions = [];
            for (let i = 0; i < currentOptions.length; i++) {
                newOptions.push(Object.assign({}, currentOptions[i])); // using Object.assign to pass by value, not by reference
            }
            optionCounts.forEach((currentValue, currentIndex, array) => {
                if (currentIndex % 2 === 0) {
                    const option = newOptions.find((option) => option.key == currentValue);
                    if (option) {
                        option.append = "(" + array[currentIndex + 1];
                        if (option.data && array[currentIndex + 1] < option.data.totalCount) {
                            option.append += "/" + option.data.totalCount;
                        }
                        option.append += ")";
                    }
                }
            });
            setOptions(newOptions);
        }
    }
    const filterSelectedOptions = (option) => option.checked === "on";
    const { data: searchResults, isLoading, isSuccess, isError, error, } = useQuery([
        "searchResults",
        api,
        searchValue,
        exactMatch,
        showObsoleteTerms,
        activePage,
        itemsPerPage,
        filterByTypeOptions.filter(filterSelectedOptions).map((option) => option.key),
        filterByOntologyOptions.filter(filterSelectedOptions).map((option) => option.key),
        parameter
    ], async ({ signal }) => {
        return olsApi.search({
            query: searchValue,
            exactMatch: exactMatch,
            showObsoleteTerms: showObsoleteTerms,
            types: filterByTypeOptions.filter(filterSelectedOptions).map((option) => option.key).join(","),
            ontology: filterByOntologyOptions.filter(filterSelectedOptions).map((option) => option.key).join(","),
            groupByIri: true,
        }, {
            page: activePage.toString(),
            size: itemsPerPage.toString(),
        }, undefined, props.parameter, signal).then((response) => {
            if (response.response && response.response.docs != null && response.response.numFound != null) {
                if (response.facet_counts && response.facet_counts.facet_fields) {
                    if (response.facet_counts.facet_fields.type) {
                        updateFilterOptions(filterByTypeOptions, response.facet_counts.facet_fields.type, setFilterByTypeOptions, (currentValue) => `${currentValue[0].toUpperCase()}${currentValue.slice(1)}`);
                    }
                    if (response.facet_counts.facet_fields.ontology_name) {
                        updateFilterOptions(filterByOntologyOptions, response.facet_counts.facet_fields.ontology_name, setFilterByOntologyOptions, (currentValue) => currentValue.toUpperCase());
                    }
                }
                setTotalItems(response.response.numFound);
                const newPageCount = Math.ceil(response.response.numFound / itemsPerPage);
                setPageCount(newPageCount);
                if (activePage >= newPageCount) {
                    setActivePage(0);
                }
                return response.response.docs;
            }
            else {
                throw new Error("Unexpected API response");
            }
        });
    }, {
        keepPreviousData: true
    } // See: https://react-query-v3.tanstack.com/guides/paginated-queries
    );
    function onChangeItemsPerPage(newItemsPerPage) {
        setActivePage(Math.floor((activePage * itemsPerPage + 1) / newItemsPerPage));
        setItemsPerPage(newItemsPerPage);
    }
    function toggleExactMatch() {
        setExactMatch(!exactMatch);
    }
    function toggleShowObsoleteTerms() {
        setShowObsoleteTerms(!showObsoleteTerms);
    }
    function clearFilter(currentOptions, setOptions) {
        const newOptions = [...currentOptions];
        setOptions(newOptions.map((option) => ({ ...option, checked: undefined })));
    }
    function clearAllFilters() {
        clearFilter(filterByTypeOptions, setFilterByTypeOptions);
        clearFilter(filterByOntologyOptions, setFilterByOntologyOptions);
    }
    return (React.createElement(React.Fragment, null,
        React.createElement(SearchBarWidget, { api: api, query: searchValue, onSearchValueChange: setSearchValue, parameter: parameter }),
        React.createElement(EuiSpacer, { size: "s" }),
        React.createElement(EuiFlexGroup, null,
            React.createElement(EuiFlexItem, { grow: 3, style: { minWidth: 250 } },
                React.createElement(EuiPanel, null,
                    isSuccess &&
                        React.createElement(EuiFormRow, { label: "Filter by type" },
                            React.createElement(EuiSelectable, { options: filterByTypeOptions, onChange: setFilterByTypeOptions, listProps: { bordered: true } }, (list) => list)),
                    isLoading &&
                        React.createElement(EuiFormRow, { label: "Filter by type" },
                            React.createElement(EuiLoadingSpinner, { size: "s" })),
                    isError &&
                        React.createElement(EuiFormRow, { label: "Filter by type" },
                            React.createElement(EuiSelectable, { options: [], onChange: setFilterByTypeOptions, listProps: { bordered: true } }, (list) => list)),
                    isSuccess &&
                        React.createElement(EuiFormRow, { label: "Filter by ontology" },
                            React.createElement(EuiSelectable, { options: filterByOntologyOptions, onChange: setFilterByOntologyOptions, listProps: { bordered: true }, searchable: true }, (list, search) => (React.createElement(React.Fragment, null,
                                search,
                                list)))),
                    isLoading &&
                        React.createElement(EuiFormRow, { label: "Filter by ontology" },
                            React.createElement(EuiLoadingSpinner, { size: "s" })),
                    isError &&
                        React.createElement(EuiFormRow, { label: "Filter by ontology" },
                            React.createElement(EuiSelectable, { options: [], onChange: setFilterByOntologyOptions, listProps: { bordered: true }, searchable: true }, (list, search) => (React.createElement(React.Fragment, null,
                                search,
                                list)))),
                    React.createElement(EuiButtonEmpty, { onClick: clearAllFilters }, "Clear all filters"))),
            React.createElement(EuiFlexItem, { grow: 7 },
                React.createElement(EuiPanel, { color: "transparent", grow: false },
                    React.createElement(EuiFlexGroup, null,
                        React.createElement(EuiFlexItem, { grow: false },
                            React.createElement(EuiSwitch, { label: "Exact match", checked: exactMatch, onChange: toggleExactMatch })),
                        React.createElement(EuiFlexItem, null,
                            React.createElement(EuiSwitch, { label: "Show only obsolete terms", checked: showObsoleteTerms, onChange: toggleShowObsoleteTerms }))),
                    React.createElement(EuiSpacer, { size: "m" }),
                    React.createElement(EuiText, { size: "xs", style: { padding: "0 8px" } },
                        "Showing ",
                        Math.min(activePage * itemsPerPage + 1, totalItems),
                        " to ",
                        Math.min((activePage + 1) * itemsPerPage, totalItems),
                        " of ",
                        totalItems,
                        " results"),
                    React.createElement(EuiSpacer, { size: "s" }),
                    React.createElement(EuiHorizontalRule, { margin: "none", style: { height: 2 } }),
                    React.createElement(EuiSpacer, { size: "s" }),
                    React.createElement(EuiTablePagination, { "aria-label": "Search result pagination", pageCount: pageCount, activePage: activePage, onChangePage: setActivePage, itemsPerPage: itemsPerPage, onChangeItemsPerPage: onChangeItemsPerPage, itemsPerPageOptions: itemsPerPageOptions }),
                    React.createElement(EuiSpacer, { size: "s" }),
                    searchResults && searchResults.map((result) => (React.createElement(React.Fragment, { key: result.id },
                        React.createElement(MetadataCompact, { api: api, result: result, targetLink: targetLink }),
                        React.createElement(EuiSpacer, null)))))))));
}

const DEFAULT_HAS_TITLE = true;
async function getEntityInfo(olsApi, entityType, iri, ontologyId, parameter) {
    if (entityType == "ontology") {
        const response = await olsApi.getOntology(undefined, undefined, { ontologyId: ontologyId }, parameter);
        return {
            iri: response.config.id,
            versionIri: response.config.versionIri,
            id: response.ontologyId,
            version: response.config.version,
            termNum: response.numberOfTerms,
            lastLoad: response.loaded,
            creators: response.creators,
            annotations: response.config.annotations ? response.config.annotations : [],
            entityTypeName: 'Ontology'
        };
    }
    if (entityType == "term" || entityType == "class") {
        const response = await olsApi.getTerm(undefined, undefined, { ontologyId: ontologyId, termIri: iri }, parameter);
        return {
            label: response._embedded.terms[0].label,
            synonyms: response._embedded.terms[0].synonyms,
            subsets: response._embedded.terms[0].in_subset,
            annotations: response._embedded.terms[0].annotation,
            entityTypeName: 'Term'
        };
    }
    if (entityType == "property") {
        const response = await olsApi.getProperty(undefined, undefined, { ontologyId: ontologyId, propertyIri: iri }, parameter);
        return {
            label: response._embedded.properties[0].label,
            synonyms: response._embedded.properties[0].synonyms,
            annotations: response._embedded.properties[0].annotation,
            entityTypeName: 'Property'
        };
    }
    if (entityType == "individual") {
        const response = await olsApi.getIndividual(undefined, undefined, { ontologyId: ontologyId, individualIri: iri }, parameter);
        return {
            label: response._embedded.individuals[0].label,
            synonyms: response._embedded.individuals[0].synonyms,
            annotations: response._embedded.individuals[0].annotation,
            entityTypeName: 'Individual'
        };
    }
    return {
        label: 'INVALID ENTITY TYPE',
        synonyms: [],
        annotations: {},
        entityTypeName: 'No'
    };
}
function EntityInfoWidget(props) {
    const { api, iri, ontologyId, hasTitle = DEFAULT_HAS_TITLE, entityType, parameter, ...rest } = props;
    const olsApi = new OlsApi(api);
    const { data: entityInfo, isLoading: isLoadingEntityInfo, isSuccess: isSuccessEntityInfo, isError: isErrorEntityInfo, error: errorEntityInfo, } = useQuery([api, iri, ontologyId, entityType, parameter, "entityInfo"], () => {
        return getEntityInfo(olsApi, entityType, iri, ontologyId);
    });
    function generateDisplayItems(item) {
        return (item ?
            item.length > 1 ?
                item.map((element, i) => React.createElement("dd", { key: i }, element.split(",")))
                : item
            : "-");
    }
    return (React.createElement(React.Fragment, null,
        React.createElement(EuiCard, { title: hasTitle ? entityInfo?.entityTypeName + " Information" : "", layout: "horizontal" },
            isLoadingEntityInfo && React.createElement(EuiLoadingSpinner, { size: 's' }),
            isSuccessEntityInfo &&
                React.createElement(EuiText, { ...rest },
                    entityInfo?.iri &&
                        React.createElement(EuiFlexItem, null,
                            React.createElement("b", null, "Ontology IRI:"),
                            React.createElement("p", null, entityInfo.iri.toLocaleString())),
                    entityInfo?.versionIri &&
                        React.createElement(EuiFlexItem, null,
                            React.createElement("b", null, "Version IRI:"),
                            React.createElement("p", null, entityInfo.versionIri.toLocaleString())),
                    entityInfo?.id &&
                        React.createElement(EuiFlexItem, null,
                            React.createElement("b", null, "Ontology ID:"),
                            React.createElement("p", null, entityInfo.id.toLocaleString())),
                    entityInfo?.version &&
                        React.createElement(EuiFlexItem, null,
                            React.createElement("b", null, "Version:"),
                            React.createElement("p", null, entityInfo.version.toLocaleString())),
                    entityInfo?.termNum &&
                        React.createElement(EuiFlexItem, null,
                            React.createElement("b", null, "Number of terms:"),
                            React.createElement("p", null, entityInfo.termNum.toLocaleString())),
                    entityInfo?.lastLoad &&
                        React.createElement(EuiFlexItem, null,
                            React.createElement("b", null, "Last loaded:"),
                            React.createElement("p", null, entityInfo.lastLoad.toLocaleString())),
                    entityInfo?.creators &&
                        React.createElement(React.Fragment, null,
                            React.createElement(EuiFlexItem, null,
                                React.createElement("b", null, "Creators:"),
                                generateDisplayItems(entityInfo?.creators)),
                            React.createElement(EuiSpacer, null)),
                    entityInfo?.label &&
                        React.createElement(EuiFlexItem, null,
                            React.createElement("b", null, "Label:"),
                            React.createElement("p", null, entityInfo?.label)),
                    entityInfo?.synonyms &&
                        React.createElement(React.Fragment, null,
                            React.createElement(EuiFlexItem, null,
                                React.createElement("b", null, "Synonyms:"),
                                generateDisplayItems(entityInfo?.synonyms)),
                            React.createElement(EuiSpacer, null)),
                    entityInfo?.subsets &&
                        React.createElement(React.Fragment, null,
                            React.createElement(EuiFlexItem, null,
                                React.createElement("b", null, "In Subsets:"),
                                generateDisplayItems(entityInfo?.subsets)),
                            React.createElement(EuiSpacer, null)),
                    entityInfo ? Object.entries(entityInfo.annotations).map(([annoKey, annoVal]) => (React.createElement(EuiFlexItem, { grow: false, key: annoKey },
                        React.createElement("b", null,
                            annoKey,
                            ":"),
                        React.createElement("p", null, generateDisplayItems(annoVal))))) : ""),
            isErrorEntityInfo && React.createElement(EuiText, null, getErrorMessageToDisplay(errorEntityInfo, "information")))));
}

function getErrorMessageToDisplay(error, messagePlaceholder = "information") {
    const error_msg = error.message;
    if (error_msg === ("Response contains 0 elements")) {
        return "No elements found";
    }
    else
        return `No ${messagePlaceholder} available`;
}

export { AlternativeNameTabWidget, AutocompleteWidget, BreadcrumbWidget, CrossRefTabWidget, DataContentWidget, DescriptionWidget, EntityInfoWidget, HierarchyWidget, IriWidget, JsonApiWidget, MetadataWidget, OntologyInfoWidget, ResourcesWidget, SearchBarWidget, SearchResultsListWidget, TabWidget, TitleWidget, getErrorMessageToDisplay, getPreferredOntologyJSON };
//# sourceMappingURL=index.js.map
