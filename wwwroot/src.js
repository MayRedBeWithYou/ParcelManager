//https://nominatim.org/release-docs/develop/api/Search/ //format adresu
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
        //document.getElementById("noAddressError").className = "errorInactive";
        console.log("Adding new parcel.");
        let parcel = {};
        parcel['country'] = document.getElementById("addCountryInput").value;
        parcel['city'] = document.getElementById("addCityInput").value;
        parcel['street'] = document.getElementById("addStreetInput").value;
        parcel['postalcode'] = document.getElementById("addPostalCodeInput").value;
        parcel['description'] = document.getElementById("addDescriptionInput").value;

        var uri = "https://nominatim.openstreetmap.org/?format=json&limit=1&q=" + parcel['street']
            + "," + parcel['postalcode'] + "," + parcel['city'] + "," + parcel['country'];
        uri = encodeURI(uri);

        fetch(uri, { method: 'POST' }).then(resp => {
            resp.json().then(info => {
                if (info.length == 0) {
                    //document.getElementById("noAddressError").className = "errorActive";
                    return;
                }
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
                    parcelList.removeChild(parcel['div']);
                }

                console.log(data);
                parcels = data;
                allParcelsBtn.innerText = "All parcels (" + parcels.length + " available)";

                for (i = 0; i < parcels.length; i++) {
                    let parcel = parcels[i];
                    parcel['marker'] = L.marker([parcel['latitude'], parcel['longitude']], { title: parcel['description'] });
                    parcel['marker'].addTo(map);
                    parcel['div'] = document.createElement("div");
                    parcel['div'].className = "parcelInfo";

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

                    parcelList.appendChild(parcel['div']);
                }
                RefreshList();
            });
        });
    };

    function RemoveParcel(parcel) {
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
