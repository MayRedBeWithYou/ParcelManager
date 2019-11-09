//https://nominatim.org/release-docs/develop/api/Search/ //format adresu
window.onload = function init() {

    function addNewParcel() {
        console.log("Added new parcel.");
        var parcel = {};
        parcel['country'] = document.getElementById("addCountryInput").value;
        parcel['city'] = document.getElementById("addCityInput").value;
        parcel['street'] = document.getElementById("addStreetInput").value;
        parcel['postalcode'] = document.getElementById("addPostalCodeInput").value;
        parcel['description'] = document.getElementById("addDescriptionInput").value;
        console.log(parcel);
        fetch("api/parcel/add", { method: 'POST' });
    }

    var map = L.map('map').setView([51.505, -0.09], 13);
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox.streets',
        accessToken: 'pk.eyJ1IjoiYW5uYTMiLCJhIjoiY2sybjkzMzZqMG55YjNqbjVmdWU0ZmJ3dyJ9.-ohocMLisbsVBa8ozJV_Bw'
    }).addTo(map);
    var marker = L.marker([51.5, -0.09]).addTo(map); //znacznik
    document.getElementById("addNewParcelButton").addEventListener("click", addNewParcel);
    console.log(document.getElementById("addNewParcelButton"));
}
