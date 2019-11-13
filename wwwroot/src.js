window.onload = function init() {

    var parcels = [];
    var parcelList = document.getElementById("parcelList");

    var addParcelToggle = document.getElementById("addNewParcelToggle");

    var newParcelBtn = document.getElementById('addNewParcelButton');
    newParcelBtn.addEventListener("click", addNewParcel);

    var allParcelsBtn = document.getElementById('allParcelsToggle');
    allParcelsBtn.addEventListener("click", function () {
        if (!allParcelsBtn.classList.contains("active")) {
            UpdateParcelList();
        }
    });

    var map = L.map('map').setView([52.25, 21], 13);
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox.streets',
        accessToken: 'pk.eyJ1IjoiYW5uYTMiLCJhIjoiY2sybjkzMzZqMG55YjNqbjVmdWU0ZmJ3dyJ9.-ohocMLisbsVBa8ozJV_Bw'
    }).addTo(map);

    var cl = document.getElementsByClassName("collapsible");
    for (i = 0; i < cl.length; i++) {
        cl[i].addEventListener("click", function () {
            this.classList.toggle("active");
            var content = this.nextElementSibling;
            if (content.style.maxHeight) {
                content.style.maxHeight = null;
            }
            else {
                content.style.maxHeight = content.scrollHeight + "px";
            }
        });
    }

    addParcelToggle.click();

    UpdateParcelList();

    async function addNewParcel() {
        console.log("Adding new parcel.");
        let parcel = {};
        parcel['country'] = document.getElementById("addCountryInput").value;
        parcel['city'] = document.getElementById("addCityInput").value;
        parcel['street'] = document.getElementById("addStreetInput").value;
        parcel['postalCode'] = document.getElementById("addPostalCodeInput").value;
        parcel['description'] = document.getElementById("addDescriptionInput").value;

        if (Validate(parcel) == false) {
            return;
        }

        var uri = "https://nominatim.openstreetmap.org/?format=json&addressdetails=1&limit=1&q=" + parcel['street']
            + "," + parcel['postalCode'] + "," + parcel['city'] + "," + parcel['country'];
        uri = encodeURI(uri);

        fetch(uri, { method: 'POST' }).then(resp => {
            resp.json().then(info => {
                if (info.length == 0) {
                    errorLabel.className = "errorActive";
                    errorLabel.textContent = "Can't find provided address";
                    RefreshForm(false);
                    return;
                }
                let address = info[0]['address'];
                parcel['country'] = address['country'];
                if (address['city']) {
                    parcel['city'] = address['city'];
                }
                else if (address['town']) {
                    parcel['city'] = address['town'];
                }
                parcel['street'] = address['road'];
                if (address['house_number']) {
                    parcel['street'] += " " + address['house_number'];
                }
                parcel['postalCode'] = address['postcode'];
                parcel['latitude'] = info[0]['lat'];
                parcel['longitude'] = info[0]['lon'];
                console.log(info);
                fetch('api/Parcels', {
                    method: 'POST',
                    body: JSON.stringify(parcel),
                    headers: new Headers({
                        'Content-Type': 'application/json'
                    })
                }).then(UpdateParcelList);
            });
        });
    }

    function Validate(parcel, isEdit) {
        let errorLabel = document.getElementById("errorLabel");
        if (isEdit) {
            errorLabel = document.getElementById("editErrorLabel");
        }

        let error = false;
        if (parcel['country'] == "") {
            errorLabel.textContent = "Please enter valid country";
            error = true;
        }
        else if (parcel['city'] == "") {
            errorLabel.textContent = "Please enter valid city";
            error = true;
        }
        else if (parcel['street'] == "") {
            errorLabel.textContent = "Please enter valid street";
            error = true;
        }
        else if (parcel['postalcode'] == "") {
            errorLabel.textContent = "Please enter valid postalcode";
            error = true;
        }
        if (error) {
            errorLabel.className = "errorActive";
            RefreshForm(isEdit);
            return false;
        }

        errorLabel.className = "errorInactive";
        RefreshForm(isEdit);
        return true;
    }

    function RefreshForm(isEdit) {
        let content = addParcelToggle.nextElementSibling;
        if (isEdit) {
            content = parcelList;
        }
        content.style.maxHeight = content.scrollHeight + "px";
    }

    async function UpdateParcelList() {
        fetch('api/Parcels', {
            credentials: 'same-origin',
            method: 'GET',
            headers: new Headers({
                'Content-Type': 'application/json'
            }),
        }).then(resp => {
            resp.json().then(data => {
                for (i = 0; i < parcels.length; i++) {
                    let parcel = parcels[i];
                    map.removeLayer(parcel['marker']);
                    parcelList.removeChild(parcel['div'].parentNode);
                }

                console.log(data);
                parcels = data;
                allParcelsBtn.innerText = "All parcels (" + parcels.length + " available)";

                for (i = 0; i < parcels.length; i++) {
                    let parcel = parcels[i];
                    parcel['marker'] = L.marker([parcel['latitude'], parcel['longitude']], { title: parcel['description'] });
                    parcel['marker'].addTo(map);
                    let parcelDiv = document.createElement("div");
                    parcelDiv.className = "parcel";
                    parcel['div'] = document.createElement("div");
                    parcel['div'].className = "parcelInfo";

                    parcelDiv.appendChild(parcel['div']);

                    let deleteButton = document.createElement("button");
                    deleteButton.innerText = "Delete";
                    deleteButton.className = "deleteButton";
                    deleteButton.addEventListener("click", function () {
                        RemoveParcel(parcel);
                    });
                    parcel['div'].appendChild(deleteButton);

                    let editButton = document.createElement("button");
                    editButton.innerText = "Edit";
                    editButton.className = "editButton";
                    parcel['div'].appendChild(editButton);

                    editButton.addEventListener("click", function () {
                        StartEdit(parcel);
                    });

                    if (parcel['description'] != "") {
                        let description = document.createElement("h4");
                        description.className = "parcelText";
                        description.innerText = '"' + parcel['description'] + '"';
                        parcel['div'].appendChild(description);
                        parcel['div'].appendChild(document.createElement("br"));
                    }

                    let street = document.createElement("h4");
                    street.className = "parcelText";
                    street.innerText = parcel['street'];
                    parcel['div'].appendChild(street);
                    parcel['div'].appendChild(document.createElement("br"));

                    let city = document.createElement("h4");
                    city.className = "parcelText";
                    city.innerText = parcel['postalCode'] + " " + parcel['city'];
                    parcel['div'].appendChild(city);
                    parcel['div'].appendChild(document.createElement("br"));

                    let country = document.createElement("h4");
                    country.className = "parcelText";
                    country.innerText = parcel['country'];
                    parcel['div'].appendChild(country);

                    parcelList.appendChild(parcel['div'].parentNode);
                }
                RefreshList();
            });
        });
    };


    function ClearEdit() {
        let currentEditMenu = document.getElementById("editMenu");
        if (currentEditMenu) {
            currentEditMenu.parentNode.firstChild.style.display = "block";
            currentEditMenu.parentNode.removeChild(currentEditMenu);
        }
    }

    function StartEdit(parcel) {
        ClearEdit();
        let editMenu = document.createElement("div");
        editMenu.className = "content";
        editMenu.id = "editMenu";
        parcel['div'].parentNode.appendChild(editMenu);
        parcel['div'].style.display = "none";

        let errorLabel = document.createElement("label");
        errorLabel.id = "editErrorLabel";
        errorLabel.className = "errorInactive";
        editMenu.appendChild(errorLabel);

        //Country
        let formRow = document.createElement("div");
        formRow.className = "formRow";

        let label = document.createElement("label")
        label.innerText = "Country";
        label.className = "formFieldName";
        formRow.appendChild(label);

        let input = document.createElement("input");
        input.className = "formFieldInput";
        input.type = "text";
        input.id = "editCountryInput";
        input.value = parcel['country'];
        formRow.appendChild(input);

        editMenu.appendChild(formRow);

        //City
        formRow = document.createElement("div");
        formRow.className = "formRow";

        label = document.createElement("label")
        label.innerText = "City";
        label.className = "formFieldName";
        formRow.appendChild(label);

        input = document.createElement("input");
        input.className = "formFieldInput";
        input.type = "text";
        input.id = "editCityInput";
        input.value = parcel['city'];
        formRow.appendChild(input);

        editMenu.appendChild(formRow);

        //Street
        formRow = document.createElement("div");
        formRow.className = "formRow";

        label = document.createElement("label")
        label.innerText = "Street";
        label.className = "formFieldName";
        formRow.appendChild(label);

        input = document.createElement("input");
        input.className = "formFieldInput";
        input.type = "text";
        input.id = "editStreetInput";
        input.value = parcel['street'];
        formRow.appendChild(input);

        editMenu.appendChild(formRow);

        //Postalcode
        formRow = document.createElement("div");
        formRow.className = "formRow";

        label = document.createElement("label")
        label.innerText = "Postal code";
        label.className = "formFieldName";
        formRow.appendChild(label);

        input = document.createElement("input");
        input.className = "formFieldInput";
        input.type = "text";
        input.id = "editPostalCodeInput";
        input.value = parcel['postalCode'];
        formRow.appendChild(input);

        editMenu.appendChild(formRow);

        //Description
        formRow = document.createElement("div");
        formRow.className = "formRow";

        label = document.createElement("label")
        label.innerText = "Description";
        label.className = "formFieldName";
        formRow.appendChild(label);

        input = document.createElement("input");
        input.className = "formFieldInput";
        input.type = "text";
        input.id = "editDescriptionInput";
        input.value = parcel['description'];
        formRow.appendChild(input);

        editMenu.appendChild(formRow);

        let button = document.createElement("button");
        button.innerText = "Confirm";
        button.className = "okButton";
        button.addEventListener("click", function () {
            EditParcel(parcel);
        });
        editMenu.appendChild(button);

        button = document.createElement("button");
        button.innerText = "Cancel";
        button.className = "deleteButton";
        button.addEventListener("click", ClearEdit);
        editMenu.appendChild(button);

        RefreshList();
    }

    async function EditParcel(parcel) {
        let editedParcel = {};
        let errorLabel = document.getElementById("editErrorLabel");
        editedParcel['id'] = parcel['id'];
        editedParcel['sendDate'] = parcel['sendDate'];
        editedParcel['country'] = document.getElementById("editCountryInput").value;
        editedParcel['city'] = document.getElementById("editCityInput").value;
        editedParcel['street'] = document.getElementById("editStreetInput").value;
        editedParcel['postalCode'] = document.getElementById("editPostalCodeInput").value;
        editedParcel['description'] = document.getElementById("editDescriptionInput").value;

        if (!Validate(editedParcel, true)) return;

        var uri = "https://nominatim.openstreetmap.org/?format=json&addressdetails=1&limit=1&q=" + editedParcel['street']
            + "," + editedParcel['postalCode'] + "," + editedParcel['city'] + "," + editedParcel['country'];
        uri = encodeURI(uri);

        fetch(uri, { method: 'POST' }).then(resp => {
            resp.json().then(info => {
                if (info.length == 0) {
                    errorLabel.className = "errorActive";
                    errorLabel.textContent = "Can't find provided address";
                    RefreshForm(true);
                    return;
                }
                let address = info[0]['address'];
                editedParcel['country'] = address['country'];
                if (address['city']) {
                    editedParcel['city'] = address['city'];
                }
                else if (address['town']) {
                    editedParcel['city'] = address['town'];
                }
                editedParcel['street'] = address['road'];
                if (address['house_number']) {
                    editedParcel['street'] += " " + address['house_number'];
                }
                editedParcel['postalCode'] = address['postcode'];
                editedParcel['latitude'] = info[0]['lat'];
                editedParcel['longitude'] = info[0]['lon'];
                console.log(info);
                fetch('api/Parcels/' + parcel['id'], {
                    method: 'PUT',
                    body: JSON.stringify(editedParcel),
                    headers: new Headers({
                        'Content-Type': 'application/json'
                    })
                }).then(UpdateParcelList);
            });
        });
    }


    async function RemoveParcel(parcel) {
        fetch('api/Parcels/' + parcel['id'], {
            credentials: 'same-origin',
            method: 'DELETE',
            headers: new Headers({
                'Content-Type': 'application/json'
            }),
        }).then(resp => {
            UpdateParcelList();
        });
    }

    function RefreshList() {
        if (parcelList.style.maxHeight) {
            parcelList.style.maxHeight = parcelList.scrollHeight + "px";
        }
    }
}
