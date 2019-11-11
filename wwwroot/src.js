//https://nominatim.org/release-docs/develop/api/Search/ //format adresu
window.onload = function init() {

    var parcels = {};

    var newParcelBtn = document.getElementById('addNewParcelButton');
    newParcelBtn.addEventListener("click", addNewParcel);

    var allParcelsBtn = document.getElementById('allParcelsButton');
    allParcelsBtn.addEventListener("click", listAllParcels);

    async function addNewParcel() {
        console.log("Added new parcel.");
        var parcel = {};
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
                parcel['latitude'] = info[0]['lat'];
                parcel['longitude'] = info[0]['lon'];
                L.marker([parcel['latitude'], parcel['longitude']], { title: parcel['description'] }).addTo(map);
            });
        });
        try {
            var data = await postData('https://localhost:5001/api/Parcels', {
                longitude: parcel['longitude'],
                latitude: parcel['latitude'],
                description: parcel['description'],
                country: parcel['country'],
                city: parcel['city'],
                street: parcel['street'],
                postalcode: parcel['postalcode'],
                sendDate: new Date(),
            });
            console.log(JSON.stringify(data));
        } catch (error) {
            console.error(error);
        }
        newParcelBtn.addEventListener("click", addNewParcel);
    }
    async function postData(url, data) {
        return await fetch(url, {
            credentials: 'same-origin',
            method: 'POST',
            body: JSON.stringify(data),
            headers: new Headers({
                'Content-Type': 'application/json'
            }),
        }).then(response => response.json())
    };

    async function listAllParcels() {
        try {
            var data = await fetch('https://localhost:5001/api/Parcels', {
                credentials: 'same-origin',
                method: 'GET',
                body: JSON.stringify(data),
                headers: new Headers({
                    'Content-Type': 'application/json'
                }),
            }).then(response => response.json());
            console.log(JSON.stringify(data));
        } catch (error) {
            console.error(error);
        }
        allParcelsBtn.addEventListener("click", listAllParcels);
    };

    var map = L.map('map').setView([51.505, -0.09], 13);
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox.streets',
        accessToken: 'pk.eyJ1IjoiYW5uYTMiLCJhIjoiY2sybjkzMzZqMG55YjNqbjVmdWU0ZmJ3dyJ9.-ohocMLisbsVBa8ozJV_Bw'
    }).addTo(map);
    L.marker([51.5, -0.09]).addTo(map);
    console.log(document.getElementById("addNewParcelButton"));

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
}
