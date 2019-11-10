//https://nominatim.org/release-docs/develop/api/Search/ //format adresu
window.onload = function init() {

    var parcels = {};

    function addNewParcel() {
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
                parcels.push(parcel);
            });
        });
    }


    var map = L.map('map').setView([51.505, -0.09], 13);
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox.streets',
        accessToken: 'pk.eyJ1IjoiYW5uYTMiLCJhIjoiY2sybjkzMzZqMG55YjNqbjVmdWU0ZmJ3dyJ9.-ohocMLisbsVBa8ozJV_Bw'
    }).addTo(map);
    L.marker([51.5, -0.09]).addTo(map);
    document.getElementById("addNewParcelButton").addEventListener("click", addNewParcel);
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
