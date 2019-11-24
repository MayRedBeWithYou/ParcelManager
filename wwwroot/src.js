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
    var polyline = {};
    var points = [];
    var calculateRouteButton = document.getElementById('calculateRouteButton');
    calculateRouteButton.addEventListener("click", calculateRoute);

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
        let parcel = {};
        parcel['country'] = document.getElementById("addCountryInput").value;
        parcel['city'] = document.getElementById("addCityInput").value;
        parcel['street'] = document.getElementById("addStreetInput").value;
        parcel['postalCode'] = document.getElementById("addPostalCodeInput").value;
        parcel['weight'] = document.getElementById("addWeightInput").value;

        if (Validate(parcel, false) == false) {
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
            errorLabel.textContent = "Please enter valid postal code";
            error = true;
        }
        else if (parcel['weight'] == 0) {
            errorLabel.textContent = "Please enter valid weight";
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

                parcels = data;
                allParcelsBtn.innerText = "All parcels (" + parcels.length + " available)";

                for (i = 0; i < parcels.length; i++) {
                    let parcel = parcels[i];
                    parcel['marker'] = L.marker([parcel['latitude'], parcel['longitude']], { title: parcel['weight'] });
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

                    let weight = document.createElement("label");
                    weight.className = "parcelText";
                    weight.innerText = parcel['weight'] + "kg";
                    parcel['div'].appendChild(weight);


                    let street = document.createElement("label");
                    street.className = "parcelText";
                    street.innerText = parcel['street'];
                    parcel['div'].appendChild(street);

                    let city = document.createElement("label");
                    city.className = "parcelText";
                    city.innerText = parcel['postalCode'] + " " + parcel['city'];
                    parcel['div'].appendChild(city);

                    let country = document.createElement("label");
                    country.className = "parcelText";
                    country.innerText = parcel['country'];
                    parcel['div'].appendChild(country);

                    parcelList.appendChild(parcel['div'].parentNode);

                    parcelPopup = document.createElement("div");
                    parcelPopup.appendChild(weight.cloneNode(true));
                    parcelPopup.appendChild(street.cloneNode(true));
                    parcelPopup.appendChild(city.cloneNode(true));
                    parcelPopup.appendChild(country.cloneNode(true));
                    parcel['marker'].bindPopup(parcelPopup);
                }
                RefreshList();
            });
        });
    };


    function ClearEdit() {
        let currentEditMenu = document.getElementById("editMenu");
        if (currentEditMenu) {
            currentEditMenu.parentNode.firstChild.className = "parcelInfo";
            currentEditMenu.parentNode.removeChild(currentEditMenu);
        }
    }

    function StartEdit(parcel) {
        ClearEdit();
        let editMenu = document.createElement("form");
        editMenu.className = "content";
        editMenu.id = "editMenu";
        editMenu.action = "javascript:void(0)"
        editMenu.name = "editForm";
        parcel['div'].parentNode.appendChild(editMenu);
        parcel['div'].className = "parcelInfo hidden";

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

        //Weight
        formRow = document.createElement("div");
        formRow.className = "formRow";

        label = document.createElement("label")
        label.innerText = "Weight";
        label.className = "formFieldName";
        formRow.appendChild(label);

        input = document.createElement("input");
        input.className = "formFieldInput";
        input.type = "number";
        input.id = "editWeightInput";
        input.step = "0.01";
        input.value = parcel['weight'];
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
        button.type = "reset";
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
        editedParcel['weight'] = document.getElementById("editWeightInput").value;

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
                fetch('api/Parcels/' + parcel['id'], {
                    method: 'PUT',
                    body: JSON.stringify(editedParcel),
                    headers: new Headers({
                        'Content-Type': 'application/json'
                    })
                }).then(UpdateParcelList);

                map.removeLayer(polyline);
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

            map.removeLayer(polyline);
        });
    }

    function RefreshList() {
        if (parcelList.style.maxHeight) {
            parcelList.style.maxHeight = parcelList.scrollHeight + "px";
        }
    }

    function calculateRoute() {

        var waypoints = [];
        for (i = 0; i < parcels.length; i++) {
            waypoints.push(L.latLng(parcels[i]['latitude'], parcels[i]['longitude']));
        }

        var route = L.Routing.control({
            waypoints: waypoints,
            show: false,
            routeWhileDragging: false,
        }).on('routesfound', function (e) {
            var coords = e.routes[0].coordinates;
            console.log(coords);
            points = [];
            for (i = 0; i < coords.length; i++) {
                points.push(coords[i]);
            }
            map.removeLayer(polyline);
            polyline = L.polyline(points, { color: 'red' });
            polyline.addTo(map);
        });
        route.route();
    }
}
